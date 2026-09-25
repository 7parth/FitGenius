from sqlalchemy import String, Boolean, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, UUIDMixin, TimestampMixin
import enum


class NotificationType(str, enum.Enum):
    achievement_unlocked = "achievement_unlocked"
    challenge_joined = "challenge_joined"
    challenge_completed = "challenge_completed"
    streak_milestone = "streak_milestone"
    workout_reminder = "workout_reminder"
    recommendation_ready = "recommendation_ready"
    system = "system"


class Notification(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "notifications"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    notification_type: Mapped[str] = mapped_column(
        Enum(NotificationType, name="notification_type"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    body: Mapped[str] = mapped_column(String(1000), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    # Extra data (e.g., achievement_id, challenge_id)
    payload: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="notifications")
