from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from collections import defaultdict
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.workout import WorkoutSession, WorkoutSessionExercise, ExercisePerformance, SessionStatus
from app.models.gamification import UserGamification
from app.schemas.progress import (
    ProgressSummaryResponse,
    ProgressHistoryResponse,
    ProgressHistoryPoint,
    ActivityCalendarResponse,
    ActivityCalendarDay,
    PersonalRecord,
    ExerciseProgressResponse,
)

router = APIRouter()


@router.get("/summary", response_model=ProgressSummaryResponse)
async def get_progress_summary(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(WorkoutSession)
        .filter(
            WorkoutSession.user_id == current_user.id,
            WorkoutSession.status == SessionStatus.completed,
        )
        .all()
    )

    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    month_start = now - timedelta(days=30)

    total_duration = sum((s.duration_seconds or 0) for s in sessions)
    total_volume = sum(s.total_volume_kg for s in sessions)
    total_calories = sum(s.total_calories for s in sessions)
    sessions_week = sum(
        1 for s in sessions
        if s.completed_at and datetime.fromisoformat(s.completed_at) >= week_start
    )
    sessions_month = sum(
        1 for s in sessions
        if s.completed_at and datetime.fromisoformat(s.completed_at) >= month_start
    )

    gam = db.query(UserGamification).filter(
        UserGamification.user_id == current_user.id
    ).first()
    streak = gam.current_streak_days if gam else 0
    avg_duration = (total_duration / 60 / len(sessions)) if sessions else 0.0

    return ProgressSummaryResponse(
        total_sessions=len(sessions),
        total_duration_minutes=total_duration // 60,
        total_volume_kg=round(total_volume, 2),
        total_calories=round(total_calories, 2),
        avg_session_duration_minutes=round(avg_duration, 1),
        sessions_this_week=sessions_week,
        sessions_this_month=sessions_month,
        current_streak_days=streak,
    )


@router.get("/history", response_model=ProgressHistoryResponse)
async def get_progress_history(
    metric: str = Query("volume", pattern="^(volume|duration|calories|sessions)$"),
    period: str = Query("30d", pattern="^(7d|30d|90d|1y)$"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    period_days = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}[period]
    since = datetime.now(timezone.utc) - timedelta(days=period_days)

    sessions = (
        db.query(WorkoutSession)
        .filter(
            WorkoutSession.user_id == current_user.id,
            WorkoutSession.status == SessionStatus.completed,
        )
        .all()
    )
    sessions = [
        s for s in sessions
        if s.completed_at and datetime.fromisoformat(s.completed_at) >= since
    ]

    daily: dict[str, float] = defaultdict(float)
    for s in sessions:
        day = s.completed_at[:10]  # YYYY-MM-DD
        if metric == "volume":
            daily[day] += s.total_volume_kg
        elif metric == "duration":
            daily[day] += (s.duration_seconds or 0) / 60
        elif metric == "calories":
            daily[day] += s.total_calories
        elif metric == "sessions":
            daily[day] += 1

    data = [
        ProgressHistoryPoint(date=date, value=round(val, 2))
        for date, val in sorted(daily.items())
    ]
    return ProgressHistoryResponse(metric=metric, period=period, data=data)


@router.get("/exercise/{exercise_id}", response_model=ExerciseProgressResponse)
async def get_exercise_progress(
    exercise_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    from app.models.exercise import Exercise

    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Exercise not found")

    session_exercises = (
        db.query(WorkoutSessionExercise)
        .join(WorkoutSession)
        .filter(
            WorkoutSessionExercise.exercise_id == exercise_id,
            WorkoutSession.user_id == current_user.id,
            WorkoutSession.status == SessionStatus.completed,
        )
        .all()
    )

    pr_kg: float | None = None
    pr_reps: int | None = None
    history_by_date: dict[str, float] = {}

    for se in session_exercises:
        for perf in se.performances:
            if perf.weight_kg and (pr_kg is None or perf.weight_kg > pr_kg):
                pr_kg = perf.weight_kg
            if perf.reps_completed and (pr_reps is None or perf.reps_completed > pr_reps):
                pr_reps = perf.reps_completed
            if se.session.completed_at:
                day = se.session.completed_at[:10]
                vol = (perf.weight_kg or 0) * (perf.reps_completed or 1)
                history_by_date[day] = history_by_date.get(day, 0) + vol

    history = [
        ProgressHistoryPoint(date=d, value=round(v, 2))
        for d, v in sorted(history_by_date.items())
    ]

    return ExerciseProgressResponse(
        exercise_id=exercise_id,
        exercise_name=exercise.name,
        personal_record_kg=pr_kg,
        personal_record_reps=pr_reps,
        history=history,
    )


@router.get("/records", response_model=list[PersonalRecord])
async def get_personal_records(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    from app.models.exercise import Exercise

    session_exercises = (
        db.query(WorkoutSessionExercise)
        .join(WorkoutSession)
        .filter(
            WorkoutSession.user_id == current_user.id,
            WorkoutSession.status == SessionStatus.completed,
        )
        .all()
    )

    records: dict[str, dict] = {}
    for se in session_exercises:
        for perf in se.performances:
            ex_id = se.exercise_id
            if ex_id not in records:
                records[ex_id] = {"weight": None, "reps": None, "at": None}
            if perf.weight_kg and (records[ex_id]["weight"] is None or perf.weight_kg > records[ex_id]["weight"]):
                records[ex_id]["weight"] = perf.weight_kg
                records[ex_id]["at"] = se.session.completed_at

    result = []
    for ex_id, data in records.items():
        ex = db.query(Exercise).filter(Exercise.id == ex_id).first()
        if ex:
            result.append(PersonalRecord(
                exercise_id=ex_id,
                exercise_name=ex.name,
                record_weight_kg=data["weight"],
                record_reps=data["reps"],
                achieved_at=data["at"] or "",
            ))
    return result


@router.get("/activity-calendar", response_model=ActivityCalendarResponse)
async def get_activity_calendar(
    year: int = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if not year:
        year = datetime.now(timezone.utc).year

    sessions = (
        db.query(WorkoutSession)
        .filter(
            WorkoutSession.user_id == current_user.id,
            WorkoutSession.status == SessionStatus.completed,
        )
        .all()
    )

    day_counts: dict[str, int] = defaultdict(int)
    for s in sessions:
        if s.completed_at and s.completed_at[:4] == str(year):
            day_counts[s.completed_at[:10]] += 1

    data = [
        ActivityCalendarDay(
            date=date,
            count=count,
            intensity=min(4, count),
        )
        for date, count in day_counts.items()
    ]
    return ActivityCalendarResponse(year=year, data=data)
