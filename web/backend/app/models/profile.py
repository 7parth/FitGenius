from sqlalchemy import String, Integer, Float, Boolean, Enum, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin
import enum


class FitnessLevel(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class FitnessGoal(str, enum.Enum):
    weight_loss = "weight_loss"
    muscle_gain = "muscle_gain"
    endurance = "endurance"
    flexibility = "flexibility"
    general = "general"


class TrainingLocation(str, enum.Enum):
    home = "home"
    gym = "gym"
    outdoor = "outdoor"
    any = "any"


class InteractionMode(str, enum.Enum):
    visual = "visual"
    voice = "voice"
    both = "both"


class FontSizePreference(str, enum.Enum):
    sm = "sm"
    md = "md"
    lg = "lg"
    xl = "xl"


class UserProfile(Base, TimestampMixin):
    __tablename__ = "user_profiles"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(50), nullable=True)
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    fitness_level: Mapped[str] = mapped_column(
        Enum(FitnessLevel, name="fitness_level"), default=FitnessLevel.beginner, nullable=False
    )
    primary_goal: Mapped[str] = mapped_column(
        Enum(FitnessGoal, name="fitness_goal"), default=FitnessGoal.general, nullable=False
    )
    workout_frequency_per_week: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    preferred_duration_minutes: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    preferred_exercise_types: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    available_equipment: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    training_location: Mapped[str] = mapped_column(
        Enum(TrainingLocation, name="training_location"), default=TrainingLocation.any, nullable=False
    )
    preferred_language: Mapped[str] = mapped_column(String(10), default="en-US", nullable=False)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    onboarding_last_step: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="profile")


class AccessibilityProfile(Base, TimestampMixin):
    __tablename__ = "accessibility_profiles"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    has_visual_impairment: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_hearing_impairment: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_mobility_limitation: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    mobility_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferred_interaction_mode: Mapped[str] = mapped_column(
        Enum(InteractionMode, name="interaction_mode"), default=InteractionMode.visual, nullable=False
    )
    font_size_preference: Mapped[str] = mapped_column(
        Enum(FontSizePreference, name="font_size_pref"), default=FontSizePreference.md, nullable=False
    )
    high_contrast_mode: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reduced_motion: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    captions_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    simplified_ui: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    exercise_restrictions: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    exercises_to_avoid: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="accessibility_profile")
