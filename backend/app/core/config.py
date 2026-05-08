import os
from urllib.parse import quote_plus
from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Amenly"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False
    SECRET_KEY: str = "your-secret-key-here"  # Change in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 100  # 100 minutes
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 7 days

    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Postgres
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "amenly"
    DATABASE_URL: Optional[str] = None

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], info) -> str:
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
    AI_MODEL: str = "llama3"
    EMBEDDING_MODEL: str = "nomic-embed-text"

    model_config = SettingsConfigDict(
        env_file=".env", case_sensitive=True, extra="ignore"
    )


settings = Settings()
