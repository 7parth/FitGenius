from sqlalchemy import String, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, UUIDMixin, TimestampMixin
import enum


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    role: Mapped[str] = mapped_column(
        Enum(UserRole, name="user_role"),
        default=UserRole.user,
        nullable=False,
    )

    # Relationships
    profile: Mapped["UserProfile"] = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")  # noqa
    accessibility_profile: Mapped["AccessibilityProfile"] = relationship("AccessibilityProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")  # noqa
    workout_sessions: Mapped[list["WorkoutSession"]] = relationship("WorkoutSession", back_populates="user")  # noqa
    gamification: Mapped["UserGamification"] = relationship("UserGamification", back_populates="user", uselist=False, cascade="all, delete-orphan")  # noqa
    achievements: Mapped[list["UserAchievement"]] = relationship("UserAchievement", back_populates="user")  # noqa
    conversations: Mapped[list["AIConversation"]] = relationship("AIConversation", back_populates="user")  # noqa
    notifications: Mapped[list["Notification"]] = relationship("Notification", back_populates="user")  # noqa
