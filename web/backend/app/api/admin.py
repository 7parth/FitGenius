from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.models.workout import WorkoutSession, SessionStatus
from app.models.exercise import Exercise
from app.models.gamification import Challenge
from app.models.audit import AuditLog, AuditAction
from app.schemas.admin import (
    AdminUserListResponse,
    AdminUserListItem,
    AdminUserUpdate,
    AdminStatsResponse,
    ChallengeCreate,
)
from app.schemas.gamification import ChallengeResponse

router = APIRouter()


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_users = db.query(User).count()
    active_users = (
        db.query(WorkoutSession.user_id)
        .filter(
            WorkoutSession.status == SessionStatus.completed,
            WorkoutSession.completed_at >= week_ago.isoformat(),
        )
        .distinct()
        .count()
    )
    total_sessions = db.query(WorkoutSession).filter(
        WorkoutSession.status == SessionStatus.completed
    ).count()
    sessions_today = db.query(WorkoutSession).filter(
        WorkoutSession.status == SessionStatus.completed,
        WorkoutSession.completed_at >= today_start.isoformat(),
    ).count()
    total_exercises = db.query(Exercise).filter(Exercise.is_active == True).count()  # noqa: E712

    all_sessions = db.query(WorkoutSession).filter(
        WorkoutSession.status == SessionStatus.completed,
        WorkoutSession.duration_seconds.isnot(None),
    ).all()
    avg_duration = (
        sum(s.duration_seconds for s in all_sessions) / 60 / len(all_sessions)
        if all_sessions else 0.0
    )

    return AdminStatsResponse(
        total_users=total_users,
        active_users_7d=active_users,
        total_sessions=total_sessions,
        sessions_today=sessions_today,
        total_exercises=total_exercises,
        avg_session_duration_minutes=round(avg_duration, 1),
    )


@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    search: str | None = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if search:
        query = query.filter(
            User.email.ilike(f"%{search}%") | User.display_name.ilike(f"%{search}%")
        )
    total = query.count()
    items = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return AdminUserListResponse(
        items=[AdminUserListItem.model_validate(u) for u in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch("/users/{user_id}", response_model=AdminUserListItem)
async def update_user(
    user_id: str,
    body: AdminUserUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    before = {"is_active": user.is_active, "role": user.role}
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(user, field, value)

    action = AuditAction.user_role_changed if body.role else AuditAction.user_deactivated
    log = AuditLog(
        actor_id=current_user.id,
        target_id=user_id,
        action=action,
        resource_type="user",
        before_state=before,
        after_state=body.model_dump(exclude_none=True),
    )
    db.add(log)
    db.commit()
    db.refresh(user)
    return user


# ── Admin Challenges ──────────────────────────────────────────────────────────

@router.post("/challenges", response_model=ChallengeResponse, status_code=201)
async def create_challenge(
    body: ChallengeCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    challenge = Challenge(
        title=body.title,
        description=body.description,
        challenge_type=body.challenge_type,
        points_reward=body.points_reward,
        goal_criteria=body.goal_criteria,
        starts_at=body.starts_at,
        ends_at=body.ends_at,
        max_participants=body.max_participants,
        badge_id=body.badge_id,
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return ChallengeResponse(
        id=challenge.id,
        title=challenge.title,
        description=challenge.description,
        challenge_type=challenge.challenge_type,
        points_reward=challenge.points_reward,
        goal_criteria=challenge.goal_criteria,
        starts_at=challenge.starts_at,
        ends_at=challenge.ends_at,
        participant_count=0,
    )


@router.delete("/challenges/{challenge_id}", status_code=204)
async def delete_challenge(
    challenge_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    challenge.is_active = False
    db.commit()
