from urllib.parse import quote_plus

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Placeholder/example secrets that must never be used to sign tokens in production.
_WEAK_SECRET_KEYS = {
    "",
    "your-secret-key-here",
    "yoursecretkeyhere",
    "changeme",
    "change-me",
    "secret",
}


class Settings(BaseSettings):
    PROJECT_NAME: str = "Amenly"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False
    # Expose Swagger /docs, /redoc and the OpenAPI schema without enabling full DEBUG.
    # Keep this False in real production; enable for local/demo environments.
    ENABLE_DOCS: bool = False
    SECRET_KEY: str = "your-secret-key-here"  # Change in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 100  # 100 minutes
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 7 days

    # Rate limiting (brute-force protection on auth endpoints). Disabled in tests.
    RATE_LIMIT_ENABLED: bool = True

    # CORS
    BACKEND_CORS_ORIGINS: list[str] | str = []

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug_flag(cls, value) -> bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on", "debug", "development", "dev"}:
                return True
            if normalized in {"0", "false", "no", "off", "release", "production", "prod"}:
                return False
        return bool(value)

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            if not v:
                return []
            # Handle comma-separated string
            if "," in v:
                return [i.strip() for i in v.split(",")]
            # Handle single URL
            return [v.strip()]
        elif isinstance(v, list):
            return v
        return []

    # Postgres
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "amenly"
    DATABASE_URL: str | None = None

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str | None, info) -> str:
        if isinstance(v, str) and v.strip():
            if "pgbouncer=true" in v:
                return v.replace("?pgbouncer=true", "")
            return v

        user = info.data.get("POSTGRES_USER")
        password = quote_plus(str(info.data.get("POSTGRES_PASSWORD", "")))
        server = info.data.get("POSTGRES_SERVER")
        db = info.data.get("POSTGRES_DB")

        port = 5432
        if "pooler.supabase.com" in server:
            port = 6543

        # Use psycopg instead of asyncpg for better pgbouncer compatibility
        return f"postgresql+psycopg://{user}:{password}@{server}:{port}/{db}"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Qdrant
    QDRANT_URL: str = "http://localhost:6333"

    # Ollama
    OLLAMA_URL: str = "http://localhost:11434"

    # AI Models
    AI_MODEL: str = "gpt-oss:120b-cloud"
    OLLAMA_MODEL: str = "gpt-oss:120b-cloud"  # LLM model for Ollama generation (compliance RAG)
    OLLAMA_EMBEDDING_MODEL: str = "nomic-embed-text"
    EMBEDDING_MODEL: str = "nomic-embed-text"

    @model_validator(mode="after")
    def _enforce_strong_secret_key(self) -> "Settings":
        # In production (DEBUG disabled) the JWT signing key must be a strong,
        # non-default value. A known placeholder lets anyone forge valid tokens.
        if not self.DEBUG:
            if (
                self.SECRET_KEY.strip().lower() in _WEAK_SECRET_KEYS
                or len(self.SECRET_KEY) < 32
            ):
                raise ValueError(
                    "SECRET_KEY must be set to a strong, non-default value "
                    "(at least 32 characters) when DEBUG is disabled."
                )
        return self

    model_config = SettingsConfigDict(
        env_file=".env", case_sensitive=True, extra="ignore"
    )


settings = Settings()
