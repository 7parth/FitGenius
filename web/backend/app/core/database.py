from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from .config import settings

# SQLite (used in tests) doesn't support pool_size/max_overflow
_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

_engine_kwargs: dict = {"pool_pre_ping": True}
if not _is_sqlite:
    _engine_kwargs.update({"pool_recycle": 300, "pool_size": 5, "max_overflow": 10})

engine = create_engine(settings.DATABASE_URL, **_engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """Dependency — yields a DB session, ensures cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
