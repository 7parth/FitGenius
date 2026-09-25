from sqlalchemy import String, Integer, Float, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, UUIDMixin, TimestampMixin
import enum


class WearableSource(str, enum.Enum):
    manual = "manual"
    apple_health = "apple_health"
    google_fit = "google_fit"
    fitbit = "fitbit"
    garmin = "garmin"
    whoop = "whoop"
    generic = "generic"


class FatigueLevel(str, enum.Enum):
    normal = "NORMAL"
    reduced = "REDUCED"
    recovery = "RECOVERY"


class WearableData(Base, UUIDMixin, TimestampMixin):
    """Raw wearable metrics snapshot from any source."""

    __tablename__ = "wearable_data"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source: Mapped[str] = mapped_column(
        Enum(WearableSource, name="wearable_source"),
        default=WearableSource.manual,
        nullable=False,
    )
    recorded_at: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # Activity
    steps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    active_calories: Mapped[float | None] = mapped_column(Float, nullable=True)
    resting_heart_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    avg_heart_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_heart_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hrv_ms: Mapped[float | None] = mapped_column(Float, nullable=True)  # Heart-rate variability (ms)

    # Recovery
    sleep_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    sleep_quality_score: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 0–100
    recovery_score: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 0–100

    # Computed fatigue
    fatigue_level: Mapped[str] = mapped_column(
        Enum(FatigueLevel, name="fatigue_level"),
        default=FatigueLevel.normal,
        nullable=False,
        index=True,
    )
    fatigue_confidence: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    # Extra fields from source (extensible)
    raw_payload: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    user: Mapped["User"] = relationship("User")
