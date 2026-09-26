"""Seed an existing account with example nutrition goals and today's meals.

Usage:
    python scripts/seed_nutrition_demo.py --email user@example.com

Safe to run repeatedly: keeps existing goals and does not duplicate its sample
meal entries for the selected date. Use only with an account intended for demo
or development data.
"""

import argparse
import os
import sys
from datetime import date

_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.nutrition import DietaryPreference, MealType, NutritionLog, UserNutritionGoal
from app.models.user import User

SAMPLE_MEALS = [
    {
        "name": "Oatmeal, whey protein & blueberries",
        "meal_type": MealType.breakfast,
        "calories": 520,
        "protein_g": 42.0,
        "carbs_g": 65.0,
        "fat_g": 10.0,
    },
    {
        "name": "Grilled chicken quinoa bowl",
        "meal_type": MealType.lunch,
        "calories": 680,
        "protein_g": 58.0,
        "carbs_g": 72.0,
        "fat_g": 18.0,
    },
    {
        "name": "Greek yogurt & wild berries",
        "meal_type": MealType.snack,
        "calories": 250,
        "protein_g": 24.0,
        "carbs_g": 28.0,
        "fat_g": 4.0,
    },
]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--email", required=True, help="Existing account to receive demo nutrition data")
    parser.add_argument("--date", type=date.fromisoformat, default=date.today(), help="Date to seed (YYYY-MM-DD); defaults to today")
    args = parser.parse_args()

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == args.email.strip().lower()))
        if not user:
            parser.error("No existing account matches that email; register the account before seeding sample data.")

        goal = db.scalar(select(UserNutritionGoal).where(UserNutritionGoal.user_id == user.id))
        if not goal:
            goal = UserNutritionGoal(
                user_id=user.id,
                target_calories=2400,
                target_protein_g=175,
                target_carbs_g=250,
                target_fat_g=70,
                dietary_preference=DietaryPreference.anything,
            )
            db.add(goal)

        existing_names = set(db.scalars(
            select(NutritionLog.name).where(
                NutritionLog.user_id == user.id,
                NutritionLog.log_date == args.date,
            )
        ).all())
        created = 0
        for sample in SAMPLE_MEALS:
            if sample["name"] in existing_names:
                continue
            db.add(NutritionLog(user_id=user.id, log_date=args.date, **sample))
            created += 1

        db.commit()
        print(f"Nutrition demo data ready for {args.email}: {created} meal(s) added for {args.date}.")


if __name__ == "__main__":
    main()
