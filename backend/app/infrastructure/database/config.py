"""
Database Configuration
Following Clean Architecture - Infrastructure Layer
"""
import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models"""
    pass


class DatabaseConfig:
    """
    Database configuration and connection management
    
    Follows SOLID principles:
    - Single Responsibility: Only handles database connection
    - Open/Closed: Extensible for different database types
    - Dependency Inversion: Provides abstractions for use cases
    """
    
    def __init__(self):
        # Detect if we're running tests
        is_testing = os.getenv("TESTING", "false").lower() == "true" or "pytest" in os.getenv("_", "")
        
        if is_testing:
            # Use SQLite in memory for tests
            self.database_url = "sqlite+aiosqlite:///:memory:"
        else:
            # Use PostgreSQL for normal operation
            self.database_url = os.getenv(
                "DATABASE_URL", 
                "postgresql+asyncpg://capital_craft_user:capital_craft_pass@localhost:5434/capital_craft"
            )
        
        # Create async engine with different settings for SQLite vs PostgreSQL
        if is_testing and "sqlite" in self.database_url:
            # SQLite-specific configuration
            self.engine = create_async_engine(
                self.database_url,
                echo=os.getenv("DB_ECHO", "false").lower() == "true",
                # SQLite doesn't need connection pooling
            )
        else:
            # PostgreSQL configuration  
            self.engine = create_async_engine(
                self.database_url,
                echo=os.getenv("DB_ECHO", "false").lower() == "true",  # Log SQL queries in dev
                pool_size=20,
                max_overflow=0,
                pool_pre_ping=True,  # Verify connections before use
            )
        
        # Create session factory
        self.async_session = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
    
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """
        Get database session for dependency injection
        
        Returns:
            AsyncSession: Database session
        """
        async with self.async_session() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    
    async def close(self):
        """Close database connections"""
        await self.engine.dispose()


# Global database configuration instance
db_config = DatabaseConfig()


# FastAPI dependency function
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for database sessions"""
    async for session in db_config.get_session():
        yield session