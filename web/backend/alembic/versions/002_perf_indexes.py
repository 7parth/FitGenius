"""Add composite performance indexes

Revision ID: 002
Revises: 001
Create Date: 2026-09-25 12:00:00.000000

Adds indexes that improve query performance for the most common
access patterns identified during Task 2 schema review:

- workout_sessions: (user_id, status) — filters completed sessions per user
- workout_sessions: (user_id, completed_at) — chronological history
- wearable_data: (user_id, recorded_at) — latest fatigue lookup
- recommendations: (user_id, created_at) — latest recommendation per user
- challenge_participants: (challenge_id, status) — leaderboard queries
- exercise_performances: index on set_number for set-log queries
"""
from typing import Sequence, Union

from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Composite index: filter completed sessions for a user efficiently
    op.create_index(
        "ix_workout_sessions_user_status",
        "workout_sessions",
        ["user_id", "status"],
    )
    # Composite index: chronological history per user
    op.create_index(
        "ix_workout_sessions_user_completed_at",
        "workout_sessions",
        ["user_id", "completed_at"],
    )
    # Composite index: latest wearable entry per user
    op.create_index(
        "ix_wearable_data_user_recorded_at",
        "wearable_data",
        ["user_id", "recorded_at"],
    )
    # Composite index: latest recommendation per user
    op.create_index(
        "ix_recommendations_user_created_at",
        "recommendations",
        ["user_id", "created_at"],
    )
    # Composite index: count active participants per challenge
    op.create_index(
        "ix_challenge_participants_challenge_status",
        "challenge_participants",
        ["challenge_id", "status"],
    )
    # Index set_number for performance log queries
    op.create_index(
        "ix_exercise_performances_set_number",
        "exercise_performances",
        ["set_number"],
    )
    # Index pose_score for analytics / PR queries
    op.create_index(
        "ix_exercise_performances_pose_score",
        "exercise_performances",
        ["pose_score"],
    )
    # Index for notification unread queries
    op.create_index(
        "ix_notifications_user_is_read",
        "notifications",
        ["user_id", "is_read"],
    )


def downgrade() -> None:
    op.drop_index("ix_notifications_user_is_read", table_name="notifications")
    op.drop_index("ix_exercise_performances_pose_score", table_name="exercise_performances")
    op.drop_index("ix_exercise_performances_set_number", table_name="exercise_performances")
    op.drop_index("ix_challenge_participants_challenge_status", table_name="challenge_participants")
    op.drop_index("ix_recommendations_user_created_at", table_name="recommendations")
    op.drop_index("ix_wearable_data_user_recorded_at", table_name="wearable_data")
    op.drop_index("ix_workout_sessions_user_completed_at", table_name="workout_sessions")
    op.drop_index("ix_workout_sessions_user_status", table_name="workout_sessions")
