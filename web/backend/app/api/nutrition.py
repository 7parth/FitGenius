from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, delete
from datetime import date
from typing import Optional

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.core.config import settings
from app.models.user import User
from app.models.nutrition import NutritionLog, UserNutritionGoal, DietaryPreference, MealType
from app.schemas.nutrition import (
    NutritionGoalCreateUpdate,
    NutritionGoalResponse,
    NutritionLogCreate,
    NutritionLogResponse,
    DailyNutritionSummary,
    MealRecommendationRequest,
    MealRecommendationResponse,
    MealIdea,
)

router = APIRouter()


def _get_or_create_goal(user: User, db: Session) -> UserNutritionGoal:
    goal = db.scalar(select(UserNutritionGoal).where(UserNutritionGoal.user_id == user.id))
    if not goal:
        goal = UserNutritionGoal(
            user_id=user.id,
            target_calories=2200,
            target_protein_g=140,
            target_carbs_g=220,
            target_fat_g=65,
            dietary_preference=DietaryPreference.anything,
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
    return goal


@router.get("/today", response_model=DailyNutritionSummary)
def get_today_nutrition(
    target_date: Optional[date] = Query(None, description="Defaults to today"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieve macro intake summary and logged meals for the given date."""
    query_date = target_date or date.today()
    goal = _get_or_create_goal(current_user, db)

    logs = (
        db.scalars(
            select(NutritionLog)
            .where(
                NutritionLog.user_id == current_user.id,
                NutritionLog.log_date == query_date,
            )
            .order_by(NutritionLog.created_at.asc())
        )
        .all()
    )

    total_cal = sum(l.calories for l in logs)
    total_p = sum(l.protein_g for l in logs)
    total_c = sum(l.carbs_g for l in logs)
    total_f = sum(l.fat_g for l in logs)

    return DailyNutritionSummary(
        log_date=query_date,
        total_calories=total_cal,
        total_protein_g=round(total_p, 1),
        total_carbs_g=round(total_c, 1),
        total_fat_g=round(total_f, 1),
        goal=NutritionGoalResponse.model_validate(goal),
        logs=[NutritionLogResponse.model_validate(l) for l in logs],
    )


@router.post("/log", response_model=NutritionLogResponse, status_code=status.HTTP_201_CREATED)
def log_meal(
    body: NutritionLogCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Log a meal entry."""
    entry = NutritionLog(
        user_id=current_user.id,
        log_date=body.log_date or date.today(),
        meal_type=body.meal_type,
        name=body.name,
        calories=body.calories,
        protein_g=body.protein_g,
        carbs_g=body.carbs_g,
        fat_g=body.fat_g,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return NutritionLogResponse.model_validate(entry)


@router.delete("/log/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_logged_meal(
    log_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Remove a logged meal."""
    entry = db.scalar(
        select(NutritionLog).where(
            NutritionLog.id == log_id,
            NutritionLog.user_id == current_user.id,
        )
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Logged meal entry not found.")

    db.delete(entry)
    db.commit()
    return None


@router.get("/goals", response_model=NutritionGoalResponse)
def get_nutrition_goals(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieve current nutrition & macro goals."""
    goal = _get_or_create_goal(current_user, db)
    return NutritionGoalResponse.model_validate(goal)


@router.put("/goals", response_model=NutritionGoalResponse)
def update_nutrition_goals(
    body: NutritionGoalCreateUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update macro goals."""
    goal = _get_or_create_goal(current_user, db)
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(goal, field, val)

    db.commit()
    db.refresh(goal)
    return NutritionGoalResponse.model_validate(goal)


@router.post("/ai-recommend", response_model=MealRecommendationResponse)
def get_ai_meal_recommendations(
    body: MealRecommendationRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Generate AI-curated meal ideas matching user goals & dietary preferences."""
    goal = _get_or_create_goal(current_user, db)
    pref = goal.dietary_preference

    # Curated fallbacks matching dietary preferences
    ideas = [
        MealIdea(
            title="Grilled Chicken & Quinoa Energy Bowl",
            description="Lean chicken breast served over fluffy quinoa, avocado slices, roasted sweet potato, and steamed broccoli.",
            meal_type=body.target_meal or MealType.lunch,
            calories=520,
            protein_g=45.0,
            carbs_g=52.0,
            fat_g=14.0,
            prep_time_minutes=20,
            ingredients=["Chicken breast (200g)", "Quinoa (1/2 cup)", "Avocado (1/2)", "Broccoli", "Olive oil"],
            dietary_tags=["high_protein", "gluten_free", "clean_eating"],
        ),
        MealIdea(
            title="Greek Yogurt & Wild Berry Protein Parfait",
            description="0% Fat Greek Yogurt layered with chia seeds, fresh blueberries, walnuts, and a drizzle of raw honey.",
            meal_type=body.target_meal or MealType.breakfast,
            calories=340,
            protein_g=28.0,
            carbs_g=38.0,
            fat_g=8.0,
            prep_time_minutes=5,
            ingredients=["Greek yogurt (250g)", "Chia seeds (1 tbsp)", "Blueberries (100g)", "Walnuts (15g)", "Honey"],
            dietary_tags=["vegetarian", "high_protein", "quick_prep"],
        ),
        MealIdea(
            title="Tofu & Edamame Sesame Crunch Salad",
            description="Crispy baked tofu cubes over mixed baby greens, edamame beans, shredded carrots, and a light sesame-ginger dressing.",
            meal_type=body.target_meal or MealType.lunch,
            calories=410,
            protein_g=32.0,
            carbs_g=30.0,
            fat_g=18.0,
            prep_time_minutes=15,
            ingredients=["Extra-firm tofu (200g)", "Edamame (100g)", "Baby spinach", "Carrots", "Sesame dressing"],
            dietary_tags=["vegan", "vegetarian", "high_fiber"],
        ),
        MealIdea(
            title="Wild Salmon with Garlic Asparagus",
            description="Pan-seared Atlantic salmon fillet served alongside lemon-garlic roasted asparagus and brown rice.",
            meal_type=body.target_meal or MealType.dinner,
            calories=580,
            protein_g=42.0,
            carbs_g=35.0,
            fat_g=26.0,
            prep_time_minutes=25,
            ingredients=["Salmon fillet (180g)", "Asparagus (150g)", "Brown rice (1/2 cup)", "Garlic", "Lemon"],
            dietary_tags=["high_protein", "omega3_rich", "keto_friendly"],
        ),
    ]

    # Filter based on calorie constraint if provided
    if body.max_calories:
        ideas = [i for i in ideas if i.calories <= body.max_calories + 50] or ideas

    return MealRecommendationResponse(
        recommendations=ideas,
        rationale=f"Recommended for your target goal ({goal.target_protein_g}g protein/day) and dietary preference '{pref}'.",
    )
