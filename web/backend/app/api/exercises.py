import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_admin
from app.core.redis_client import get_redis
from app.models.user import User
from app.models.exercise import Exercise
from app.schemas.exercise import (
    ExerciseCreate,
    ExerciseUpdate,
    ExerciseResponse,
    ExerciseListResponse,
)

router = APIRouter()

_CACHE_TTL = 1800  # 30 minutes


def _cache_key(params: str) -> str:
    return f"exercises:{params}"


@router.get("", response_model=ExerciseListResponse)
async def list_exercises(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: str | None = None,
    difficulty: str | None = None,
    equipment: str | None = None,
    supports_pose: bool | None = None,
    search: str | None = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    cache_params = f"{page}:{page_size}:{category}:{difficulty}:{equipment}:{supports_pose}:{search}"
    redis = get_redis()
    if redis:
        cached = redis.get(_cache_key(cache_params))
        if cached:
            return ExerciseListResponse(**json.loads(cached))

    query = db.query(Exercise).filter(Exercise.is_active == True)  # noqa: E712
    if category:
        query = query.filter(Exercise.category == category)
    if difficulty:
        query = query.filter(Exercise.difficulty == difficulty)
    if supports_pose is not None:
        query = query.filter(Exercise.supports_pose_analysis == supports_pose)
    if search:
        query = query.filter(Exercise.name.ilike(f"%{search}%"))

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    pages = max(1, -(-total // page_size))

    result = ExerciseListResponse(
        items=[ExerciseResponse.model_validate(e) for e in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )

    if redis:
        redis.setex(_cache_key(cache_params), _CACHE_TTL, result.model_dump_json())

    return result


@router.get("/{exercise_id}", response_model=ExerciseResponse)
async def get_exercise(
    exercise_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id, Exercise.is_active == True).first()  # noqa: E712
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return exercise


@router.get("/{exercise_id}/alternatives", response_model=list[ExerciseResponse])
async def get_alternatives(
    exercise_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    alt_ids = exercise.alternative_exercise_ids or []
    if not alt_ids:
        return []

    alts = db.query(Exercise).filter(
        Exercise.id.in_(alt_ids), Exercise.is_active == True  # noqa: E712
    ).all()
    return alts


# ── Admin CRUD ────────────────────────────────────────────────────────────────

@router.post("", response_model=ExerciseResponse, status_code=201)
async def create_exercise(
    body: ExerciseCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(Exercise).filter(Exercise.slug == body.slug).first()
    if existing:
        raise HTTPException(status_code=409, detail="Slug already in use")
    exercise = Exercise(**body.model_dump())
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    _invalidate_cache()
    return exercise


@router.patch("/{exercise_id}", response_model=ExerciseResponse)
async def update_exercise(
    exercise_id: str,
    body: ExerciseUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(exercise, field, value)
    db.commit()
    db.refresh(exercise)
    _invalidate_cache()
    return exercise


@router.delete("/{exercise_id}", status_code=204)
async def delete_exercise(
    exercise_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    exercise.is_active = False  # Soft delete
    db.commit()
    _invalidate_cache()


def _invalidate_cache():
    redis = get_redis()
    if redis:
        keys = redis.keys("exercises:*")
        if keys:
            redis.delete(*keys)
