"""Initial schema — all tables

Revision ID: 001
Revises:
Create Date: 2026-09-25 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Enum types ────────────────────────────────────────────────────────────
    op.execute("CREATE TYPE user_role AS ENUM ('user', 'admin')")
    op.execute("CREATE TYPE fitness_level AS ENUM ('beginner', 'intermediate', 'advanced')")
    op.execute("CREATE TYPE fitness_goal AS ENUM ('weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'general')")
    op.execute("CREATE TYPE training_location AS ENUM ('home', 'gym', 'outdoor', 'any')")
    op.execute("CREATE TYPE interaction_mode AS ENUM ('visual', 'voice', 'both')")
    op.execute("CREATE TYPE font_size_pref AS ENUM ('sm', 'md', 'lg', 'xl')")
    op.execute("CREATE TYPE exercise_category AS ENUM ('strength', 'cardio', 'flexibility', 'balance', 'hiit', 'yoga', 'rehabilitation')")
    op.execute("CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced')")
    op.execute("CREATE TYPE session_status AS ENUM ('in_progress', 'completed', 'abandoned', 'paused')")
    op.execute("CREATE TYPE recommendation_stage AS ENUM ('rule_based', 'content_based', 'ml_hybrid')")
    op.execute("CREATE TYPE feedback_rating AS ENUM ('too_easy', 'just_right', 'too_hard', 'not_relevant')")
    op.execute("CREATE TYPE badge_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum')")
    op.execute("CREATE TYPE challenge_type AS ENUM ('daily', 'weekly', 'monthly', 'special')")
    op.execute("CREATE TYPE challenge_status AS ENUM ('active', 'completed', 'expired')")
    op.execute("CREATE TYPE wearable_source AS ENUM ('manual', 'apple_health', 'google_fit', 'fitbit', 'garmin', 'whoop', 'generic')")
    op.execute("CREATE TYPE fatigue_level AS ENUM ('NORMAL', 'REDUCED', 'RECOVERY')")
    op.execute("CREATE TYPE notification_type AS ENUM ('achievement_unlocked', 'challenge_joined', 'challenge_completed', 'streak_milestone', 'workout_reminder', 'recommendation_ready', 'system')")
    op.execute("CREATE TYPE audit_action AS ENUM ('user_registered', 'user_login', 'user_logout', 'password_changed', 'user_deactivated', 'user_role_changed', 'exercise_created', 'exercise_updated', 'exercise_deleted', 'challenge_created', 'onboarding_completed', 'profile_updated')")

    # ── users ─────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("display_name", sa.String(100), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("role", postgresql.ENUM("user", "admin", name="user_role", create_type=False), nullable=False, server_default="user"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── user_profiles ─────────────────────────────────────────────────────────
    op.create_table(
        "user_profiles",
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("gender", sa.String(50), nullable=True),
        sa.Column("height_cm", sa.Float(), nullable=True),
        sa.Column("weight_kg", sa.Float(), nullable=True),
        sa.Column("fitness_level", postgresql.ENUM("beginner", "intermediate", "advanced", name="fitness_level", create_type=False), nullable=False, server_default="beginner"),
        sa.Column("primary_goal", postgresql.ENUM("weight_loss", "muscle_gain", "endurance", "flexibility", "general", name="fitness_goal", create_type=False), nullable=False, server_default="general"),
        sa.Column("workout_frequency_per_week", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("preferred_duration_minutes", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("preferred_exercise_types", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("available_equipment", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("training_location", postgresql.ENUM("home", "gym", "outdoor", "any", name="training_location", create_type=False), nullable=False, server_default="any"),
        sa.Column("preferred_language", sa.String(10), nullable=False, server_default="en-US"),
        sa.Column("onboarding_completed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("onboarding_last_step", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # ── accessibility_profiles ────────────────────────────────────────────────
    op.create_table(
        "accessibility_profiles",
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("has_visual_impairment", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("has_hearing_impairment", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("has_mobility_limitation", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("mobility_notes", sa.Text(), nullable=True),
        sa.Column("preferred_interaction_mode", postgresql.ENUM("visual", "voice", "both", name="interaction_mode", create_type=False), nullable=False, server_default="visual"),
        sa.Column("font_size_preference", postgresql.ENUM("sm", "md", "lg", "xl", name="font_size_pref", create_type=False), nullable=False, server_default="md"),
        sa.Column("high_contrast_mode", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("reduced_motion", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("captions_enabled", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("simplified_ui", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("exercise_restrictions", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("exercises_to_avoid", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # ── exercises ─────────────────────────────────────────────────────────────
    op.create_table(
        "exercises",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", postgresql.ENUM("strength", "cardio", "flexibility", "balance", "hiit", "yoga", "rehabilitation", name="exercise_category", create_type=False), nullable=False),
        sa.Column("difficulty", postgresql.ENUM("beginner", "intermediate", "advanced", name="difficulty_level", create_type=False), nullable=False),
        sa.Column("primary_muscles", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("secondary_muscles", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("equipment_required", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("is_bodyweight", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("instructions", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("tips", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("video_url", sa.String(500), nullable=True),
        sa.Column("thumbnail_url", sa.String(500), nullable=True),
        sa.Column("default_sets", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("default_reps", sa.Integer(), nullable=True),
        sa.Column("default_duration_seconds", sa.Integer(), nullable=True),
        sa.Column("rest_seconds", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("calories_per_minute", sa.Float(), nullable=True),
        sa.Column("accessibility_categories", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("contraindications", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("alternative_exercise_ids", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("supports_pose_analysis", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("pose_model_key", sa.String(100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_exercises_name", "exercises", ["name"])
    op.create_index("ix_exercises_slug", "exercises", ["slug"], unique=True)
    op.create_index("ix_exercises_category", "exercises", ["category"])
    op.create_index("ix_exercises_difficulty", "exercises", ["difficulty"])

    # ── workout_templates ─────────────────────────────────────────────────────
    op.create_table(
        "workout_templates",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("difficulty", sa.String(50), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("estimated_duration_minutes", sa.Integer(), nullable=False),
        sa.Column("fitness_goals", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("required_equipment", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("accessibility_tags", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # ── workout_template_exercises ────────────────────────────────────────────
    op.create_table(
        "workout_template_exercises",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("template_id", sa.String(36), sa.ForeignKey("workout_templates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("exercise_id", sa.String(36), sa.ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("sets", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("reps", sa.Integer(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("rest_seconds", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("notes", sa.Text(), nullable=True),
    )
    op.create_index("ix_wte_template_id", "workout_template_exercises", ["template_id"])

    # ── workout_sessions ──────────────────────────────────────────────────────
    op.create_table(
        "workout_sessions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("template_id", sa.String(36), sa.ForeignKey("workout_templates.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("status", postgresql.ENUM("in_progress", "completed", "abandoned", "paused", name="session_status", create_type=False), nullable=False, server_default="in_progress"),
        sa.Column("started_at", sa.String(50), nullable=True),
        sa.Column("completed_at", sa.String(50), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("total_volume_kg", sa.Float(), nullable=False, server_default="0"),
        sa.Column("total_calories", sa.Float(), nullable=False, server_default="0"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("fatigue_level", sa.String(20), nullable=True),
        sa.Column("points_earned", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_workout_sessions_user_id", "workout_sessions", ["user_id"])

    # ── workout_session_exercises ─────────────────────────────────────────────
    op.create_table(
        "workout_session_exercises",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("session_id", sa.String(36), sa.ForeignKey("workout_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("exercise_id", sa.String(36), sa.ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("planned_sets", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("planned_reps", sa.Integer(), nullable=True),
        sa.Column("planned_duration_seconds", sa.Integer(), nullable=True),
        sa.Column("rest_seconds", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("is_substituted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("substituted_from_id", sa.String(36), nullable=True),
    )
    op.create_index("ix_wse_session_id", "workout_session_exercises", ["session_id"])

    # ── exercise_performances ─────────────────────────────────────────────────
    op.create_table(
        "exercise_performances",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("session_exercise_id", sa.String(36), sa.ForeignKey("workout_session_exercises.id", ondelete="CASCADE"), nullable=False),
        sa.Column("set_number", sa.Integer(), nullable=False),
        sa.Column("reps_completed", sa.Integer(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("weight_kg", sa.Float(), nullable=True),
        sa.Column("rpe", sa.Integer(), nullable=True),
        sa.Column("pose_score", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
    )
    op.create_index("ix_ep_session_exercise_id", "exercise_performances", ["session_exercise_id"])

    # ── recommendations ───────────────────────────────────────────────────────
    op.create_table(
        "recommendations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("template_id", sa.String(36), sa.ForeignKey("workout_templates.id", ondelete="SET NULL"), nullable=True),
        sa.Column("stage", postgresql.ENUM("rule_based", "content_based", "ml_hybrid", name="recommendation_stage", create_type=False), nullable=False, server_default="rule_based"),
        sa.Column("payload", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("confidence_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("is_accepted", sa.Boolean(), nullable=True),
        sa.Column("feedback_rating", postgresql.ENUM("too_easy", "just_right", "too_hard", "not_relevant", name="feedback_rating", create_type=False), nullable=True),
        sa.Column("feedback_notes", sa.Text(), nullable=True),
        sa.Column("fatigue_snapshot", sa.String(20), nullable=True),
        sa.Column("session_id", sa.String(36), nullable=True),
        sa.Column("expires_at", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_recommendations_user_id", "recommendations", ["user_id"])

    # ── achievements ──────────────────────────────────────────────────────────
    op.create_table(
        "achievements",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("icon", sa.String(100), nullable=False),
        sa.Column("tier", postgresql.ENUM("bronze", "silver", "gold", "platinum", name="badge_tier", create_type=False), nullable=False),
        sa.Column("points_value", sa.Integer(), nullable=False),
        sa.Column("criteria", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_achievements_slug", "achievements", ["slug"], unique=True)

    # ── user_achievements ─────────────────────────────────────────────────────
    op.create_table(
        "user_achievements",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("achievement_id", sa.String(36), sa.ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False),
        sa.Column("earned_at", sa.String(50), nullable=False),
        sa.Column("context", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )
    op.create_index("ix_user_achievements_user_id", "user_achievements", ["user_id"])

    # ── user_gamification ─────────────────────────────────────────────────────
    op.create_table(
        "user_gamification",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("total_points", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("weekly_points", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("current_streak_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("longest_streak_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_workout_date", sa.String(20), nullable=True),
        sa.Column("level", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("xp_toward_next_level", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", name="uq_user_gamification"),
    )
    op.create_index("ix_user_gamification_user_id", "user_gamification", ["user_id"], unique=True)

    # ── challenges ────────────────────────────────────────────────────────────
    op.create_table(
        "challenges",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("challenge_type", postgresql.ENUM("daily", "weekly", "monthly", "special", name="challenge_type", create_type=False), nullable=False),
        sa.Column("points_reward", sa.Integer(), nullable=False),
        sa.Column("badge_id", sa.String(36), sa.ForeignKey("achievements.id", ondelete="SET NULL"), nullable=True),
        sa.Column("goal_criteria", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("starts_at", sa.String(50), nullable=False),
        sa.Column("ends_at", sa.String(50), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("max_participants", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # ── challenge_participants ────────────────────────────────────────────────
    op.create_table(
        "challenge_participants",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("challenge_id", sa.String(36), sa.ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False),
        sa.Column("progress", sa.Float(), nullable=False, server_default="0"),
        sa.Column("status", postgresql.ENUM("active", "completed", "expired", name="challenge_status", create_type=False), nullable=False, server_default="active"),
        sa.Column("completed_at", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "challenge_id", name="uq_challenge_participant"),
    )
    op.create_index("ix_challenge_participants_user_id", "challenge_participants", ["user_id"])
    op.create_index("ix_challenge_participants_challenge_id", "challenge_participants", ["challenge_id"])

    # ── wearable_data ─────────────────────────────────────────────────────────
    op.create_table(
        "wearable_data",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source", postgresql.ENUM("manual", "apple_health", "google_fit", "fitbit", "garmin", "whoop", "generic", name="wearable_source", create_type=False), nullable=False, server_default="manual"),
        sa.Column("recorded_at", sa.String(50), nullable=False),
        sa.Column("steps", sa.Integer(), nullable=True),
        sa.Column("active_calories", sa.Float(), nullable=True),
        sa.Column("resting_heart_rate", sa.Integer(), nullable=True),
        sa.Column("avg_heart_rate", sa.Integer(), nullable=True),
        sa.Column("max_heart_rate", sa.Integer(), nullable=True),
        sa.Column("hrv_ms", sa.Float(), nullable=True),
        sa.Column("sleep_hours", sa.Float(), nullable=True),
        sa.Column("sleep_quality_score", sa.Integer(), nullable=True),
        sa.Column("recovery_score", sa.Integer(), nullable=True),
        sa.Column("fatigue_level", postgresql.ENUM("NORMAL", "REDUCED", "RECOVERY", name="fatigue_level", create_type=False), nullable=False, server_default="NORMAL"),
        sa.Column("fatigue_confidence", sa.Float(), nullable=False, server_default="1"),
        sa.Column("raw_payload", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_wearable_data_user_id", "wearable_data", ["user_id"])
    op.create_index("ix_wearable_data_recorded_at", "wearable_data", ["recorded_at"])
    op.create_index("ix_wearable_data_fatigue_level", "wearable_data", ["fatigue_level"])

    # ── ai_conversations ──────────────────────────────────────────────────────
    op.create_table(
        "ai_conversations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(300), nullable=False, server_default="New conversation"),
        sa.Column("messages", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("message_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_prompt_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_completion_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_archived", sa.String(5), nullable=False, server_default="False"),
        sa.Column("last_message_at", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_ai_conversations_user_id", "ai_conversations", ["user_id"])

    # ── notifications ─────────────────────────────────────────────────────────
    op.create_table(
        "notifications",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("notification_type", postgresql.ENUM("achievement_unlocked", "challenge_joined", "challenge_completed", "streak_milestone", "workout_reminder", "recommendation_ready", "system", name="notification_type", create_type=False), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("body", sa.String(1000), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("payload", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_is_read", "notifications", ["is_read"])

    # ── audit_logs ────────────────────────────────────────────────────────────
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("actor_id", sa.String(36), nullable=True),
        sa.Column("target_id", sa.String(36), nullable=True),
        sa.Column("action", postgresql.ENUM("user_registered", "user_login", "user_logout", "password_changed", "user_deactivated", "user_role_changed", "exercise_created", "exercise_updated", "exercise_deleted", "challenge_created", "onboarding_completed", "profile_updated", name="audit_action", create_type=False), nullable=False),
        sa.Column("resource_type", sa.String(100), nullable=True),
        sa.Column("ip_address", sa.String(50), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("before_state", postgresql.JSONB(), nullable=True),
        sa.Column("after_state", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_audit_logs_actor_id", "audit_logs", ["actor_id"])
    op.create_index("ix_audit_logs_target_id", "audit_logs", ["target_id"])
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])


def downgrade() -> None:
    # Drop tables in reverse FK order
    op.drop_table("audit_logs")
    op.drop_table("notifications")
    op.drop_table("ai_conversations")
    op.drop_table("wearable_data")
    op.drop_table("challenge_participants")
    op.drop_table("challenges")
    op.drop_table("user_gamification")
    op.drop_table("user_achievements")
    op.drop_table("achievements")
    op.drop_table("recommendations")
    op.drop_table("exercise_performances")
    op.drop_table("workout_session_exercises")
    op.drop_table("workout_sessions")
    op.drop_table("workout_template_exercises")
    op.drop_table("workout_templates")
    op.drop_table("exercises")
    op.drop_table("accessibility_profiles")
    op.drop_table("user_profiles")
    op.drop_table("users")

    # Drop enum types
    for enum_name in [
        "audit_action", "notification_type", "fatigue_level", "wearable_source",
        "challenge_status", "challenge_type", "badge_tier", "feedback_rating",
        "recommendation_stage", "session_status", "difficulty_level",
        "exercise_category", "font_size_pref", "interaction_mode",
        "training_location", "fitness_goal", "fitness_level", "user_role",
    ]:
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")
