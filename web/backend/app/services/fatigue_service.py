"""
Fatigue computation service.

Rule-based: derives NORMAL / REDUCED / RECOVERY from wearable inputs.
Medical disclaimer: this is a general wellness indicator, not a medical diagnosis.
"""
from app.schemas.wearable import WearableDataCreate
from app.models.wearable import FatigueLevel


def compute_fatigue(data: WearableDataCreate) -> tuple[str, float]:
    """
    Returns (fatigue_level, confidence) based on available wearable metrics.
    Uses a weighted scoring approach — each metric contributes a stress score 0.0–1.0.
    """
    signals: list[tuple[float, float]] = []  # (stress_score, weight)

    # HRV: lower HRV → higher stress
    if data.hrv_ms is not None:
        hrv_stress = _hrv_stress(data.hrv_ms)
        signals.append((hrv_stress, 2.0))  # highest weight

    # Sleep hours: <6h = high stress, 7–9h = low stress
    if data.sleep_hours is not None:
        sleep_stress = _sleep_stress(data.sleep_hours)
        signals.append((sleep_stress, 1.8))

    # Sleep quality score: 0–100 inverted
    if data.sleep_quality_score is not None:
        quality_stress = 1.0 - (data.sleep_quality_score / 100.0)
        signals.append((quality_stress, 1.5))

    # Recovery score (from device): 0–100 inverted
    if data.recovery_score is not None:
        recovery_stress = 1.0 - (data.recovery_score / 100.0)
        signals.append((recovery_stress, 2.0))

    # Resting HR: high resting HR → stress
    if data.resting_heart_rate is not None:
        hr_stress = _resting_hr_stress(data.resting_heart_rate)
        signals.append((hr_stress, 1.0))

    if not signals:
        # No data — assume normal, low confidence
        return FatigueLevel.normal, 0.3

    # Weighted average stress score
    total_weight = sum(w for _, w in signals)
    weighted_stress = sum(s * w for s, w in signals) / total_weight

    # Confidence scales with number and quality of signals
    confidence = min(1.0, 0.3 + len(signals) * 0.14)

    if weighted_stress >= 0.65:
        return FatigueLevel.recovery, confidence
    elif weighted_stress >= 0.40:
        return FatigueLevel.reduced, confidence
    else:
        return FatigueLevel.normal, confidence


# ── Signal sub-functions ───────────────────────────────────────────────────────

def _hrv_stress(hrv_ms: float) -> float:
    """HRV < 20ms = max stress, > 80ms = no stress."""
    if hrv_ms >= 80:
        return 0.0
    if hrv_ms <= 20:
        return 1.0
    return 1.0 - ((hrv_ms - 20) / 60.0)


def _sleep_stress(hours: float) -> float:
    """< 5h = max, 5–6h = high, 6–7h = moderate, 7–9h = none, > 9h = slight."""
    if hours < 5:
        return 1.0
    if hours < 6:
        return 0.8
    if hours < 7:
        return 0.5
    if hours <= 9:
        return 0.0
    return 0.1  # oversleeping can indicate illness


def _resting_hr_stress(bpm: int) -> float:
    """Resting HR > 80 = stressed, < 60 = athlete-normal."""
    if bpm <= 60:
        return 0.0
    if bpm >= 90:
        return 1.0
    return (bpm - 60) / 30.0
