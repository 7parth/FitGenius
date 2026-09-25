from pydantic import BaseModel, Field
from typing import Optional


class ExerciseBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    slug: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    category: str
    difficulty: str
    primary_muscles: list[str] = []
    secondary_muscles: list[str] = []
    equipment_required: list[str] = []
    is_bodyweight: bool = False
    instructions: list[str] = []
    tips: list[str] = []
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    default_sets: int = 3
    default_reps: Optional[int] = None
    default_duration_seconds: Optional[int] = None
    rest_seconds: int = 60
    calories_per_minute: Optional[float] = None
    accessibility_categories: list[str] = []
    contraindications: list[str] = []
    alternative_exercise_ids: list[str] = []
    supports_pose_analysis: bool = False
    pose_model_key: Optional[str] = None


class ExerciseCreate(ExerciseBase):
    pass


class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    primary_muscles: Optional[list[str]] = None
    secondary_muscles: Optional[list[str]] = None
    equipment_required: Optional[list[str]] = None
    is_bodyweight: Optional[bool] = None
    instructions: Optional[list[str]] = None
    tips: Optional[list[str]] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    default_sets: Optional[int] = None
    default_reps: Optional[int] = None
    default_duration_seconds: Optional[int] = None
    rest_seconds: Optional[int] = None
    calories_per_minute: Optional[float] = None
    accessibility_categories: Optional[list[str]] = None
    contraindications: Optional[list[str]] = None
    alternative_exercise_ids: Optional[list[str]] = None
    supports_pose_analysis: Optional[bool] = None
    pose_model_key: Optional[str] = None
    is_active: Optional[bool] = None


class ExerciseResponse(ExerciseBase):
    id: str
    is_active: bool

    model_config = {"from_attributes": True}


class ExerciseListResponse(BaseModel):
    items: list[ExerciseResponse]
    total: int
    page: int
    page_size: int
    pages: int
