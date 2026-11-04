"""Persist revoked refresh tokens in PostgreSQL.

Revision ID: 004
Revises: 003
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "004"
down_revision: str | None = "003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "revoked_refresh_tokens",
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("token_hash"),
    )
    op.create_index(
        "ix_revoked_refresh_tokens_user_id", "revoked_refresh_tokens", ["user_id"]
    )
    op.create_index(
        "ix_revoked_refresh_tokens_expires_at", "revoked_refresh_tokens", ["expires_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_revoked_refresh_tokens_expires_at", table_name="revoked_refresh_tokens")
    op.drop_index("ix_revoked_refresh_tokens_user_id", table_name="revoked_refresh_tokens")
    op.drop_table("revoked_refresh_tokens")
