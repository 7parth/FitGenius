from sqlalchemy import String, Integer, Float, Boolean, Enum, Text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, UUIDMixin, TimestampMixin
import enum


class BadgeTier(str, enum.Enum):
    bronze = "bronze"
    silver = "silver"
    gold = "gold"
    platinum = "platinum"


class ChallengeType(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    special = "special"


class ChallengeStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    expired = "expired"


class Achievement(Base, UUIDMixin, TimestampMixin):
    """Achievement definitions (templates)."""

    __tablename__ = "achievements"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    icon: Mapped[str] = mapped_column(String(100), nullable=False)  # Lucide icon name
    tier: Mapped[str] = mapped_column(Enum(BadgeTier, name="badge_tier"), nullable=False)
    points_value: Mapped[int] = mapped_column(Integer, nullable=False)
    # Criteria: {"type": "sessions_completed", "threshold": 10}
    criteria: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user_achievements: Mapped[list["UserAchievement"]] = relationship(
        "UserAchievement", back_populates="achievement"
    )


class UserAchievement(Base, UUIDMixin, TimestampMixin):
    """Records when a user earns an achievement."""

    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),)

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    achievement_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False
    )
    earned_at: Mapped[str] = mapped_column(String(50), nullable=False)
    # Context snapshot at time of earning
    context: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="achievements")
    achievement: Mapped["Achievement"] = relationship("Achievement", back_populates="user_achievements")


class UserGamification(Base, UUIDMixin, TimestampMixin):
    """Aggregated gamification state per user."""

    __tablename__ = "user_gamification"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    total_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    weekly_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    current_streak_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    longest_streak_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_workout_date: Mapped[str | None] = mapped_column(String(20), nullable=True)  # YYYY-MM-DD
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    xp_toward_next_level: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="gamification")


class Challenge(Base, UUIDMixin, TimestampMixin):
    """Community or system-defined challenges."""

    __tablename__ = "challenges"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    challenge_type: Mapped[str] = mapped_column(
        Enum(ChallengeType, name="challenge_type"), nullable=False
    )
    points_reward: Mapped[int] = mapped_column(Integer, nullable=False)
    badge_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("achievements.id", ondelete="SET NULL"), nullable=True
    )
    # Goal criteria: {"type": "workouts_completed", "target": 5}
    goal_criteria: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    starts_at: Mapped[str] = mapped_column(String(50), nullable=False)
    ends_at: Mapped[str] = mapped_column(String(50), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    max_participants: Mapped[int | None] = mapped_column(Integer, nullable=True)

    participants: Mapped[list["ChallengeParticipant"]] = relationship(
        "ChallengeParticipant", back_populates="challenge"
    )


class ChallengeParticipant(Base, UUIDMixin, TimestampMixin):
    """A user's participation in a challenge."""

    __tablename__ = "challenge_participants"
    __table_args__ = (UniqueConstraint("user_id", "challenge_id", name="uq_challenge_participant"),)

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    challenge_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False, index=True
    )
    progress: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)  # 0.0–1.0
    status: Mapped[str] = mapped_column(
        Enum(ChallengeStatus, name="challenge_status"),
        default=ChallengeStatus.active,
        nullable=False,
    )
    completed_at: Mapped[str | None] = mapped_column(String(50), nullable=True)

    user: Mapped["User"] = relationship("User")
    challenge: Mapped["Challenge"] = relationship("Challenge", back_populates="participants")
