from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.workout import ExercisePerformance, WorkoutSessionExercise, WorkoutSession, SessionStatus
from app.models.exercise import Exercise
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter()


class PoseSessionRecord(BaseModel):
    session_exercise_id: Optional[str] = None
    exercise_key: Optional[str] = None
    set_number: int = Field(ge=1)
    pose_score: float = Field(ge=0, le=100)
    reps_completed: int = Field(default=0, ge=0)
    feedback: Optional[str] = None


class PoseSessionResponse(BaseModel):
    session_exercise_id: str
    exercise_name: str
    set_number: int
    pose_score: float
    reps_completed: Optional[int] = None
    feedback: Optional[str]
    recorded_at: str
    session_id: Optional[str] = None


@router.post("/sessions/record", response_model=PoseSessionResponse, status_code=201)
async def record_pose(
    body: PoseSessionRecord,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Store a pose analysis score for a set. Called from the frontend after MediaPipe analysis."""
    session_id = None
    se = (
        db.query(WorkoutSessionExercise)
        .join(WorkoutSession)
        .filter(
            WorkoutSessionExercise.id == body.session_exercise_id,
            WorkoutSession.user_id == current_user.id,
        )
        .first()
    )
    if se:
        session_id = se.session_id
    elif body.exercise_key:
        exercise = db.query(Exercise).filter(
            Exercise.pose_model_key == body.exercise_key,
            Exercise.supports_pose_analysis == True,  # noqa: E712
            Exercise.is_active == True,  # noqa: E712
        ).first()
        if not exercise:
            raise HTTPException(status_code=404, detail="Pose-supported exercise not found")
        now = datetime.now(timezone.utc).isoformat()
        session = WorkoutSession(user_id=current_user.id, name=f"Pose session: {exercise.name}",
                                 status=SessionStatus.in_progress, started_at=now)
        db.add(session)
        db.flush()
        se = WorkoutSessionExercise(session_id=session.id, exercise_id=exercise.id, order_index=0,
                                    planned_sets=4, planned_reps=12, rest_seconds=90)
        db.add(se)
        db.flush()
        session_id = session.id
    if not se:
        raise HTTPException(status_code=404, detail="Session exercise not found")
    if se.session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if se.session.status != SessionStatus.in_progress:
        raise HTTPException(status_code=400, detail="Pose session is no longer in progress")

    # Upsert performance row with pose score
    perf = db.query(ExercisePerformance).filter(
        ExercisePerformance.session_exercise_id == se.id,
        ExercisePerformance.set_number == body.set_number,
    ).first()
    now_iso = datetime.now(timezone.utc).isoformat()
    if perf:
        perf.pose_score = body.pose_score
        perf.reps_completed = body.reps_completed
        perf.notes = body.feedback
    else:
        perf = ExercisePerformance(
            session_exercise_id=se.id,
            set_number=body.set_number,
            reps_completed=body.reps_completed,
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
        reps_completed=body.reps_completed,
        feedback=body.feedback,
        recorded_at=now_iso,
        session_id=session_id,
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
            reps_completed=p.reps_completed,
            feedback=p.notes,
            recorded_at=p.session_exercise.session.completed_at or "",
        )
        for p in perfs
    ]
