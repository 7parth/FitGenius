"""
Exercise service — helpers for filtering exercises by user profile and accessibility needs.
Used by the recommendation engine.
"""
from sqlalchemy.orm import Session

from app.models.exercise import Exercise
from app.models.profile import UserProfile, AccessibilityProfile


def get_eligible_exercises(
    profile: UserProfile,
    accessibility: AccessibilityProfile | None,
    db: Session,
) -> list[Exercise]:
    """
    Return exercises matching the user's equipment, difficulty, and accessibility constraints.
    """
    query = db.query(Exercise).filter(Exercise.is_active == True)  # noqa: E712

    # Filter by difficulty (beginner gets beginner, intermediate gets up to intermediate, etc.)
    difficulty_map = {
        "beginner": ["beginner"],
        "intermediate": ["beginner", "intermediate"],
        "advanced": ["beginner", "intermediate", "advanced"],
    }
    allowed_difficulties = difficulty_map.get(profile.fitness_level, ["beginner"])
    query = query.filter(Exercise.difficulty.in_(allowed_difficulties))

    exercises = query.all()

    # Filter by equipment availability
    available_equipment: set[str] = set(profile.available_equipment or [])
    available_equipment.add("bodyweight")  # always available

    filtered = []
    for ex in exercises:
        required: list[str] = ex.equipment_required or []
        # Exercise is eligible if bodyweight or all required equipment is available
        if not required or ex.is_bodyweight or all(e in available_equipment for e in required):
            filtered.append(ex)

    # Accessibility filters
    if accessibility:
        avoid_ids: set[str] = set(accessibility.exercises_to_avoid or [])
        restrictions: set[str] = set(accessibility.exercise_restrictions or [])

        final = []
        for ex in filtered:
            if ex.id in avoid_ids:
                continue
            contra: list[str] = ex.contraindications or []
            if restrictions and any(r in contra for r in restrictions):
                continue
            # Mobility limitation: skip high-impact exercises
            if accessibility.has_mobility_limitation:
                cats: list[str] = ex.accessibility_categories or []
                if "high_impact" in cats:
                    continue
            final.append(ex)
        return final

    return filtered


def get_exercises_for_goal(goal: str, exercises: list[Exercise]) -> list[Exercise]:
    """Filter a pre-filtered exercise list by primary goal."""
    goal_to_categories = {
        "weight_loss":   ["cardio", "hiit"],
        "muscle_gain":   ["strength"],
        "endurance":     ["cardio", "hiit"],
        "flexibility":   ["flexibility", "yoga"],
        "general":       ["strength", "cardio", "flexibility", "balance"],
    }
    preferred = goal_to_categories.get(goal, [])
    if not preferred:
        return exercises

    primary = [e for e in exercises if e.category in preferred]
    return primary if primary else exercises  # fall back to all if no match
