from pydantic import BaseModel
from typing import Optional


class AchievementResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    icon: str
    tier: str
    points_value: int
    criteria: dict

    model_config = {"from_attributes": True}


class UserAchievementResponse(BaseModel):
    achievement: AchievementResponse
    earned_at: str

    model_config = {"from_attributes": True}


class GamificationSummaryResponse(BaseModel):
    total_points: int
    weekly_points: int
    current_streak_days: int
    longest_streak_days: int
    level: int
    xp_toward_next_level: int
    last_workout_date: Optional[str]
    recent_achievements: list[UserAchievementResponse]

    model_config = {"from_attributes": True}


class LeaderboardEntry(BaseModel):
    rank: int
    display_name: str      # NEVER email — enforced at service layer
    total_points: int
    current_streak_days: int
    level: int
    is_current_user: bool = False


class LeaderboardResponse(BaseModel):
    entries: list[LeaderboardEntry]
    current_user_rank: int
    total_users: int


class ChallengeResponse(BaseModel):
    id: str
    title: str
    description: str
    challenge_type: str
    points_reward: int
    goal_criteria: dict
    starts_at: str
    ends_at: str
    participant_count: int

    model_config = {"from_attributes": True}


class ChallengeProgressResponse(BaseModel):
    challenge_id: str
    progress: float  # 0.0–1.0
    status: str
    completed_at: Optional[str]

    model_config = {"from_attributes": True}


class JoinChallengeRequest(BaseModel):
    challenge_id: str


class UpdateChallengeProgressRequest(BaseModel):
    challenge_id: str
    progress: float  # 0.0–1.0
