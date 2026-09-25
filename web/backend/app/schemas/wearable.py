from pydantic import BaseModel, Field
from typing import Optional


class WearableDataCreate(BaseModel):
    source: str = "manual"
    recorded_at: str            # ISO 8601 datetime string
    steps: Optional[int] = Field(None, ge=0)
    active_calories: Optional[float] = Field(None, ge=0)
    resting_heart_rate: Optional[int] = Field(None, ge=20, le=250)
    avg_heart_rate: Optional[int] = Field(None, ge=20, le=250)
    max_heart_rate: Optional[int] = Field(None, ge=20, le=250)
    hrv_ms: Optional[float] = Field(None, ge=0)
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    sleep_quality_score: Optional[int] = Field(None, ge=0, le=100)
    recovery_score: Optional[int] = Field(None, ge=0, le=100)
    raw_payload: Optional[dict] = None


class WearableDataResponse(BaseModel):
    id: str
    source: str
    recorded_at: str
    steps: Optional[int]
    active_calories: Optional[float]
    resting_heart_rate: Optional[int]
    avg_heart_rate: Optional[int]
    hrv_ms: Optional[float]
    sleep_hours: Optional[float]
    sleep_quality_score: Optional[int]
    recovery_score: Optional[int]
    fatigue_level: str
    fatigue_confidence: float

    model_config = {"from_attributes": True}


class FatigueResponse(BaseModel):
    """
    Medical disclaimer: This is a general wellness indicator based on
    activity and sleep data. It is not a medical diagnosis.
    Always consult a healthcare professional before changing your exercise routine.
    """
    fatigue_level: str          # NORMAL | REDUCED | RECOVERY
    fatigue_confidence: float   # 0.0–1.0
    recommendation_note: str    # plain-language nudge
    recorded_at: Optional[str]
    disclaimer: str = (
        "This fatigue indicator is for general wellness guidance only and "
        "is not a medical diagnosis. Consult a healthcare professional "
        "before making changes to your exercise routine."
    )
