from pydantic import BaseModel, EmailStr
from typing import Optional


class AdminUserListItem(BaseModel):
    id: str
    email: str
    display_name: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: str

    model_config = {"from_attributes": True}


class AdminUserListResponse(BaseModel):
    items: list[AdminUserListItem]
    total: int
    page: int
    page_size: int


class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None
    display_name: Optional[str] = None


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users_7d: int
    total_sessions: int
    sessions_today: int
    total_exercises: int
    avg_session_duration_minutes: float


class ChallengeCreate(BaseModel):
    title: str
    description: str
    challenge_type: str
    points_reward: int
    goal_criteria: dict
    starts_at: str
    ends_at: str
    max_participants: Optional[int] = None
    badge_id: Optional[str] = None
