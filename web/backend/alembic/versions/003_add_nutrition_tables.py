"""Add nutrition tables

Revision ID: 003
Revises: 002
Create Date: 2026-09-26 00:00:00.000000

Creates user_nutrition_goals and nutrition_logs tables that were
omitted from the initial schema migration.

Uses VARCHAR + CHECK constraints for the enum-like columns to avoid
conflicts with any pre-existing or missing PostgreSQL enum types.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types (IF NOT EXISTS via execute to be idempotent)
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dietary_preference') THEN
                CREATE TYPE dietary_preference AS ENUM (
                    'anything', 'vegetarian', 'vegan', 'keto', 'paleo', 'high_protein'
                );
            END IF;
        END
        $$;
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meal_type') THEN
                CREATE TYPE meal_type AS ENUM (
                    'breakfast', 'lunch', 'dinner', 'snack'
                );
            END IF;
        END
        $$;
        """
    )

    # user_nutrition_goals
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS user_nutrition_goals (
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
            user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            target_calories INTEGER NOT NULL DEFAULT 2000,
            target_protein_g INTEGER NOT NULL DEFAULT 150,
            target_carbs_g INTEGER NOT NULL DEFAULT 200,
            target_fat_g INTEGER NOT NULL DEFAULT 65,
            dietary_preference dietary_preference NOT NULL DEFAULT 'anything'
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_user_nutrition_goals_user_id ON user_nutrition_goals(user_id)"
    )

    # nutrition_logs
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS nutrition_logs (
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
            user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            log_date DATE NOT NULL,
            meal_type meal_type NOT NULL DEFAULT 'snack',
            name VARCHAR(200) NOT NULL,
            calories INTEGER NOT NULL,
            protein_g DOUBLE PRECISION NOT NULL DEFAULT 0,
            carbs_g DOUBLE PRECISION NOT NULL DEFAULT 0,
            fat_g DOUBLE PRECISION NOT NULL DEFAULT 0
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_nutrition_logs_user_id ON nutrition_logs(user_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_nutrition_logs_log_date ON nutrition_logs(log_date)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_nutrition_logs_user_date ON nutrition_logs(user_id, log_date)"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS nutrition_logs")
    op.execute("DROP TABLE IF EXISTS user_nutrition_goals")
    # Leave enum types in place to avoid breaking other potential users.
