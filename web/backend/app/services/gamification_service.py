"""
Gamification service.

Points formula: base(difficulty) × duration_multiplier × streak_multiplier
Leaderboard backed by Redis sorted sets (ZADD/ZREVRANGE).
"""
from datetime import datetime, timezone, date
from sqlalchemy.orm import Session

from app.models.workout import WorkoutSession
from app.models.gamification import UserGamification, UserAchievement, Achievement
from app.models.user import User
from app.core.redis_client import get_redis
from app.schemas.gamification import LeaderboardResponse, LeaderboardEntry

# ── Points constants ───────────────────────────────────────────────────────────
_BASE_POINTS = {"beginner": 50, "intermediate": 100, "advanced": 150}
_LEVEL_THRESHOLDS = [0, 500, 1500, 3500, 7000, 12000, 20000, 30000, 45000, 65000]

_LEADERBOARD_KEY = "leaderboard:weekly"
_LEADERBOARD_TTL = 7 * 86400  # 7 days


# ── Public API ─────────────────────────────────────────────────────────────────

def award_session_points(session: WorkoutSession, db: Session) -> int:
    """
    Compute and persist gamification points for a completed session.
    Returns points awarded.
    """
    user = db.query(User).filter(User.id == session.user_id).first()
    if not user:
        return 0

    gam = _get_or_create_gamification(user.id, db)

    # Determine difficulty from template or default to beginner
    difficulty = "beginner"
    if session.template:
        difficulty = session.template.difficulty.lower()
        if difficulty not in _BASE_POINTS:
            difficulty = "beginner"

    base = _BASE_POINTS[difficulty]

    # Duration multiplier: 1.0 at 30 min, +0.01 per extra minute, max 1.5
    duration_min = (session.duration_seconds or 0) / 60
    duration_mult = min(1.5, 1.0 + max(0, duration_min - 30) * 0.01)

    # Streak multiplier: 1.0 base, +0.05 per day of streak, max 2.0
    streak_mult = min(2.0, 1.0 + gam.current_streak_days * 0.05)

    points = int(base * duration_mult * streak_mult)

    # Update streak
    today = date.today().isoformat()
    _update_streak(gam, today)

    # Update totals
    gam.total_points += points
    gam.weekly_points += points
    gam.xp_toward_next_level += points
    gam.last_workout_date = today

    # Level up
    _update_level(gam)

    db.flush()

    # Push to Redis leaderboard sorted set
    _push_to_redis_leaderboard(user, gam)

    # Check achievements
    _check_achievements(user, gam, session, db)

    return points


def compute_leaderboard(current_user_id: str, limit: int, db: Session) -> LeaderboardResponse:
    """
    Build leaderboard. Prefers Redis sorted set; falls back to Postgres.
    Always includes the requesting user's rank even if outside top N.
    """
    redis = get_redis()
    if redis and redis.exists(_LEADERBOARD_KEY):
        return _leaderboard_from_redis(current_user_id, limit, db, redis)
    return _leaderboard_from_db(current_user_id, limit, db)


# ── Internal helpers ───────────────────────────────────────────────────────────

def _get_or_create_gamification(user_id: str, db: Session) -> UserGamification:
    gam = db.query(UserGamification).filter(UserGamification.user_id == user_id).first()
    if not gam:
        gam = UserGamification(user_id=user_id)
        db.add(gam)
        db.flush()
    return gam


def _update_streak(gam: UserGamification, today: str) -> None:
    if not gam.last_workout_date:
        gam.current_streak_days = 1
    else:
        last = date.fromisoformat(gam.last_workout_date)
        today_date = date.fromisoformat(today)
        delta = (today_date - last).days
        if delta == 1:
            gam.current_streak_days += 1
        elif delta > 1:
            gam.current_streak_days = 1
        # delta == 0 means same day — no change

    gam.longest_streak_days = max(gam.longest_streak_days, gam.current_streak_days)


def _update_level(gam: UserGamification) -> None:
    for level, threshold in enumerate(_LEVEL_THRESHOLDS):
        if gam.total_points < threshold:
            gam.level = max(1, level - 1)
            break
    else:
        gam.level = len(_LEVEL_THRESHOLDS)

    # XP toward next level
    current_threshold = _LEVEL_THRESHOLDS[min(gam.level - 1, len(_LEVEL_THRESHOLDS) - 1)]
    gam.xp_toward_next_level = gam.total_points - current_threshold


def _push_to_redis_leaderboard(user: User, gam: UserGamification) -> None:
    redis = get_redis()
    if not redis:
        return
    # Store as "display_name|user_id" → never expose email
    member = f"{user.display_name}|{user.id}"
    redis.zadd(_LEADERBOARD_KEY, {member: gam.weekly_points})
    redis.expire(_LEADERBOARD_KEY, _LEADERBOARD_TTL)


def _leaderboard_from_redis(
    current_user_id: str, limit: int, db: Session, redis
) -> LeaderboardResponse:
    top_raw = redis.zrevrange(_LEADERBOARD_KEY, 0, limit - 1, withscores=True)
    total = redis.zcard(_LEADERBOARD_KEY)

    entries = []
    current_user_rank = -1

    for rank, (member_bytes, score) in enumerate(top_raw, start=1):
        member = member_bytes.decode() if isinstance(member_bytes, bytes) else member_bytes
        display_name, user_id = member.rsplit("|", 1)
        is_current = user_id == current_user_id
        if is_current:
            current_user_rank = rank
        entries.append(LeaderboardEntry(
            rank=rank,
            display_name=display_name,
            total_points=int(score),
            current_streak_days=0,  # not stored in Redis — enriched below
            level=1,
            is_current_user=is_current,
        ))

    # Enrich with streak/level from DB for top entries
    user_ids = [e.display_name.split("|")[-1] if "|" in e.display_name else "" for e in entries]
    gams = db.query(UserGamification).filter(UserGamification.user_id.in_(
        [member.rsplit("|", 1)[1] for member, _ in top_raw]
    )).all()
    gam_map = {g.user_id: g for g in gams}

    for i, (member_bytes, _) in enumerate(top_raw):
        member = member_bytes.decode() if isinstance(member_bytes, bytes) else member_bytes
        _, uid = member.rsplit("|", 1)
        if uid in gam_map:
            entries[i].current_streak_days = gam_map[uid].current_streak_days
            entries[i].level = gam_map[uid].level

    # If current user not in top N, find their rank
    if current_user_rank == -1:
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if current_user:
            member_key = f"{current_user.display_name}|{current_user_id}"
            raw_rank = redis.zrevrank(_LEADERBOARD_KEY, member_key)
            current_user_rank = (raw_rank + 1) if raw_rank is not None else total

    return LeaderboardResponse(
        entries=entries,
        current_user_rank=current_user_rank,
        total_users=total,
    )


def _leaderboard_from_db(current_user_id: str, limit: int, db: Session) -> LeaderboardResponse:
    all_gam = (
        db.query(UserGamification)
        .join(User, UserGamification.user_id == User.id)
        .filter(User.is_active == True)  # noqa: E712
        .order_by(UserGamification.weekly_points.desc())
        .all()
    )
    total = len(all_gam)

    current_user_rank = 1
    entries = []
    for rank, gam in enumerate(all_gam[:limit], start=1):
        user = db.query(User).filter(User.id == gam.user_id).first()
        if not user:
            continue
        is_current = gam.user_id == current_user_id
        if is_current:
            current_user_rank = rank
        entries.append(LeaderboardEntry(
            rank=rank,
            display_name=user.display_name,   # NEVER email
            total_points=gam.weekly_points,
            current_streak_days=gam.current_streak_days,
            level=gam.level,
            is_current_user=is_current,
        ))

    # If current user outside top N
    if not any(e.is_current_user for e in entries):
        for rank, gam in enumerate(all_gam, start=1):
            if gam.user_id == current_user_id:
                current_user_rank = rank
                break

    return LeaderboardResponse(
        entries=entries,
        current_user_rank=current_user_rank,
        total_users=total,
    )


# ── Achievement checks ─────────────────────────────────────────────────────────

_ACHIEVEMENT_CHECKS = [
    ("first_workout",   lambda ctx: ctx["total_sessions"] >= 1),
    ("ten_workouts",    lambda ctx: ctx["total_sessions"] >= 10),
    ("fifty_workouts",  lambda ctx: ctx["total_sessions"] >= 50),
    ("week_streak",     lambda ctx: ctx["streak"] >= 7),
    ("month_streak",    lambda ctx: ctx["streak"] >= 30),
    ("level_5",         lambda ctx: ctx["level"] >= 5),
    ("level_10",        lambda ctx: ctx["level"] >= 10),
]


def _check_achievements(
    user: User,
    gam: UserGamification,
    session: WorkoutSession,
    db: Session,
) -> None:
    from app.models.workout import WorkoutSession as WS, SessionStatus

    total_sessions = db.query(WS).filter(
        WS.user_id == user.id, WS.status == SessionStatus.completed
    ).count()

    ctx = {
        "total_sessions": total_sessions,
        "streak": gam.current_streak_days,
        "level": gam.level,
    }

    earned_slugs = {
        ua.achievement.slug
        for ua in db.query(UserAchievement)
        .filter(UserAchievement.user_id == user.id)
        .all()
    }

    for slug, check_fn in _ACHIEVEMENT_CHECKS:
        if slug in earned_slugs:
            continue
        if check_fn(ctx):
            achievement = db.query(Achievement).filter(Achievement.slug == slug).first()
            if achievement:
                ua = UserAchievement(
                    user_id=user.id,
                    achievement_id=achievement.id,
                    earned_at=datetime.now(timezone.utc).isoformat(),
                    context=ctx,
                )
                db.add(ua)
                gam.total_points += achievement.points_value
