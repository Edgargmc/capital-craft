#!/usr/bin/env python3
"""
Database Reset Script
Completely recreates the database with fresh schema and seed data

Usage:
    python scripts/reset_database.py [--with-seed]
    
Options:
    --with-seed    Also populate database with sample data after reset
"""
import asyncio
import sys
import os
import argparse
from pathlib import Path

# Add backend to path so we can import modules
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from sqlalchemy import text
from app.infrastructure.database import db_config, Base
from app.infrastructure.database.config import DatabaseConfig


class DatabaseReset:
    """Handles complete database reset operations"""
    
    def __init__(self):
        self.db_config = DatabaseConfig()
    
    async def reset_database(self) -> bool:
        """
        Completely reset the database
        
        Steps:
        1. Drop all tables (including alembic version)
        2. Recreate schema from SQLAlchemy models
        3. Initialize alembic version table
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            print("🗑️  Dropping all existing tables...")
            await self._drop_all_tables()
            
            print("🏗️  Creating fresh schema...")
            await self._create_tables()
            
            print("✅ Database reset completed successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Database reset failed: {e}")
            return False
        finally:
            await self.db_config.close()
    
    async def _drop_all_tables(self):
        """Drop all tables including alembic version"""
        async with self.db_config.engine.begin() as conn:
            # Execute commands separately to avoid asyncpg multiple command error
            print("🗑️  Dropping public schema...")
            await conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE;"))
            
            print("🏗️  Creating public schema...")
            await conn.execute(text("CREATE SCHEMA public;"))
            
            print("🔐 Setting permissions...")
            await conn.execute(text("GRANT ALL ON SCHEMA public TO capital_craft_user;"))
            await conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
    
    async def _create_tables(self):
        """Create all tables from SQLAlchemy models"""
        async with self.db_config.engine.begin() as conn:
            # Enable UUID extension
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))
            
            # Create all tables from models
            await conn.run_sync(Base.metadata.create_all)
    
    async def check_database_connection(self) -> bool:
        """Test database connection"""
        try:
            async with self.db_config.engine.begin() as conn:
                result = await conn.execute(text("SELECT 1"))
                return result.scalar() == 1
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return False


async def main():
    parser = argparse.ArgumentParser(description="Reset Capital Craft database")
    parser.add_argument(
        "--with-seed", 
        action="store_true", 
        help="Also populate database with sample data"
    )
    parser.add_argument(
        "--check-connection",
        action="store_true",
        help="Only check database connection"
    )
    
    args = parser.parse_args()
    
    reset = DatabaseReset()
    
    # Check connection first
    print("🔍 Checking database connection...")
    if not await reset.check_database_connection():
        print("❌ Cannot connect to database. Make sure PostgreSQL is running:")
        print("   docker-compose up postgres")
        return 1
    
    print("✅ Database connection successful!")
    
    if args.check_connection:
        return 0
    
    # Perform reset
    print("\n🚀 Starting database reset...")
    print("⚠️  This will destroy ALL data in the database!")
    
    if not os.getenv("FORCE_RESET"):
        confirm = input("Are you sure? (y/N): ")
        if confirm.lower() != 'y':
            print("Reset cancelled.")
            return 0
    
    success = await reset.reset_database()
    
    if success and args.with_seed:
        print("\n🌱 Seeding database with sample data...")
        # Import and run seed script
        from seed_database import DatabaseSeeder
        seeder = DatabaseSeeder()
        await seeder.seed_all()
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))