from pydantic import BaseModel, ConfigDict, Field
from datetime import date, datetime
from typing import Optional
from app.models.nutrition import MealType, DietaryPreference


class NutritionGoalCreateUpdate(BaseModel):
    target_calories: Optional[int] = Field(2000, ge=800, le=10000)
    target_protein_g: Optional[int] = Field(150, ge=0, le=500)
    target_carbs_g: Optional[int] = Field(200, ge=0, le=1000)
    target_fat_g: Optional[int] = Field(65, ge=0, le=300)
    dietary_preference: Optional[DietaryPreference] = DietaryPreference.anything


class NutritionGoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    target_calories: int
    target_protein_g: int
    target_carbs_g: int
    target_fat_g: int
    dietary_preference: DietaryPreference


class NutritionLogCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    meal_type: MealType = MealType.snack
    calories: int = Field(..., ge=1, le=5000)
    protein_g: float = Field(0.0, ge=0.0)
    carbs_g: float = Field(0.0, ge=0.0)
    fat_g: float = Field(0.0, ge=0.0)
    log_date: Optional[date] = None


class NutritionLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    log_date: date
    meal_type: MealType
    name: str
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    created_at: datetime


class DailyNutritionSummary(BaseModel):
    log_date: date
    total_calories: int
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    goal: NutritionGoalResponse
    logs: list[NutritionLogResponse]


class MealRecommendationRequest(BaseModel):
    target_meal: Optional[MealType] = MealType.lunch
    max_calories: Optional[int] = Field(600, ge=100, le=2000)


class MealIdea(BaseModel):
    title: str
    description: str
    meal_type: MealType
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    prep_time_minutes: int
    ingredients: list[str]
    dietary_tags: list[str]


class MealRecommendationResponse(BaseModel):
    recommendations: list[MealIdea]
    rationale: str
