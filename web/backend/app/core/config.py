from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pathlib import Path


_WEB_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    # Resolve the shared web/.env from this module location. A relative `.env`
    # silently failed when uvicorn was launched from web/backend rather than web/.
    model_config = SettingsConfigDict(env_file=_WEB_ROOT / ".env", extra="ignore")

    # App
    APP_NAME: str = "FitGenius API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql://fitgenius:fitgenius@localhost:5432/fitgenius"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth / JWT
    SECRET_KEY: str = "change-me-in-production-use-long-random-string-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Groq / LangChain — server-side ONLY, never expose to frontend
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # OpenAI fallback — server-side ONLY, never expose to frontend
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Rate limiting
    RATE_LIMIT_REGISTER: str = "5/minute"
    RATE_LIMIT_LOGIN: str = "10/minute"

    # ML model path
    ML_MODEL_PATH: str = "models/recommendation_model.pkl"

    @property
    def allowed_origins_list(self) -> list[str]:
        if self.ENVIRONMENT == "production":
            return [self.FRONTEND_URL]
        return self.ALLOWED_ORIGINS


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
