"""
Recommendation Engine — three-stage hybrid system.

Stage 1  (rule-based)     : cold-start, < 3 completed sessions
Stage 2  (content-based)  : 3–19 completed sessions
Stage 3  (ML hybrid)      : 20+ sessions — TruncatedSVD (see ml_recommender.py)

Entry point: get_recommendation(user, db, context_override) → Recommendation (unsaved)

Design constraints:
- All DB queries via SQLAlchemy ORM (no raw SQL string interpolation)
- Redis caches recommendation payload for 30 min (per-user key)
- Fatigue level fed in from wearable_service to adjust intensity
- Accessibility restrictions enforced via exercise_service
"""

from __future__ import annotations

import json
import random
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.recommendation import Recommendation, RecommendationStage
from app.models.workout import WorkoutSession, SessionStatus
from app.models.exercise import Exercise
from app.models.profile import UserProfile
from app.core.redis_client import get_redis
from app.services.exercise_service import get_eligible_exercises, get_exercises_for_goal
from app.services.wearable_service import get_latest_fatigue, fatigue_intensity_modifier

logger = logging.getLogger("fitgenius.ml")

_CACHE_TTL = 1800   # 30 minutes
_EXERCISES_PER_PLAN = 6


# ── Public entry-point ─────────────────────────────────────────────────────────

def get_recommendation(
    user: User,
    db: Session,
    context_override: dict[str, Any] | None = None,
) -> Recommendation:
    """
    Select the appropriate stage, generate a recommendation, and return an
    unsaved Recommendation ORM object. The caller is responsible for db.add/commit.
    """
    cache_key = f"rec:{user.id}"
    redis = get_redis()

    # Try cache
    if redis and not context_override:
        cached = redis.get(cache_key)
        if cached:
            try:
                payload = json.loads(cached)
                return _build_recommendation(user, payload, payload.pop("_stage"), payload.pop("_confidence"), db)
            except Exception:
                pass  # cache miss / corrupt — fall through

    # Count completed sessions for stage selection
    session_count = (
        db.query(WorkoutSession)
        .filter(
            WorkoutSession.user_id == user.id,
            WorkoutSession.status == SessionStatus.completed,
        )
        .count()
    )

    if session_count >= 20:
        stage = RecommendationStage.ml_hybrid
        payload, confidence = _stage3_ml(user, db, context_override)
    elif session_count >= 3:
        stage = RecommendationStage.content_based
        payload, confidence = _stage2_content_based(user, db, context_override)
    else:
        stage = RecommendationStage.rule_based
        payload, confidence = _stage1_rule_based(user, db, context_override)

    # Cache result (without private keys)
    if redis and not context_override:
        cache_payload = {**payload, "_stage": stage, "_confidence": confidence}
        redis.setex(cache_key, _CACHE_TTL, json.dumps(cache_payload, default=str))

    return _build_recommendation(user, payload, stage, confidence, db)


# ── Stage 1 — Rule-based (cold start) ─────────────────────────────────────────

def _stage1_rule_based(
    user: User,
    db: Session,
    context_override: dict[str, Any] | None,
) -> tuple[dict, float]:
    """
    Pure rule-based: pick exercises matching fitness level, goal, equipment, accessibility.
    Adjust planned intensity based on fatigue.
    """
    profile = user.profile or UserProfile(user_id=user.id)
    accessibility = user.accessibility_profile

    eligible = get_eligible_exercises(profile, accessibility, db)
    goal_exercises = get_exercises_for_goal(profile.primary_goal, eligible)

    # Apply any context overrides (e.g. target muscle group)
    if context_override and "target_muscle" in context_override:
        target = context_override["target_muscle"]
        filtered = [e for e in goal_exercises if target in (e.primary_muscles or [])]
        if filtered:
            goal_exercises = filtered

    if not goal_exercises:
        goal_exercises = eligible[:_EXERCISES_PER_PLAN]

    selected = _sample_diverse(goal_exercises, _EXERCISES_PER_PLAN)

    fatigue = get_latest_fatigue(user.id, db)
    intensity_mod = fatigue_intensity_modifier(fatigue)

    exercises_payload = [
        _exercise_to_payload(ex, profile.preferred_duration_minutes, intensity_mod)
        for ex in selected
    ]

    rationale = (
        f"Personalised for your {profile.fitness_level} level "
        f"and {profile.primary_goal.replace('_', ' ')} goal. "
        + _fatigue_rationale(fatigue)
    )

    return (
        {
            "exercises": exercises_payload,
            "rationale": rationale,
            "adjustments": {"intensity_modifier": intensity_mod, "fatigue_level": fatigue},
            "estimated_duration_minutes": profile.preferred_duration_minutes,
        },
        0.65,
    )


# ── Stage 2 — Content-based ────────────────────────────────────────────────────

def _stage2_content_based(
    user: User,
    db: Session,
    context_override: dict[str, Any] | None,
) -> tuple[dict, float]:
    """
    Content-based: score exercises by similarity to the user's historical preferences.
    Preference vector: category frequency × muscle group frequency from past sessions.
    """
    profile = user.profile or UserProfile(user_id=user.id)
    accessibility = user.accessibility_profile

    # Build preference vectors from completed sessions
    category_counts: dict[str, int] = {}
    muscle_counts: dict[str, int] = {}

    past_sessions = (
        db.query(WorkoutSession)
        .filter(
            WorkoutSession.user_id == user.id,
            WorkoutSession.status == SessionStatus.completed,
        )
        .order_by(WorkoutSession.completed_at.desc())
        .limit(10)
        .all()
    )

    for session in past_sessions:
        for se in session.exercises:
            ex = se.exercise
            if not ex:
                continue
            category_counts[ex.category] = category_counts.get(ex.category, 0) + 1
            for muscle in (ex.primary_muscles or []):
                muscle_counts[muscle] = muscle_counts.get(muscle, 0) + 1

    eligible = get_eligible_exercises(profile, accessibility, db)

    # Score each exercise
    def score(ex: Exercise) -> float:
        s = category_counts.get(ex.category, 0) * 1.0
        for m in (ex.primary_muscles or []):
            s += muscle_counts.get(m, 0) * 0.5
        # Slight novelty bonus for exercises not recently seen
        seen_ids = {
            se.exercise_id
            for sess in past_sessions
            for se in sess.exercises
        }
        if ex.id not in seen_ids:
            s += 2.0
        return s

    scored = sorted(eligible, key=score, reverse=True)
    selected = _sample_diverse(scored[: _EXERCISES_PER_PLAN * 3], _EXERCISES_PER_PLAN)

    fatigue = get_latest_fatigue(user.id, db)
    intensity_mod = fatigue_intensity_modifier(fatigue)

    exercises_payload = [
        _exercise_to_payload(ex, profile.preferred_duration_minutes, intensity_mod)
        for ex in selected
    ]

    rationale = (
        "Based on your workout history and preferences. "
        + _fatigue_rationale(fatigue)
    )

    return (
        {
            "exercises": exercises_payload,
            "rationale": rationale,
            "adjustments": {"intensity_modifier": intensity_mod, "fatigue_level": fatigue},
            "estimated_duration_minutes": profile.preferred_duration_minutes,
        },
        0.78,
    )


# ── Stage 3 — ML hybrid (TruncatedSVD) ────────────────────────────────────────

def _stage3_ml(
    user: User,
    db: Session,
    context_override: dict[str, Any] | None,
) -> tuple[dict, float]:
    """
    ML-hybrid: tries the trained TruncatedSVD model; falls back to Stage 2
    gracefully if the model is not yet trained.
    """
    try:
        from app.ml.ml_recommender import MLRecommender

        recommender = MLRecommender()
        if not recommender.is_trained():
            logger.info("ML model not trained yet — falling back to content-based")
            return _stage2_content_based(user, db, context_override)

        profile = user.profile or UserProfile(user_id=user.id)
        accessibility = user.accessibility_profile
        eligible = get_eligible_exercises(profile, accessibility, db)

        predicted_ids = recommender.predict(user.id, [ex.id for ex in eligible])
        selected_exercises = [
            ex for ex in eligible if ex.id in set(predicted_ids)
        ][:_EXERCISES_PER_PLAN]

        if len(selected_exercises) < _EXERCISES_PER_PLAN:
            # Pad with content-based picks
            payload, confidence = _stage2_content_based(user, db, context_override)
            return payload, confidence

        fatigue = get_latest_fatigue(user.id, db)
        intensity_mod = fatigue_intensity_modifier(fatigue)

        exercises_payload = [
            _exercise_to_payload(ex, profile.preferred_duration_minutes, intensity_mod)
            for ex in selected_exercises
        ]

        return (
            {
                "exercises": exercises_payload,
                "rationale": (
                    "AI-powered recommendation from your complete workout history. "
                    + _fatigue_rationale(fatigue)
                ),
                "adjustments": {"intensity_modifier": intensity_mod, "fatigue_level": fatigue},
                "estimated_duration_minutes": profile.preferred_duration_minutes,
            },
            0.88,
        )

    except Exception as exc:
        logger.exception("Stage 3 ML recommendation failed: %s", exc)
        return _stage2_content_based(user, db, context_override)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _exercise_to_payload(
    ex: Exercise,
    preferred_duration: int,
    intensity_mod: float,
) -> dict:
    """Serialize an exercise into a recommendation payload entry."""
    sets = max(1, round(ex.default_sets * intensity_mod))
    reps = ex.default_reps
    duration = ex.default_duration_seconds

    if reps:
        reps = max(1, round(reps * intensity_mod))
    if duration:
        duration = max(10, round(duration * intensity_mod))

    return {
        "exercise_id": ex.id,
        "name": ex.name,
        "category": ex.category,
        "difficulty": ex.difficulty,
        "sets": sets,
        "reps": reps,
        "duration_seconds": duration,
        "rest_seconds": ex.rest_seconds,
        "supports_pose_analysis": ex.supports_pose_analysis,
        "thumbnail_url": ex.thumbnail_url,
    }


def _sample_diverse(exercises: list[Exercise], n: int) -> list[Exercise]:
    """
    Pick n exercises while maximising category diversity.
    Groups by category, picks round-robin, falls back to random if not enough.
    """
    if len(exercises) <= n:
        return exercises

    by_category: dict[str, list[Exercise]] = {}
    for ex in exercises:
        by_category.setdefault(ex.category, []).append(ex)

    # Shuffle within each category for variety
    for v in by_category.values():
        random.shuffle(v)

    selected: list[Exercise] = []
    categories = list(by_category.keys())
    random.shuffle(categories)

    idx = 0
    while len(selected) < n:
        cat = categories[idx % len(categories)]
        if by_category[cat]:
            selected.append(by_category[cat].pop(0))
        idx += 1
        # Safety: if all categories exhausted
        if all(len(v) == 0 for v in by_category.values()):
            break

    return selected


def _fatigue_rationale(fatigue: str) -> str:
    return {
        "NORMAL":   "Your recovery metrics look good — full intensity recommended.",
        "REDUCED":  "Intensity slightly adjusted based on your recent fatigue indicators.",
        "RECOVERY": "Intensity reduced — your body is signalling a need for lighter activity.",
    }.get(fatigue, "")


def _build_recommendation(
    user: User,
    payload: dict,
    stage: str,
    confidence: float,
    db: Session,
) -> Recommendation:
    fatigue = payload.get("adjustments", {}).get("fatigue_level")
    return Recommendation(
        user_id=user.id,
        stage=stage,
        payload=payload,
        confidence_score=confidence,
        fatigue_snapshot=fatigue,
        expires_at=None,
    )
