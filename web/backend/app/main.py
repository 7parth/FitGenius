from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import time
import logging

from app.core.config import settings
from app.api import (
    auth,
    profile,
    exercises,
    workouts,
    recommendations,
    gamification,
    progress,
    coach,
    pose,
    wearables,
    notifications,
    nutrition,
    admin,
)


logger = logging.getLogger("fitgenius")

# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── App ───────────────────────────────────────────────────────────────────────
from contextlib import asynccontextmanager
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from fastapi import FastAPI as _FastAPI

@asynccontextmanager
async def lifespan(application: "FastAPI"):
    """Startup validation and graceful shutdown."""
    warnings = []
    if settings.SECRET_KEY in (
        "change-me-in-production-use-long-random-string-here",
        "dev-secret-key-change-in-production-use-64-chars",
    ):
        if settings.ENVIRONMENT == "production":
            raise RuntimeError("SECRET_KEY must be changed from default in production!")
        warnings.append("SECRET_KEY is using a default value — change before deploying")
    if not settings.OPENAI_API_KEY and settings.ENVIRONMENT == "production":
        warnings.append("OPENAI_API_KEY not set — AI Coach will use fallback responses")
    for w in warnings:
        logger.warning("⚠️  CONFIG: %s", w)
    logger.info("✅ FitGenius API v%s starting in %s mode", settings.APP_VERSION, settings.ENVIRONMENT)
    yield
    logger.info("FitGenius API shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    openapi_url="/api/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Security headers middleware ───────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response


# ── Request ID + timing middleware ────────────────────────────────────────────
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    import uuid as _uuid
    request_id = request.headers.get("X-Request-ID", str(_uuid.uuid4())[:8])
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = time.perf_counter() - start
    response.headers["X-Process-Time"] = f"{elapsed:.4f}"
    response.headers["X-Request-ID"] = request_id
    return response


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,            prefix="/api/auth",            tags=["Auth"])
app.include_router(profile.router,         prefix="/api/profile",         tags=["Profile"])
app.include_router(exercises.router,       prefix="/api/exercises",       tags=["Exercises"])
app.include_router(workouts.router,        prefix="/api/workouts",        tags=["Workouts"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(gamification.router,    prefix="/api/gamification",    tags=["Gamification"])
app.include_router(progress.router,        prefix="/api/progress",        tags=["Progress"])
app.include_router(coach.router,           prefix="/api/coach",           tags=["Coach"])
app.include_router(pose.router,            prefix="/api/pose",            tags=["Pose"])
app.include_router(wearables.router,       prefix="/api/wearables",       tags=["Wearables"])
app.include_router(notifications.router,   prefix="/api/notifications",   tags=["Notifications"])
app.include_router(nutrition.router,       prefix="/api/nutrition",       tags=["Nutrition"])
app.include_router(admin.router,           prefix="/api/admin",           tags=["Admin"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health_check():
    from app.core.database import engine
    from app.core.redis_client import get_redis
    import sqlalchemy

    status = {"status": "ok", "version": settings.APP_VERSION, "checks": {}}

    # DB check
    try:
        with engine.connect() as conn:
            conn.execute(sqlalchemy.text("SELECT 1"))
        status["checks"]["database"] = "ok"
    except Exception as e:
        status["checks"]["database"] = f"error: {str(e)[:80]}"
        status["status"] = "degraded"

    # Redis check
    try:
        redis = get_redis()
        if redis:
            redis.ping()
            status["checks"]["redis"] = "ok"
        else:
            status["checks"]["redis"] = "not_configured"
    except Exception as e:
        status["checks"]["redis"] = f"error: {str(e)[:80]}"
        # Redis down is non-critical — don't degrade overall status

    return status


# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )

