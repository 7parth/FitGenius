"""
Alembic env.py — reads DATABASE_URL from the app settings and imports
all models so autogenerate can detect every table.
"""
import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# ── Make the backend package importable ──────────────────────────────────────
# Resolve path so alembic can find `app.*` whether run from repo root or
# from web/backend/.
_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND_ROOT = os.path.dirname(_HERE)  # web/backend/
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

# ── Import app config & all models ───────────────────────────────────────────
from app.core.config import settings           # noqa: E402
from app.models import Base                    # noqa: E402  — imports all models

# Alembic Config object
config = context.config

# Override sqlalchemy.url from app settings (never hard-code credentials here)
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Set up loggers from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata for autogenerate support
target_metadata = Base.metadata


# ── Run migrations ────────────────────────────────────────────────────────────

def run_migrations_offline() -> None:
    """Run in 'offline' mode — emit SQL to stdout without a live connection."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run in 'online' mode — connect to the database and apply migrations."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
