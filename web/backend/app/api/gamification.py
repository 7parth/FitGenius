from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.core.redis_client import get_redis
from app.models.user import User
from app.models.gamification import (
    UserGamification,
    UserAchievement,
    Achievement,
    Challenge,
    ChallengeParticipant,
    ChallengeStatus,
)
from app.schemas.gamification import (
    GamificationSummaryResponse,
    LeaderboardResponse,
    LeaderboardEntry,
    ChallengeResponse,
    ChallengeProgressResponse,
    JoinChallengeRequest,
    UpdateChallengeProgressRequest,
    UserAchievementResponse,
    AchievementResponse,
)
from app.services.gamification_service import compute_leaderboard

router = APIRouter()


@router.get("/summary", response_model=GamificationSummaryResponse)
async def get_gamification_summary(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    gam = db.query(UserGamification).filter(
        UserGamification.user_id == current_user.id
    ).first()
    if not gam:
        gam = UserGamification(user_id=current_user.id)
        db.add(gam)
        db.commit()
        db.refresh(gam)

    recent = (
        db.query(UserAchievement)
        .filter(UserAchievement.user_id == current_user.id)
        .order_by(UserAchievement.earned_at.desc())
        .limit(5)
        .all()
    )

    return GamificationSummaryResponse(
        total_points=gam.total_points,
        weekly_points=gam.weekly_points,
        current_streak_days=gam.current_streak_days,
        longest_streak_days=gam.longest_streak_days,
        level=gam.level,
        xp_toward_next_level=gam.xp_toward_next_level,
        last_workout_date=gam.last_workout_date,
        recent_achievements=[
            UserAchievementResponse.model_validate(ua) for ua in recent
        ],
    )


@router.get("/achievements", response_model=list[UserAchievementResponse])
async def get_my_achievements(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(UserAchievement)
        .filter(UserAchievement.user_id == current_user.id)
        .order_by(UserAchievement.earned_at.desc())
        .all()
    )


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    limit: int = Query(50, ge=5, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return compute_leaderboard(current_user.id, limit, db)


@router.get("/challenges", response_model=list[ChallengeResponse])
async def list_challenges(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    challenges = db.query(Challenge).filter(Challenge.is_active == True).all()  # noqa: E712
    result = []
    for c in challenges:
        count = db.query(ChallengeParticipant).filter(
            ChallengeParticipant.challenge_id == c.id
        ).count()
        result.append(ChallengeResponse(
            id=c.id,
            title=c.title,
            description=c.description,
            challenge_type=c.challenge_type,
            points_reward=c.points_reward,
            goal_criteria=c.goal_criteria,
            starts_at=c.starts_at,
            ends_at=c.ends_at,
            participant_count=count,
        ))
    return result


@router.post("/challenges/join", response_model=ChallengeProgressResponse)
async def join_challenge(
    body: JoinChallengeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    challenge = db.query(Challenge).filter(
        Challenge.id == body.challenge_id, Challenge.is_active == True  # noqa: E712
    ).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    existing = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.user_id == current_user.id,
        ChallengeParticipant.challenge_id == body.challenge_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already joined this challenge")

    if challenge.max_participants:
        count = db.query(ChallengeParticipant).filter(
            ChallengeParticipant.challenge_id == body.challenge_id
        ).count()
        if count >= challenge.max_participants:
            raise HTTPException(status_code=409, detail="Challenge is full")

    participant = ChallengeParticipant(
        user_id=current_user.id,
        challenge_id=body.challenge_id,
        progress=0.0,
        status=ChallengeStatus.active,
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


@router.put("/challenges/progress", response_model=ChallengeProgressResponse)
async def update_challenge_progress(
    body: UpdateChallengeProgressRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    from datetime import datetime, timezone

    participant = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.user_id == current_user.id,
        ChallengeParticipant.challenge_id == body.challenge_id,
    ).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Not participating in this challenge")

    participant.progress = min(1.0, max(0.0, body.progress))
    if participant.progress >= 1.0 and participant.status == ChallengeStatus.active:
        participant.status = ChallengeStatus.completed
        participant.completed_at = datetime.now(timezone.utc).isoformat()

    db.commit()
    db.refresh(participant)
    return participant
