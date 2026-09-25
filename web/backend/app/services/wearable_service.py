"""
Wearable service — higher-level helpers for fetching and summarising wearable data.
"""
from sqlalchemy.orm import Session

from app.models.wearable import WearableData, FatigueLevel


def get_latest_fatigue(user_id: str, db: Session) -> str:
    """Return the most recent fatigue level string for a user, defaulting to NORMAL."""
    latest = (
        db.query(WearableData)
        .filter(WearableData.user_id == user_id)
        .order_by(WearableData.recorded_at.desc())
        .first()
    )
    if not latest:
        return FatigueLevel.normal
    return latest.fatigue_level


def fatigue_intensity_modifier(fatigue_level: str) -> float:
    """
    Return a multiplier (0.0–1.0) for adjusting workout intensity based on fatigue.
    NORMAL → 1.0, REDUCED → 0.7, RECOVERY → 0.4
    """
    return {
        FatigueLevel.normal:   1.0,
        FatigueLevel.reduced:  0.7,
        FatigueLevel.recovery: 0.4,
    }.get(fatigue_level, 1.0)
