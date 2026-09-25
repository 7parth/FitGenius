from sqlalchemy import String, Integer, Float, Boolean, Enum, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, UUIDMixin, TimestampMixin
import enum


class ExerciseCategory(str, enum.Enum):
    strength = "strength"
    cardio = "cardio"
    flexibility = "flexibility"
    balance = "balance"
    hiit = "hiit"
    yoga = "yoga"
    rehabilitation = "rehabilitation"


class DifficultyLevel(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class MuscleGroup(str, enum.Enum):
    chest = "chest"
    back = "back"
    shoulders = "shoulders"
    biceps = "biceps"
    triceps = "triceps"
    core = "core"
    quads = "quads"
    hamstrings = "hamstrings"
    glutes = "glutes"
    calves = "calves"
    full_body = "full_body"


class Exercise(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "exercises"

    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(Enum(ExerciseCategory, name="exercise_category"), nullable=False, index=True)
    difficulty: Mapped[str] = mapped_column(Enum(DifficultyLevel, name="difficulty_level"), nullable=False, index=True)
    primary_muscles: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    secondary_muscles: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    equipment_required: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    # Bodyweight-compatible exercises have empty or ["bodyweight"]
    is_bodyweight: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Instruction & media
    instructions: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)  # ordered steps
    tips: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Defaults for workout templates
    default_sets: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    default_reps: Mapped[int | None] = mapped_column(Integer, nullable=True)  # null = duration-based
    default_duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rest_seconds: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    calories_per_minute: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Accessibility
    # Categories: seated, standing, low_impact, high_impact, visual_cues_supported, hearing_cues_supported
    accessibility_categories: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    contraindications: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    # UUIDs of exercises that can substitute this one
    alternative_exercise_ids: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)

    # Pose analysis support (squat, push_up, bicep_curl, shoulder_press, lunge)
    supports_pose_analysis: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    pose_model_key: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Admin
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    template_exercises: Mapped[list["WorkoutTemplateExercise"]] = relationship(
        "WorkoutTemplateExercise", back_populates="exercise"
    )
    session_exercises: Mapped[list["WorkoutSessionExercise"]] = relationship(
        "WorkoutSessionExercise", back_populates="exercise"
    )
