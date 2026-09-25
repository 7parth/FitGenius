from sqlalchemy import String, Integer, Float, Date, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date
from .base import Base, UUIDMixin, TimestampMixin
import enum


class MealType(str, enum.Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"


class DietaryPreference(str, enum.Enum):
    anything = "anything"
    vegetarian = "vegetarian"
    vegan = "vegan"
    keto = "keto"
    paleo = "paleo"
    high_protein = "high_protein"


class UserNutritionGoal(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_nutrition_goals"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    target_calories: Mapped[int] = mapped_column(Integer, default=2000, nullable=False)
    target_protein_g: Mapped[int] = mapped_column(Integer, default=150, nullable=False)
    target_carbs_g: Mapped[int] = mapped_column(Integer, default=200, nullable=False)
    target_fat_g: Mapped[int] = mapped_column(Integer, default=65, nullable=False)
    dietary_preference: Mapped[str] = mapped_column(
        Enum(DietaryPreference, name="dietary_preference"),
        default=DietaryPreference.anything,
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="nutrition_goal")


class NutritionLog(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "nutrition_logs"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    log_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False, index=True)
    meal_type: Mapped[str] = mapped_column(
        Enum(MealType, name="meal_type"), default=MealType.snack, nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    calories: Mapped[int] = mapped_column(Integer, nullable=False)
    protein_g: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    carbs_g: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    fat_g: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="nutrition_logs")
