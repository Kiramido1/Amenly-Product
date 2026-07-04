# Test configuration.
#
# IMPORTANT: the committed .env points DATABASE_URL at a live (Supabase) database
# with no test isolation. We override the environment BEFORE importing the app so
# the whole suite runs against a disposable local Postgres, and we bootstrap the
# schema directly from the SQLAlchemy models (the Alembic chain is not reproducible
# from an empty database — an early migration drops a table that does not exist yet).
import os

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://test:test@localhost:5544/amenly_test",
)
# A real SECRET_KEY is required now that startup rejects the placeholder default.
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-only-0123456789abcdef")
os.environ.setdefault("DEBUG", "False")
# Keep docs disabled in tests regardless of .env (the hardening regression test asserts this).
os.environ.setdefault("ENABLE_DOCS", "False")
# Disable brute-force rate limiting in tests (avoids cross-test 429s).
os.environ.setdefault("RATE_LIMIT_ENABLED", "False")

import asyncio
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient

# Importing the app registers every ORM model on Base.metadata.
import app.database.base  # noqa: F401
from app.database.session import AsyncSessionLocal, Base, engine
from app.main import app


def _bootstrap_schema() -> None:
    async def _create() -> None:
        async with engine.begin() as conn:
            # Drop first so the disposable test schema always matches the current
            # models — create_all alone cannot add new columns to pre-existing tables.
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(_create())


# Create the schema once, at collection time, before any test runs.
_bootstrap_schema()


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        yield client


@pytest.fixture
async def db() -> AsyncGenerator:
    async with AsyncSessionLocal() as session:
        yield session
