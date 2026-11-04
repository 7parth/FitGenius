"""Populate empty user-facing FitGenius areas with clearly labeled demo records.

Usage:
    python scripts/seed_demo_data.py --email user@example.com

The seed is idempotent and targets one existing account. It does not change
profile values, existing workout history, or audit records.
"""

# This executable script adds the backend root to sys.path before importing app modules.
# ruff: noqa: E402

import argparse
import os
import sys
from datetime import UTC, datetime, timedelta

_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.exercise import Exercise
from app.models.gamification import Challenge, ChallengeParticipant, ChallengeStatus, ChallengeType
from app.models.notification import Notification, NotificationType
from app.models.user import User
from app.models.wearable import WearableData, WearableSource
from app.models.workout import (
    ExercisePerformance,
    SessionStatus,
    WorkoutSession,
    WorkoutSessionExercise,
)

WORKOUTS = [
    {
        "name": "Demo • Full Body Strength",
        "days_ago": 6,
        "duration_seconds": 2580,
        "calories": 345,
        "exercises": [
            ("squat", 3, 10, 50.0),
            ("dumbbell-bench-press", 3, 10, 20.0),
            ("bent-over-dumbbell-row", 3, 12, 15.0),
        ],
    },
    {
        "name": "Demo • Lower Body Focus",
        "days_ago": 3,
        "duration_seconds": 2220,
        "calories": 310,
        "exercises": [
            ("goblet-squat", 4, 8, 22.5),
            ("lunge", 3, 10, 10.0),
            ("glute-bridge", 3, 12, 30.0),
        ],
    },
    {
        "name": "Demo • Upper Body Strength",
        "days_ago": 1,
        "duration_seconds": 1950,
        "calories": 275,
        "exercises": [
            ("dumbbell-bench-press", 4, 8, 22.5),
            ("bent-over-dumbbell-row", 4, 10, 17.5),
            ("dumbbell-bicep-curl", 3, 12, 10.0),
        ],
    },
]

CHALLENGES = [
    {
        "title": "Demo • Three-Workout Week",
        "description": "Complete three workouts this week and build a steady training rhythm.",
        "challenge_type": ChallengeType.weekly,
        "points_reward": 150,
        "goal_criteria": {"type": "workouts_completed", "target": 3},
        "progress": 0.67,
        "days_left": 7,
    },
    {
        "title": "Demo • Daily Movement",
        "description": "Reach 8,000 steps on five days to keep your daily movement consistent.",
        "challenge_type": ChallengeType.weekly,
        "points_reward": 100,
        "goal_criteria": {"type": "steps_days", "target": 5, "daily_steps": 8000},
        "progress": 0.4,
        "days_left": 7,
    },
    {
        "title": "Demo • Mobility Minutes",
        "description": "Log three short mobility sessions this week.",
        "challenge_type": ChallengeType.weekly,
        "points_reward": 80,
        "goal_criteria": {"type": "mobility_sessions", "target": 3},
        "progress": 0.33,
        "days_left": 7,
    },
]


def _iso(dt: datetime) -> str:
    return dt.astimezone(UTC).isoformat()


def _seed_workouts(db, user: User) -> int:
    added = 0
    now = datetime.now(UTC)
    for definition in WORKOUTS:
        exists = db.scalar(select(WorkoutSession.id).where(
            WorkoutSession.user_id == user.id,
            WorkoutSession.name == definition["name"],
        ))
        if exists:
            continue

        finished_at = now - timedelta(days=definition["days_ago"], hours=2)
        started_at = finished_at - timedelta(seconds=definition["duration_seconds"])
        session = WorkoutSession(
            user_id=user.id,
            name=definition["name"],
            status=SessionStatus.completed,
            started_at=_iso(started_at),
            completed_at=_iso(finished_at),
            duration_seconds=definition["duration_seconds"],
            total_calories=definition["calories"],
            notes="Clearly labeled demo workout data.",
        )
        db.add(session)
        db.flush()

        total_volume = 0.0
        for order, (slug, sets, reps, weight) in enumerate(definition["exercises"]):
            exercise = db.scalar(select(Exercise).where(Exercise.slug == slug, Exercise.is_active == True))  # noqa: E712
            if not exercise:
                continue
            slot = WorkoutSessionExercise(
                session_id=session.id,
                exercise_id=exercise.id,
                order_index=order,
                planned_sets=sets,
                planned_reps=reps,
                rest_seconds=exercise.rest_seconds,
            )
            db.add(slot)
            db.flush()
            for set_number in range(1, sets + 1):
                set_weight = max(0.0, weight - (set_number - 1) * 2.5)
                db.add(ExercisePerformance(
                    session_exercise_id=slot.id,
                    set_number=set_number,
                    reps_completed=reps,
                    weight_kg=set_weight,
                    rpe=7 + (set_number % 3),
                    notes="Demo set entry.",
                ))
                total_volume += set_weight * reps
        session.total_volume_kg = round(total_volume, 1)
        added += 1
    return added


def _seed_wearables(db, user: User) -> int:
    added = 0
    now = datetime.now(UTC)
    daily = [
        (8200, 56, 49.0, 7.5, 82, 84),
        (6700, 58, 43.0, 6.9, 75, 77),
        (10400, 55, 54.0, 8.0, 88, 91),
        (9100, 57, 47.0, 7.2, 79, 81),
        (7600, 59, 39.0, 6.7, 72, 74),
        (11200, 54, 61.0, 8.1, 91, 94),
        (8400, 56, 52.0, 7.7, 85, 88),
    ]
    for days_ago, (steps, resting_hr, hrv, sleep, sleep_score, recovery) in enumerate(daily):
        recorded_at = now.replace(hour=8, minute=0, second=0, microsecond=0) - timedelta(days=6 - days_ago)
        recorded_iso = _iso(recorded_at)
        exists = db.scalar(select(WearableData.id).where(
            WearableData.user_id == user.id,
            WearableData.recorded_at == recorded_iso,
            WearableData.source == WearableSource.manual,
        ))
        if exists:
            continue
        level = "REDUCED" if recovery < 78 else "NORMAL"
        db.add(WearableData(
            user_id=user.id,
            source=WearableSource.manual,
            recorded_at=recorded_iso,
            steps=steps,
            active_calories=380 + (steps % 700),
            resting_heart_rate=resting_hr,
            avg_heart_rate=92 + (days_ago % 8),
            max_heart_rate=142 + (days_ago % 12),
            hrv_ms=hrv,
            sleep_hours=sleep,
            sleep_quality_score=sleep_score,
            recovery_score=recovery,
            fatigue_level=level,
            fatigue_confidence=0.72,
            raw_payload={"demo_seed": "fitgenius-dashboard-v1"},
        ))
        added += 1
    return added


def _seed_challenges(db, user: User) -> tuple[int, int]:
    challenge_count = 0
    participant_count = 0
    now = datetime.now(UTC)
    for definition in CHALLENGES:
        title = definition["title"]
        challenge = db.scalar(select(Challenge).where(Challenge.title == title))
        if not challenge:
            challenge = Challenge(
                title=title,
                description=definition["description"],
                challenge_type=definition["challenge_type"],
                points_reward=definition["points_reward"],
                goal_criteria=definition["goal_criteria"],
                starts_at=_iso(now - timedelta(days=2)),
                ends_at=_iso(now + timedelta(days=definition["days_left"])),
                is_active=True,
                max_participants=500,
            )
            db.add(challenge)
            db.flush()
            challenge_count += 1

        participation = db.scalar(select(ChallengeParticipant.id).where(
            ChallengeParticipant.user_id == user.id,
            ChallengeParticipant.challenge_id == challenge.id,
        ))
        if not participation:
            db.add(ChallengeParticipant(
                user_id=user.id,
                challenge_id=challenge.id,
                progress=definition["progress"],
                status=ChallengeStatus.active,
            ))
            participant_count += 1
    return challenge_count, participant_count


def _seed_notifications(db, user: User) -> int:
    examples = [
        (
            NotificationType.recommendation_ready,
            "Your weekly workout plan is ready",
            "A new personalized plan is available. Review your session before you start.",
            {"demo_seed": "recommendation-ready"},
        ),
        (
            NotificationType.streak_milestone,
            "Training streak: 3 days",
            "You have been active on three recent training days. Keep building at a sustainable pace.",
            {"demo_seed": "streak-milestone"},
        ),
        (
            NotificationType.workout_reminder,
            "Movement check-in",
            "A short walk or mobility session can count toward today's movement goal.",
            {"demo_seed": "movement-checkin"},
        ),
    ]
    added = 0
    for kind, title, body, payload in examples:
        exists = db.scalar(select(Notification.id).where(
            Notification.user_id == user.id,
            Notification.title == title,
        ))
        if exists:
            continue
        db.add(Notification(
            user_id=user.id,
            notification_type=kind,
            title=title,
            body=body,
            is_read=False,
            payload=payload,
        ))
        added += 1
    return added


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--email", required=True, help="Existing account to receive demo records")
    args = parser.parse_args()

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == args.email.strip().lower()))
        if not user:
            parser.error("No existing account matches that email.")

        counts = {
            "workouts": _seed_workouts(db, user),
            "wearable readings": _seed_wearables(db, user),
        }
        counts["challenges"], counts["challenge participations"] = _seed_challenges(db, user)
        counts["notifications"] = _seed_notifications(db, user)
        db.commit()

        print(f"Demo records seeded for account {args.email}:")
        for label, count in counts.items():
            print(f"  {label}: {count} added")


if __name__ == "__main__":
    main()
