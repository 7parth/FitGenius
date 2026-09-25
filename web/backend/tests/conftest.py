"""
Pytest configuration and shared fixtures.

Uses an in-memory SQLite database so tests run without a live Postgres instance.
The `DATABASE_URL` env var is overridden before any app module is imported.
"""
import os

# Override env vars BEFORE any app code is imported
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("RATE_LIMIT_REGISTER", "1000/minute")
os.environ.setdefault("RATE_LIMIT_LOGIN", "1000/minute")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("OPENAI_API_KEY", "")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.dialects.postgresql import JSONB as _JSONB
from sqlalchemy import JSON as _JSON

# Map PostgreSQL JSONB → JSON for SQLite test database
_JSONB.__class_getitem__ = classmethod(lambda cls, item: cls)  # type: ignore
try:
    from sqlalchemy.dialects.sqlite.base import SQLiteTypeCompiler

    def _visit_JSONB(self, type_, **kw):  # noqa: N802
        return self.visit_JSON(type_, **kw)

    SQLiteTypeCompiler.visit_JSONB = _visit_JSONB  # type: ignore[attr-defined]
except Exception:
    pass

from app.models.base import Base
from app.core.database import get_db
from app.main import app

# ── SQLite test engine ────────────────────────────────────────────────────────
# StaticPool keeps the same in-memory DB across connections for the test run.
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Enable FK enforcement in SQLite (off by default)
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function", autouse=True)
def create_tables():
    """Create all tables once for the entire test session."""
    # Import all models to ensure metadata is populated
    import app.models  # noqa: F401
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db():
    """Provide a transactional DB session that rolls back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db):
    """FastAPI test client with the DB dependency overridden."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def registered_user(client):
    """Register a user and return the response JSON. Uses unique email to avoid collisions."""
    import uuid as _uuid
    unique_email = f"test-{_uuid.uuid4().hex[:8]}@fitgenius.com"
    resp = client.post("/api/auth/register", json={
        "email": unique_email,
        "password": "TestPass1",
        "display_name": "Test User",
    })
    assert resp.status_code == 201, resp.text
    data = resp.json()
    data["_email"] = unique_email  # stash for login tests
    return data


@pytest.fixture()
def auth_headers(registered_user):
    """Return Authorization headers for the registered user."""
    return {"Authorization": f"Bearer {registered_user['access_token']}"}
