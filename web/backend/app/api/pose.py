from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.workout import ExercisePerformance, WorkoutSessionExercise, WorkoutSession, SessionStatus
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class PoseSessionRecord(BaseModel):
    session_exercise_id: str
    set_number: int
    pose_score: float
    feedback: Optional[str] = None


class PoseSessionResponse(BaseModel):
    session_exercise_id: str
    exercise_name: str
    set_number: int
    pose_score: float
    feedback: Optional[str]
    recorded_at: str


@router.post("/sessions/record", response_model=PoseSessionResponse, status_code=201)
async def record_pose(
    body: PoseSessionRecord,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Store a pose analysis score for a set. Called from the frontend after MediaPipe analysis."""
    se = (
        db.query(WorkoutSessionExercise)
        .join(WorkoutSession)
        .filter(
            WorkoutSessionExercise.id == body.session_exercise_id,
            WorkoutSession.user_id == current_user.id,
        )
        .first()
    )
    if not se:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Session exercise not found")

    # Upsert performance row with pose score
    perf = db.query(ExercisePerformance).filter(
        ExercisePerformance.session_exercise_id == se.id,
        ExercisePerformance.set_number == body.set_number,
    ).first()
    now_iso = datetime.now(timezone.utc).isoformat()
    if perf:
        perf.pose_score = body.pose_score
        perf.notes = body.feedback
    else:
        perf = ExercisePerformance(
            session_exercise_id=se.id,
            set_number=body.set_number,
            pose_score=body.pose_score,
            notes=body.feedback,
        )
        db.add(perf)

    db.commit()
    return PoseSessionResponse(
        session_exercise_id=se.id,
        exercise_name=se.exercise.name,
        set_number=body.set_number,
        pose_score=body.pose_score,
        feedback=body.feedback,
        recorded_at=now_iso,
    )


@router.get("/sessions/history", response_model=list[PoseSessionResponse])
async def get_pose_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Return all sets with pose scores for this user."""
    perfs = (
        db.query(ExercisePerformance)
        .join(WorkoutSessionExercise)
        .join(WorkoutSession)
        .filter(
            WorkoutSession.user_id == current_user.id,
            ExercisePerformance.pose_score.isnot(None),
        )
        .order_by(WorkoutSession.completed_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return [
        PoseSessionResponse(
            session_exercise_id=p.session_exercise_id,
            exercise_name=p.session_exercise.exercise.name,
            set_number=p.set_number,
            pose_score=p.pose_score,
            feedback=p.notes,
            recorded_at=p.session_exercise.session.completed_at or "",
        )
        for p in perfs
    ]
