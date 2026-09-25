from sqlalchemy import String, Float, Boolean, Enum, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, UUIDMixin, TimestampMixin
import enum


class RecommendationStage(str, enum.Enum):
    rule_based = "rule_based"       # Stage 1: cold start (<3 sessions)
    content_based = "content_based"  # Stage 2: content-based (3–19 sessions)
    ml_hybrid = "ml_hybrid"         # Stage 3: TruncatedSVD hybrid (20+ sessions)


class FeedbackRating(str, enum.Enum):
    too_easy = "too_easy"
    just_right = "just_right"
    too_hard = "too_hard"
    not_relevant = "not_relevant"


class Recommendation(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "recommendations"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    template_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("workout_templates.id", ondelete="SET NULL"), nullable=True
    )
    stage: Mapped[str] = mapped_column(
        Enum(RecommendationStage, name="recommendation_stage"),
        default=RecommendationStage.rule_based,
        nullable=False,
    )
    # JSON payload: {"exercises": [...], "rationale": "...", "adjustments": {...}}
    payload: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    is_accepted: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    feedback_rating: Mapped[str | None] = mapped_column(
        Enum(FeedbackRating, name="feedback_rating"), nullable=True
    )
    feedback_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Fatigue level at time of generation
    fatigue_snapshot: Mapped[str | None] = mapped_column(String(20), nullable=True)
    # Was this generated for a specific session?
    session_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    expires_at: Mapped[str | None] = mapped_column(String(50), nullable=True)

    user: Mapped["User"] = relationship("User")
    template: Mapped["WorkoutTemplate | None"] = relationship("WorkoutTemplate")
