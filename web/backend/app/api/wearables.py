from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.wearable import WearableData
from app.schemas.wearable import WearableDataCreate, WearableDataResponse, FatigueResponse
from app.services.fatigue_service import compute_fatigue

router = APIRouter()


@router.get("/data", response_model=list[WearableDataResponse])
async def get_wearable_data(
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    items = (
        db.query(WearableData)
        .filter(WearableData.user_id == current_user.id)
        .order_by(WearableData.recorded_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items


@router.post("/data", response_model=WearableDataResponse, status_code=201)
async def submit_wearable_data(
    body: WearableDataCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    fatigue_level, fatigue_confidence = compute_fatigue(body)

    entry = WearableData(
        user_id=current_user.id,
        source=body.source,
        recorded_at=body.recorded_at,
        steps=body.steps,
        active_calories=body.active_calories,
        resting_heart_rate=body.resting_heart_rate,
        avg_heart_rate=body.avg_heart_rate,
        max_heart_rate=body.max_heart_rate,
        hrv_ms=body.hrv_ms,
        sleep_hours=body.sleep_hours,
        sleep_quality_score=body.sleep_quality_score,
        recovery_score=body.recovery_score,
        fatigue_level=fatigue_level,
        fatigue_confidence=fatigue_confidence,
        raw_payload=body.raw_payload or {},
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/fatigue", response_model=FatigueResponse)
async def get_current_fatigue(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Returns the most recent fatigue assessment.
    Medical disclaimer: this is general wellness guidance, not a medical diagnosis.
    """
    latest = (
        db.query(WearableData)
        .filter(WearableData.user_id == current_user.id)
        .order_by(WearableData.recorded_at.desc())
        .first()
    )

    if not latest:
        return FatigueResponse(
            fatigue_level="NORMAL",
            fatigue_confidence=0.5,
            recommendation_note="No wearable data recorded yet. Add data to get personalized fatigue tracking.",
            recorded_at=None,
        )

    notes = {
        "NORMAL": "You're well-recovered — great time for a regular or intense workout.",
        "REDUCED": "Your recovery metrics suggest moderate fatigue. Consider a lighter session today.",
        "RECOVERY": "Your body shows signs of significant fatigue. A rest day or gentle movement is recommended.",
    }

    return FatigueResponse(
        fatigue_level=latest.fatigue_level,
        fatigue_confidence=latest.fatigue_confidence,
        recommendation_note=notes.get(latest.fatigue_level, ""),
        recorded_at=latest.recorded_at,
    )
