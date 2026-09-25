from sqlalchemy import String, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base, UUIDMixin, TimestampMixin
import enum


class AuditAction(str, enum.Enum):
    # Auth
    user_registered = "user_registered"
    user_login = "user_login"
    user_logout = "user_logout"
    password_changed = "password_changed"
    # Admin
    user_deactivated = "user_deactivated"
    user_role_changed = "user_role_changed"
    exercise_created = "exercise_created"
    exercise_updated = "exercise_updated"
    exercise_deleted = "exercise_deleted"
    challenge_created = "challenge_created"
    # Profile
    onboarding_completed = "onboarding_completed"
    profile_updated = "profile_updated"


class AuditLog(Base, UUIDMixin, TimestampMixin):
    """Immutable audit trail for security-sensitive operations."""

    __tablename__ = "audit_logs"

    actor_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    target_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    action: Mapped[str] = mapped_column(
        Enum(AuditAction, name="audit_action"), nullable=False, index=True
    )
    resource_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Before/after snapshots for admin mutations
    before_state: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    after_state: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
