from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Any


class GenerateRecommendationRequest(BaseModel):
    context_override: Optional[dict[str, Any]] = None  # optional hints (e.g. target_muscle)


class RecommendationFeedbackRequest(BaseModel):
    recommendation_id: str
    is_accepted: bool
    rating: Optional[str] = None   # FeedbackRating enum value
    notes: Optional[str] = None


class RecommendationResponse(BaseModel):
    id: str
    stage: str
    payload: dict[str, Any]
    confidence_score: float
    is_accepted: Optional[bool]
    feedback_rating: Optional[str]
    fatigue_snapshot: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class RecommendationHistoryResponse(BaseModel):
    items: list[RecommendationResponse]
    total: int
    page: int
    page_size: int
