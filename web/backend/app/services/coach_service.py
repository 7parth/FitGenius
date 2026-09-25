"""
AI Coach service — calls OpenAI on the server side only.
The API key is never exposed to the frontend or API responses.
"""
import logging
from typing import Any
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User

logger = logging.getLogger("fitgenius.coach")

_SYSTEM_PROMPT = """You are FitGenius AI Coach — a knowledgeable, supportive fitness assistant.
You help users with workout planning, form tips, nutrition basics, motivation, and recovery.

Guidelines:
- Be encouraging and empathetic, but keep advice evidence-based.
- For medical conditions or injuries, always recommend consulting a healthcare professional.
- Never prescribe medications or diagnose medical conditions.
- Keep responses concise (2–4 paragraphs) unless the user asks for detail.
- Reference the user's fitness level and goals when relevant.
- For exercise form questions, give clear step-by-step cues.
"""


async def get_coach_reply(
    messages: list[dict[str, Any]],
    user: User,
    db: Session,
) -> tuple[str, int, int]:
    """
    Send messages to OpenAI and return (reply_text, prompt_tokens, completion_tokens).
    Falls back to a helpful error message if OpenAI is unavailable.
    """
    if not settings.OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not configured — returning fallback response")
        return _fallback_reply(), 0, 0

    try:
        import openai

        client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        # Build context header from user profile
        profile_context = _build_profile_context(user, db)

        system_content = _SYSTEM_PROMPT
        if profile_context:
            system_content += f"\n\nUser context:\n{profile_context}"

        api_messages = [{"role": "system", "content": system_content}]
        # Keep last 20 messages to stay within token budget
        for msg in messages[-20:]:
            api_messages.append({"role": msg["role"], "content": msg["content"]})

        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=api_messages,
            max_tokens=600,
            temperature=0.7,
        )

        reply = response.choices[0].message.content or ""
        prompt_tokens = response.usage.prompt_tokens if response.usage else 0
        completion_tokens = response.usage.completion_tokens if response.usage else 0

        return reply, prompt_tokens, completion_tokens

    except Exception as exc:
        logger.exception("OpenAI call failed: %s", exc)
        return _fallback_reply(), 0, 0


def _build_profile_context(user: User, db: Session) -> str:
    parts = [f"Name: {user.display_name}"]
    if user.profile:
        p = user.profile
        if p.fitness_level:
            parts.append(f"Fitness level: {p.fitness_level}")
        if p.primary_goal:
            parts.append(f"Primary goal: {p.primary_goal}")
        if p.age:
            parts.append(f"Age: {p.age}")
        if p.preferred_duration_minutes:
            parts.append(f"Preferred session length: {p.preferred_duration_minutes} min")
        if p.available_equipment:
            parts.append(f"Available equipment: {', '.join(p.available_equipment)}")
    return "\n".join(parts)


def _fallback_reply() -> str:
    return (
        "I'm sorry, I'm having trouble connecting right now. "
        "Please try again in a moment. In the meantime, feel free to browse "
        "your workout plans and exercise library!"
    )
