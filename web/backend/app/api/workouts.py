from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.workout import (
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutTemplate,
    WorkoutTemplateExercise,
    ExercisePerformance,
    SessionStatus,
)
from app.models.exercise import Exercise
from app.schemas.workout import (
    StartSessionRequest,
    LogSetRequest,
    SwapExerciseRequest,
    WorkoutSessionResponse,
    WorkoutHistoryResponse,
    WorkoutSessionSummary,
    WorkoutTemplateResponse,
)
from app.services.gamification_service import award_session_points

router = APIRouter()


# ── Templates ─────────────────────────────────────────────────────────────────

@router.get("/templates", response_model=list[WorkoutTemplateResponse])
async def list_templates(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return db.query(WorkoutTemplate).filter(WorkoutTemplate.is_active == True).all()  # noqa: E712


@router.get("/templates/{template_id}", response_model=WorkoutTemplateResponse)
async def get_template(
    template_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    t = db.query(WorkoutTemplate).filter(
        WorkoutTemplate.id == template_id, WorkoutTemplate.is_active == True  # noqa: E712
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    return t


# ── Sessions ──────────────────────────────────────────────────────────────────

@router.post("/sessions/start", response_model=WorkoutSessionResponse, status_code=201)
async def start_session(
    body: StartSessionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    name = body.name or "Custom Workout"
    template = None

    if body.template_id:
        template = db.query(WorkoutTemplate).filter(
            WorkoutTemplate.id == body.template_id
        ).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        name = template.name

    now_iso = datetime.now(timezone.utc).isoformat()
    session = WorkoutSession(
        user_id=current_user.id,
        template_id=body.template_id,
        name=name,
        status=SessionStatus.in_progress,
        started_at=now_iso,
    )
    db.add(session)
    db.flush()

    if template:
        for te in template.exercises:
            se = WorkoutSessionExercise(
                session_id=session.id,
                exercise_id=te.exercise_id,
                order_index=te.order_index,
                planned_sets=te.sets,
                planned_reps=te.reps,
                planned_duration_seconds=te.duration_seconds,
                rest_seconds=te.rest_seconds,
            )
            db.add(se)

    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions/{session_id}", response_model=WorkoutSessionResponse)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    session = _get_own_session(session_id, current_user.id, db)
    return session


@router.post("/sessions/{session_id}/exercises/{session_exercise_id}/log",
             response_model=WorkoutSessionResponse)
async def log_set(
    session_id: str,
    session_exercise_id: str,
    body: LogSetRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    session = _get_own_session(session_id, current_user.id, db)
    if session.status != SessionStatus.in_progress:
        raise HTTPException(status_code=400, detail="Session is not in progress")

    se = db.query(WorkoutSessionExercise).filter(
        WorkoutSessionExercise.id == session_exercise_id,
        WorkoutSessionExercise.session_id == session_id,
    ).first()
    if not se:
        raise HTTPException(status_code=404, detail="Session exercise not found")

    perf = ExercisePerformance(
        session_exercise_id=se.id,
        set_number=body.set_number,
        reps_completed=body.reps_completed,
        duration_seconds=body.duration_seconds,
        weight_kg=body.weight_kg,
        rpe=body.rpe,
        pose_score=body.pose_score,
        notes=body.notes,
    )
    db.add(perf)

    # Update rolling volume
    if body.weight_kg and body.reps_completed:
        session.total_volume_kg += body.weight_kg * body.reps_completed

    db.commit()
    db.refresh(session)
    return session


@router.post("/sessions/{session_id}/swap", response_model=WorkoutSessionResponse)
async def swap_exercise(
    session_id: str,
    body: SwapExerciseRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    session = _get_own_session(session_id, current_user.id, db)
    if session.status != SessionStatus.in_progress:
        raise HTTPException(status_code=400, detail="Session is not in progress")

    se = db.query(WorkoutSessionExercise).filter(
        WorkoutSessionExercise.id == body.session_exercise_id,
        WorkoutSessionExercise.session_id == session_id,
    ).first()
    if not se:
        raise HTTPException(status_code=404, detail="Session exercise not found")

    new_ex = db.query(Exercise).filter(Exercise.id == body.new_exercise_id, Exercise.is_active == True).first()  # noqa: E712
    if not new_ex:
        raise HTTPException(status_code=404, detail="Replacement exercise not found")

    se.substituted_from_id = se.exercise_id
    se.exercise_id = body.new_exercise_id
    se.is_substituted = True

    db.commit()
    db.refresh(session)
    return session


@router.post("/sessions/{session_id}/complete", response_model=WorkoutSessionResponse)
async def complete_session(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    session = _get_own_session(session_id, current_user.id, db)
    if session.status != SessionStatus.in_progress:
        raise HTTPException(status_code=400, detail="Session is not in progress")

    now_iso = datetime.now(timezone.utc).isoformat()
    session.status = SessionStatus.completed
    session.completed_at = now_iso

    if session.started_at:
        started = datetime.fromisoformat(session.started_at)
        completed = datetime.fromisoformat(now_iso)
        session.duration_seconds = int((completed - started).total_seconds())

    points = award_session_points(session, db)
    session.points_earned = points

    db.commit()
    db.refresh(session)
    return session


@router.post("/sessions/{session_id}/abandon", response_model=WorkoutSessionResponse)
async def abandon_session(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    session = _get_own_session(session_id, current_user.id, db)
    if session.status == SessionStatus.completed:
        raise HTTPException(status_code=400, detail="Session already completed")
    session.status = SessionStatus.abandoned
    session.completed_at = datetime.now(timezone.utc).isoformat()
    db.commit()
    db.refresh(session)
    return session


@router.get("/history", response_model=WorkoutHistoryResponse)
async def get_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.status == SessionStatus.completed,
    ).order_by(WorkoutSession.completed_at.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return WorkoutHistoryResponse(
        items=[WorkoutSessionSummary.model_validate(s) for s in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_own_session(session_id: str, user_id: str, db: Session) -> WorkoutSession:
    session = db.query(WorkoutSession).filter(WorkoutSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return session
