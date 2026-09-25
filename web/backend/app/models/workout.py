from sqlalchemy import String, Integer, Float, Boolean, Enum, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, UUIDMixin, TimestampMixin
import enum


class SessionStatus(str, enum.Enum):
    in_progress = "in_progress"
    completed = "completed"
    abandoned = "abandoned"
    paused = "paused"


class WorkoutTemplate(Base, UUIDMixin, TimestampMixin):
    """Predefined workout plans (e.g., 'Beginner Full Body Day 1')."""

    __tablename__ = "workout_templates"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    fitness_goals: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    required_equipment: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    accessibility_tags: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    exercises: Mapped[list["WorkoutTemplateExercise"]] = relationship(
        "WorkoutTemplateExercise",
        back_populates="template",
        order_by="WorkoutTemplateExercise.order_index",
        cascade="all, delete-orphan",
    )
    sessions: Mapped[list["WorkoutSession"]] = relationship(
        "WorkoutSession", back_populates="template"
    )


class WorkoutTemplateExercise(Base, UUIDMixin):
    """Junction between template and exercise with ordering/defaults."""

    __tablename__ = "workout_template_exercises"

    template_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("workout_templates.id", ondelete="CASCADE"), nullable=False, index=True
    )
    exercise_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False, index=True
    )
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    sets: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    reps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rest_seconds: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    template: Mapped["WorkoutTemplate"] = relationship("WorkoutTemplate", back_populates="exercises")
    exercise: Mapped["Exercise"] = relationship("Exercise", back_populates="template_exercises")


class WorkoutSession(Base, UUIDMixin, TimestampMixin):
    """A user's actual workout session (live or historical)."""

    __tablename__ = "workout_sessions"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    template_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("workout_templates.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum(SessionStatus, name="session_status"), default=SessionStatus.in_progress, nullable=False
    )
    started_at: Mapped[str | None] = mapped_column(String(50), nullable=True)
    completed_at: Mapped[str | None] = mapped_column(String(50), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_volume_kg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_calories: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Snapshot of user fatigue at session start
    fatigue_level: Mapped[str | None] = mapped_column(String(20), nullable=True)
    points_earned: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="workout_sessions")
    template: Mapped["WorkoutTemplate | None"] = relationship("WorkoutTemplate", back_populates="sessions")
    exercises: Mapped[list["WorkoutSessionExercise"]] = relationship(
        "WorkoutSessionExercise",
        back_populates="session",
        order_by="WorkoutSessionExercise.order_index",
        cascade="all, delete-orphan",
    )


class WorkoutSessionExercise(Base, UUIDMixin):
    """An exercise slot within a live session."""

    __tablename__ = "workout_session_exercises"

    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("workout_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    exercise_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False
    )
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    planned_sets: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    planned_reps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    planned_duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rest_seconds: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    # Was this substituted mid-session?
    is_substituted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    substituted_from_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    session: Mapped["WorkoutSession"] = relationship("WorkoutSession", back_populates="exercises")
    exercise: Mapped["Exercise"] = relationship("Exercise", back_populates="session_exercises")
    performances: Mapped[list["ExercisePerformance"]] = relationship(
        "ExercisePerformance",
        back_populates="session_exercise",
        order_by="ExercisePerformance.set_number",
        cascade="all, delete-orphan",
    )


class ExercisePerformance(Base, UUIDMixin):
    """One logged set for a session exercise."""

    __tablename__ = "exercise_performances"

    session_exercise_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("workout_session_exercises.id", ondelete="CASCADE"), nullable=False, index=True
    )
    set_number: Mapped[int] = mapped_column(Integer, nullable=False)
    reps_completed: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    rpe: Mapped[int | None] = mapped_column(Integer, nullable=True)  # Rate of Perceived Exertion 1-10
    pose_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # 0-100 from MediaPipe
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    session_exercise: Mapped["WorkoutSessionExercise"] = relationship(
        "WorkoutSessionExercise", back_populates="performances"
    )
