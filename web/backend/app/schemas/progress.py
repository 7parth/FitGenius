from pydantic import BaseModel
from typing import Optional


class ProgressSummaryResponse(BaseModel):
    total_sessions: int
    total_duration_minutes: int
    total_volume_kg: float
    total_calories: float
    avg_session_duration_minutes: float
    sessions_this_week: int
    sessions_this_month: int
    current_streak_days: int


class ProgressHistoryPoint(BaseModel):
    date: str          # YYYY-MM-DD
    value: float
    label: Optional[str] = None


class ProgressHistoryResponse(BaseModel):
    metric: str        # "volume" | "duration" | "calories" | "sessions"
    period: str        # "7d" | "30d" | "90d" | "1y"
    data: list[ProgressHistoryPoint]


class ExerciseProgressResponse(BaseModel):
    exercise_id: str
    exercise_name: str
    personal_record_kg: Optional[float]
    personal_record_reps: Optional[int]
    history: list[ProgressHistoryPoint]


class PersonalRecord(BaseModel):
    exercise_id: str
    exercise_name: str
    record_weight_kg: Optional[float]
    record_reps: Optional[int]
    achieved_at: str


class ActivityCalendarDay(BaseModel):
    date: str       # YYYY-MM-DD
    count: int      # sessions on that day
    intensity: int  # 0–4 for heatmap shading


class ActivityCalendarResponse(BaseModel):
    year: int
    data: list[ActivityCalendarDay]
