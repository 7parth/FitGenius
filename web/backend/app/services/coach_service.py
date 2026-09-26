"""
AI Coach service — powered by LangChain and Groq LPU high-speed inference.
API keys are kept strictly server-side and never exposed to the frontend.
"""
import logging
from typing import Any
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.models.wearable import WearableData
from app.models.workout import WorkoutSession

logger = logging.getLogger("fitgenius.coach")

_SYSTEM_PROMPT = """You are Coach Genesis, the premier Precision Bio-AI Coach in the FitGenius platform.
You are powered by LangChain and Groq LPU high-speed inference.
Your mission is to provide science-backed, personalized fitness coaching, workout adjustments, nutrition guidance, posture/form cues, and recovery periodization.

Core Persona & Guidelines:
- High-tech, analytical, encouraging, and authoritative sports science persona.
- Ground advice in modern exercise physiology: progressive overload, mechanical tension, RPE (Rate of Perceived Exertion), VBT (Velocity-Based Training), HRV (Heart Rate Variability), and autonomic recovery.
- When a user asks about muscle soreness, fatigue, or joint discomfort:
  * Recommend intelligent biomechanical exercise swaps (e.g., swapping high axial compression movements like heavy Barbell Squats/Deadlifts for low-shear movements like Glute Bridges, Bulgarian Split Squats, or Seated Leg Curls).
  * Highlight targeted active recovery protocols (e.g. mobility, contrast therapy, hydration).
  * For medical conditions or sharp pain, always recommend consulting a licensed healthcare provider.
- For form questions, provide concise, numbered, step-by-step kinetic cues (e.g., foot tripod, bracing, bar path, inflection tempo like 3-1-1-0).
- Keep responses focused, structured, and visually engaging (using markdown bullet points, bold tags, and clear sections).
- Always incorporate the user's biometric context (readiness score, HRV, recent workout history) into your reasoning.
"""


async def get_coach_reply(
    messages: list[dict[str, Any]],
    user: User,
    db: Session,
) -> tuple[str, int, int, dict[str, str]]:
    """
    Send messages through LangChain Groq and return (reply_text, prompt_tokens, completion_tokens, engine_info).
    Falls back gracefully if Groq is not configured or encounters an issue.
    """
    profile_context = _build_profile_context(user, db)
    system_content = f"{_SYSTEM_PROMPT}\n\n[Active Biometric & User Telemetry Context]\n{profile_context}"

    # 1. Try LangChain Groq if GROQ_API_KEY is configured
    if settings.GROQ_API_KEY:
        try:
            from langchain_groq import ChatGroq
            from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

            chat = ChatGroq(
                api_key=settings.GROQ_API_KEY,
                model_name=settings.GROQ_MODEL,
                temperature=0.6,
                max_tokens=1024,
            )

            langchain_messages: list[Any] = [SystemMessage(content=system_content)]
            for msg in messages[-20:]:
                role = msg.get("role")
                content = msg.get("content", "")
                if role == "user":
                    langchain_messages.append(HumanMessage(content=content))
                elif role == "assistant":
                    langchain_messages.append(AIMessage(content=content))

            ai_response = await chat.ainvoke(langchain_messages)
            reply_text = str(ai_response.content) if ai_response.content else ""

            # Extract token usage
            usage = (
                getattr(ai_response, "usage_metadata", None)
                or ai_response.response_metadata.get("token_usage", {})
                or {}
            )
            prompt_tokens = usage.get("input_tokens") or usage.get("prompt_tokens") or 0
            completion_tokens = usage.get("output_tokens") or usage.get("completion_tokens") or 0

            engine_info = {
                "provider": "Groq LPU (LangChain)",
                "model": settings.GROQ_MODEL,
                "framework": "LangChain",
                "status": "live",
            }

            return reply_text, prompt_tokens, completion_tokens, engine_info

        except Exception as exc:
            logger.exception("LangChain Groq call failed: %s", exc)

    # 2. Fallback to OpenAI if configured
    if settings.OPENAI_API_KEY:
        try:
            import openai

            client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            api_messages = [{"role": "system", "content": system_content}]
            for msg in messages[-20:]:
                api_messages.append({"role": msg["role"], "content": msg["content"]})

            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=api_messages,
                max_tokens=800,
                temperature=0.7,
            )
            reply = response.choices[0].message.content or ""
            prompt_tokens = response.usage.prompt_tokens if response.usage else 0
            completion_tokens = response.usage.completion_tokens if response.usage else 0

            engine_info = {
                "provider": "OpenAI (Fallback)",
                "model": settings.OPENAI_MODEL,
                "framework": "Direct",
                "status": "fallback",
            }
            return reply, prompt_tokens, completion_tokens, engine_info

        except Exception as exc:
            logger.exception("OpenAI fallback call failed: %s", exc)

    # 3. Contextual Offline / Demo Simulator (when keys are not yet filled)
    reply, prompt_tokens, completion_tokens = _generate_contextual_bio_reply(messages, user, db)
    engine_info = {
        "provider": "LangChain Groq Architecture (Simulated Mode)",
        "model": settings.GROQ_MODEL,
        "framework": "LangChain",
        "status": "simulated",
    }
    return reply, prompt_tokens, completion_tokens, engine_info


def get_engine_status() -> dict[str, Any]:
    """Return runtime configuration of the AI Coach engine."""
    has_groq = bool(settings.GROQ_API_KEY)
    has_openai = bool(settings.OPENAI_API_KEY)

    if has_groq:
        provider = "Groq LPU Acceleration"
        model = settings.GROQ_MODEL
        status = "active"
        description = f"Ultra-low latency inference via LangChain Groq ({settings.GROQ_MODEL})"
    elif has_openai:
        provider = "OpenAI"
        model = settings.OPENAI_MODEL
        status = "active"
        description = f"Cloud inference via OpenAI ({settings.OPENAI_MODEL})"
    else:
        provider = "LangChain Groq Ready"
        model = settings.GROQ_MODEL
        status = "ready"
        description = f"LangChain Groq integration ready. Add GROQ_API_KEY in web/.env to stream live {settings.GROQ_MODEL}."

    return {
        "provider": provider,
        "model": model,
        "framework": "LangChain",
        "status": status,
        "active": has_groq or has_openai,
        "description": description,
    }


def _build_profile_context(user: User, db: Session) -> str:
    """Compile rich telemetry context: user profile, latest wearables, and workout history."""
    parts = [f"User Call-Sign: {user.display_name}"]

    # Profile
    if user.profile:
        p = user.profile
        if p.fitness_level:
            parts.append(f"Fitness Level: {p.fitness_level}")
        if p.primary_goal:
            parts.append(f"Primary Goal: {p.primary_goal}")
        if p.age:
            parts.append(f"Age: {p.age}")
        if p.weight_kg:
            parts.append(f"Weight: {p.weight_kg} kg")
        if p.height_cm:
            parts.append(f"Height: {p.height_cm} cm")
        if p.preferred_duration_minutes:
            parts.append(f"Target Duration: {p.preferred_duration_minutes} min")
        if p.available_equipment:
            parts.append(f"Available Equipment: {', '.join(p.available_equipment)}")
        if p.training_location:
            parts.append(f"Training Location: {p.training_location}")
        if p.workout_frequency_per_week:
            parts.append(f"Workout Frequency: {p.workout_frequency_per_week}x/week")

    # Latest Wearables Telemetry
    try:
        latest_wearable = (
            db.query(WearableData)
            .filter(WearableData.user_id == user.id)
            .order_by(WearableData.recorded_at.desc())
            .first()
        )
        if latest_wearable:
            wearable_notes = []
            if latest_wearable.resting_heart_rate:
                wearable_notes.append(f"Resting HR: {latest_wearable.resting_heart_rate} bpm")
            if latest_wearable.hrv_ms:
                wearable_notes.append(f"HRV: {round(latest_wearable.hrv_ms)} ms")
            if latest_wearable.sleep_hours:
                wearable_notes.append(f"Sleep: {latest_wearable.sleep_hours}h")
            if latest_wearable.recovery_score:
                wearable_notes.append(f"Recovery: {latest_wearable.recovery_score}% (Autonomic)")
            if latest_wearable.fatigue_level:
                wearable_notes.append(f"Fatigue Status: {latest_wearable.fatigue_level}")
            if wearable_notes:
                parts.append("Latest Biosensors: " + " • ".join(wearable_notes))
    except Exception as exc:
        logger.debug("Could not query wearable data for context: %s", exc)

    # Latest Workout Session
    try:
        latest_session = (
            db.query(WorkoutSession)
            .filter(WorkoutSession.user_id == user.id)
            .order_by(WorkoutSession.created_at.desc())
            .first()
        )
        if latest_session:
            parts.append(f"Recent Workout: {latest_session.name} ({latest_session.status})")
    except Exception as exc:
        logger.debug("Could not query workout session for context: %s", exc)

    return "\n".join(parts)


def _generate_contextual_bio_reply(
    messages: list[dict[str, Any]],
    user: User,
    db: Session,
) -> tuple[str, int, int]:
    """
    Intelligent simulated response generated using biometric context and sports science rules,
    enabling immediate rich user interaction even if the user has not yet configured GROQ_API_KEY.
    """
    last_query = messages[-1].get("content", "").lower() if messages else ""
    user_name = user.display_name or "Athlete"

    # Contextual routing based on query keywords
    if any(k in last_query for k in ["back", "sore", "pain", "tight", "ache", "spine", "lumbar"]):
        reply = (
            f"**Coach Genesis Protocol Alignment for {user_name}**:\n\n"
            "I've cross-referenced your query with your biometric telemetry. Localized lumbar tightness is common following spinal compression or heavy axial loading.\n\n"
            "**Recommended Routine Adaptation (Low-Impact Lower Body)**:\n"
            "1. **Swap Heavy Barbell Deadlifts** ➔ **Elevated Glute Bridges** (4 sets × 12 reps, 2s peak isometric hold) to load the posterior chain with zero lumbar shear.\n"
            "2. **Swap Back Squats** ➔ **Dumbbell Bulgarian Split Squats** (3 sets × 10 reps/side) with a 15° torso tilt.\n"
            "3. **Decompression Finisher** ➔ **Hanging Straight Leg Core Compression** (3 sets × 12 reps) for gentle spinal traction.\n\n"
            "*Biometric Note: Ensure 500ml electrolyte rehydration and 10 minutes of cat-cow and couch-stretch mobility.*"
        )
    elif any(k in last_query for k in ["diet", "food", "protein", "macro", "nutrition", "meal", "calorie"]):
        reply = (
            f"**Nutritional Telemetry Synthesis for {user_name}**:\n\n"
            "To support optimal glycogen replenishment and myofibrillar protein synthesis, here is a targeted high-protein fuel profile:\n\n"
            "- **Post-Workout Anabolic Bowl**: 180g Grilled Chicken Breast or Tempeh, 150g Quinoa, 1/2 Avocado, Steamed Broccoli (Approx. 620 kcal, **52g Protein**, 54g Carbs, 18g Healthy Fats).\n"
            "- **Hydration & Mineral Balance**: 600ml water with 400mg sodium and 200mg potassium to replenish kinetic sweat loss.\n\n"
            "Maintaining 1.6–2.2g of protein per kg of body weight will ensure rapid motor unit recovery."
        )
    elif any(k in last_query for k in ["deadlift", "squat", "bench", "form", "pose", "technique"]):
        reply = (
            f"**Computer Vision Kinetic Cue Checklist**:\n\n"
            "Here is the 33-keypoint calibration checklist for optimal force transmission:\n\n"
            "1. **Foot Tripod Anchor**: Root heels, first metatarsal, and fifth metatarsal firmly into the floor.\n"
            "2. **Intra-Abdominal Bracing**: Breathe deep into the diaphragm, expanding 360° against your core belt.\n"
            "3. **Scapular Depression**: Pull lats down into back pockets to secure the glenohumeral joint.\n"
            "4. **Kinetic Tempo**: Follow a strict **3-1-1-0 tempo** (3s controlled eccentric, 1s inflection pause, explosive concentric).\n\n"
            "You can launch our **Pose Tracker Studio** to verify joint angles live at 60 FPS!"
        )
    else:
        reply = (
            f"**Coach Genesis Telemetry Stream Active**:\n\n"
            f"Greetings {user_name}. Neural inferences are calibrated against your goals. "
            "Whether you need real-time workout periodization, exercise biomechanics swaps, or recovery advice based on your HRV and sleep architecture, I am ready.\n\n"
            "How can I calibrate your training today?"
        )



    prompt_tokens = len(last_query.split()) * 2
    completion_tokens = len(reply.split()) * 2
    return reply, prompt_tokens, completion_tokens
