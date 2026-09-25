from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.recommendation import Recommendation, FeedbackRating
from app.schemas.recommendation import (
    GenerateRecommendationRequest,
    RecommendationFeedbackRequest,
    RecommendationResponse,
    RecommendationHistoryResponse,
)
from app.ml.recommendation_engine import get_recommendation

router = APIRouter()


@router.post("/generate", response_model=RecommendationResponse, status_code=201)
async def generate_recommendation(
    body: GenerateRecommendationRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    rec = get_recommendation(current_user, db, context_override=body.context_override)
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


@router.get("/latest", response_model=RecommendationResponse)
async def get_latest_recommendation(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    rec = (
        db.query(Recommendation)
        .filter(Recommendation.user_id == current_user.id)
        .order_by(Recommendation.created_at.desc())
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="No recommendations yet")
    return rec


@router.post("/feedback", response_model=RecommendationResponse)
async def submit_feedback(
    body: RecommendationFeedbackRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    rec = db.query(Recommendation).filter(
        Recommendation.id == body.recommendation_id,
        Recommendation.user_id == current_user.id,
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.is_accepted = body.is_accepted
    if body.rating:
        try:
            rec.feedback_rating = FeedbackRating(body.rating)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid rating value")
    rec.feedback_notes = body.notes
    db.commit()
    db.refresh(rec)
    return rec


@router.get("/history", response_model=RecommendationHistoryResponse)
async def get_recommendation_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Recommendation)
        .filter(Recommendation.user_id == current_user.id)
        .order_by(Recommendation.created_at.desc())
    )
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return RecommendationHistoryResponse(
        items=[RecommendationResponse.model_validate(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
    )
