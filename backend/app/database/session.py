from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool

from app.core.config import settings

# Use NullPool for Supabase pgbouncer compatibility
engine = create_async_engine(
    settings.DATABASE_URL,
    poolclass=NullPool,  # Disable connection pooling for pgbouncer
    future=True,
    echo=False,
    # Supabase's transaction pooler (port 6543) does not support server-side
    # prepared statements; psycopg auto-prepares repeated queries, which fails with
    # "prepared statement already exists". Disabling prepares keeps the pooler happy.
    connect_args={"prepare_threshold": None},
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
