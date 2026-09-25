from pydantic import BaseModel, Field
from typing import Optional
from .exercise import ExerciseResponse


# ── Template schemas ──────────────────────────────────────────────────────────

class TemplateExerciseResponse(BaseModel):
    id: str
    exercise_id: str
    order_index: int
    sets: int
    reps: Optional[int]
    duration_seconds: Optional[int]
    rest_seconds: int
    notes: Optional[str]
    exercise: ExerciseResponse

    model_config = {"from_attributes": True}


class WorkoutTemplateResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    difficulty: str
    category: str
    estimated_duration_minutes: int
    fitness_goals: list[str]
    required_equipment: list[str]
    accessibility_tags: list[str]
    exercises: list[TemplateExerciseResponse]

    model_config = {"from_attributes": True}


# ── Session schemas ───────────────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    template_id: Optional[str] = None
    name: Optional[str] = Field(None, max_length=200)


class LogSetRequest(BaseModel):
    set_number: int = Field(..., ge=1)
    reps_completed: Optional[int] = Field(None, ge=0)
    duration_seconds: Optional[int] = Field(None, ge=0)
    weight_kg: Optional[float] = Field(None, ge=0)
    rpe: Optional[int] = Field(None, ge=1, le=10)
    pose_score: Optional[float] = Field(None, ge=0, le=100)
    notes: Optional[str] = None


class SwapExerciseRequest(BaseModel):
    session_exercise_id: str
    new_exercise_id: str


class PerformanceResponse(BaseModel):
    id: str
    set_number: int
    reps_completed: Optional[int]
    duration_seconds: Optional[int]
    weight_kg: Optional[float]
    rpe: Optional[int]
    pose_score: Optional[float]
    notes: Optional[str]

    model_config = {"from_attributes": True}


class SessionExerciseResponse(BaseModel):
    id: str
    exercise_id: str
    order_index: int
    planned_sets: int
    planned_reps: Optional[int]
    planned_duration_seconds: Optional[int]
    rest_seconds: int
    is_substituted: bool
    exercise: ExerciseResponse
    performances: list[PerformanceResponse]

    model_config = {"from_attributes": True}


class WorkoutSessionResponse(BaseModel):
    id: str
    user_id: str
    template_id: Optional[str]
    name: str
    status: str
    started_at: Optional[str]
    completed_at: Optional[str]
    duration_seconds: Optional[int]
    total_volume_kg: float
    total_calories: float
    notes: Optional[str]
    fatigue_level: Optional[str]
    points_earned: int
    exercises: list[SessionExerciseResponse]

    model_config = {"from_attributes": True}


class WorkoutSessionSummary(BaseModel):
    """Lightweight list item — no exercises nested."""
    id: str
    name: str
    status: str
    started_at: Optional[str]
    completed_at: Optional[str]
    duration_seconds: Optional[int]
    total_volume_kg: float
    total_calories: float
    points_earned: int

    model_config = {"from_attributes": True}


class WorkoutHistoryResponse(BaseModel):
    items: list[WorkoutSessionSummary]
    total: int
    page: int
    page_size: int
