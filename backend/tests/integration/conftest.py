"""
Shared fixtures for integration tests
Working on fixing tests one by one
"""
import pytest
import asyncio
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import text
from app.infrastructure.database.config import Base
from app.infrastructure.repositories.postgres_user_repository import PostgresUserRepository


@asynccontextmanager
async def create_test_engine():
    """Async context manager for test database engine"""
    test_db_url = "postgresql+asyncpg://capital_craft_user:capital_craft_pass@localhost:5434/capital_craft_test"
    
    engine = create_async_engine(
        test_db_url,
        echo=False,
        pool_size=5,
        max_overflow=0
    )
    
    try:
        # Create test database tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        yield engine
        
    finally:
        # Cleanup
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.drop_all)
        except Exception as e:
            print(f"⚠️ Cleanup error (non-critical): {e}")
        
        await engine.dispose()


@asynccontextmanager
async def create_test_session(engine):
    """Async context manager for test database session"""
    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        try:
            # Clean up any existing test data
            await session.execute(text("DELETE FROM users WHERE email LIKE '%test%'"))
            await session.commit()
            
            yield session
            
        finally:
            # Rollback any changes made during test
            await session.rollback()


class AsyncRepositoryHelper:
    """Helper class to avoid pytest-asyncio async generator issues"""
    
    def __init__(self):
        self._engine_context = None
        self._session_context = None
        self._repository = None
    
    async def __aenter__(self):
        """Async context manager entry"""
        self._engine_context = create_test_engine()
        engine = await self._engine_context.__aenter__()
        
        self._session_context = create_test_session(engine)
        session = await self._session_context.__aenter__()
        
        self._repository = PostgresUserRepository(session)
        return self._repository
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self._session_context:
            await self._session_context.__aexit__(exc_type, exc_val, exc_tb)
        if self._engine_context:
            await self._engine_context.__aexit__(exc_type, exc_val, exc_tb)


@pytest.fixture(scope="function")
def test_user_repository():
    """
    Sync fixture that returns helper for getting repository
    This avoids the pytest-asyncio async generator bug
    """
    return AsyncRepositoryHelper()