import asyncio
import pytest
from typing import AsyncGenerator, Generator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.main import app
from app.database.session import Base, get_db
from app.core.config import settings

# Use a separate schema or database for testing if possible.
# For this setup, we'll use the existing DB but ensure we clean up.
# IMPORTANT: In a real production CI, you'd use a dedicated Test DB.

TEST_DATABASE_URL = settings.DATABASE_URL
if "pooler.supabase.com" in TEST_DATABASE_URL:
    # Switch to direct connection (Session mode) for testing to avoid PgBouncer issues
    TEST_DATABASE_URL = TEST_DATABASE_URL.replace(":6543", ":5432")

engine = create_async_engine(
    TEST_DATABASE_URL, poolclass=NullPool, connect_args={"statement_cache_size": 0}
)
TestingSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
async def db_engine():
    async with engine.begin() as conn:
        # For safety, we could create/drop tables,
        # but since we are using Alembic, we assume tables exist.
        pass
    yield engine
    await engine.dispose()


@pytest.fixture
async def db(db_engine) -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session
        # No rollback here if it causes loop issues,
        # but for safety we'll try to just close it.
        await session.close()


@pytest.fixture
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()
