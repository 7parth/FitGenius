from pydantic import BaseModel, Field
from typing import Optional


class BasicProfileUpdate(BaseModel):
    age: Optional[int] = Field(None, ge=13, le=120)
    gender: Optional[str] = None
    height_cm: Optional[float] = Field(None, ge=50, le=300)
    weight_kg: Optional[float] = Field(None, ge=20, le=500)


class FitnessProfileUpdate(BaseModel):
    fitness_level: Optional[str] = None
    primary_goal: Optional[str] = None
    workout_frequency_per_week: Optional[int] = Field(None, ge=1, le=7)
    preferred_duration_minutes: Optional[int] = Field(None, ge=10, le=180)
    preferred_exercise_types: Optional[list[str]] = None
    available_equipment: Optional[list[str]] = None
    training_location: Optional[str] = None


class AccessibilityProfileUpdate(BaseModel):
    has_visual_impairment: Optional[bool] = None
    has_hearing_impairment: Optional[bool] = None
    has_mobility_limitation: Optional[bool] = None
    mobility_notes: Optional[str] = None
    preferred_interaction_mode: Optional[str] = None
    font_size_preference: Optional[str] = None
    high_contrast_mode: Optional[bool] = None
    reduced_motion: Optional[bool] = None
    captions_enabled: Optional[bool] = None
    simplified_ui: Optional[bool] = None
    exercise_restrictions: Optional[list[str]] = None
    exercises_to_avoid: Optional[list[str]] = None


class OnboardingCompleteRequest(BaseModel):
    """Sent at step 5 of onboarding wizard to commit the full profile."""
    basic: BasicProfileUpdate
    fitness: FitnessProfileUpdate
    accessibility: AccessibilityProfileUpdate


class UserProfileResponse(BaseModel):
    user_id: str
    age: Optional[int]
    gender: Optional[str]
    height_cm: Optional[float]
    weight_kg: Optional[float]
    fitness_level: str
    primary_goal: str
    workout_frequency_per_week: int
    preferred_duration_minutes: int
    preferred_exercise_types: list[str]
    available_equipment: list[str]
    training_location: str
    onboarding_completed: bool
    onboarding_last_step: int

    model_config = {"from_attributes": True}


class AccessibilityProfileResponse(BaseModel):
    user_id: str
    has_visual_impairment: bool
    has_hearing_impairment: bool
    has_mobility_limitation: bool
    mobility_notes: Optional[str]
    preferred_interaction_mode: str
    font_size_preference: str
    high_contrast_mode: bool
    reduced_motion: bool
    captions_enabled: bool
    simplified_ui: bool
    exercise_restrictions: list[str]
    exercises_to_avoid: list[str]

    model_config = {"from_attributes": True}
