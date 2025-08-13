#!/usr/bin/env python3
"""
Database Management Script
Convenient commands for database operations

Usage:
    python scripts/db_manager.py [command]
    
Commands:
    init        Initialize database (first time setup)
    reset       Reset database completely 
    seed        Seed with sample data
    fresh       Reset + seed (complete fresh start)
    status      Check database status
    migrate     Run pending migrations
"""
import asyncio
import sys
import argparse
import subprocess
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))


class DatabaseManager:
    """Database management operations"""
    
    def __init__(self):
        self.backend_path = backend_path
    
    async def init_database(self) -> bool:
        """Initialize database for first time use"""
        try:
            print("🚀 Initializing database for first time...")
            
            # Check connection first
            print("1️⃣ Checking database connection...")
            if not await self._check_connection():
                return False
            
            # Create initial migration
            print("2️⃣ Creating initial migration...")
            result = subprocess.run([
                "python3", "-m", "alembic", "revision", "--autogenerate", 
                "-m", "Initial migration"
            ], cwd=self.backend_path, capture_output=True, text=True)
            
            if result.returncode != 0:
                print(f"❌ Migration creation failed: {result.stderr}")
                return False
            
            # Run migrations
            print("3️⃣ Running migrations...")
            if not await self._run_migrations():
                return False
            
            print("✅ Database initialized successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Database initialization failed: {e}")
            return False
    
    async def reset_database(self) -> bool:
        """Reset database completely"""
        print("🔄 Resetting database...")
        
        try:
            from reset_database import DatabaseReset
            reset = DatabaseReset()
            return await reset.reset_database()
        except Exception as e:
            print(f"❌ Reset failed: {e}")
            return False
    
    async def seed_database(self, clear_first: bool = False) -> bool:
        """Seed database with sample data"""
        print("🌱 Seeding database...")
        
        try:
            from seed_database import DatabaseSeeder
            seeder = DatabaseSeeder()
            return await seeder.seed_all(clear_first=clear_first)
        except Exception as e:
            print(f"❌ Seeding failed: {e}")
            return False
    
    async def fresh_database(self) -> bool:
        """Complete fresh start: reset + migrate + seed"""
        print("🆕 Creating fresh database...")
        
        # Reset
        if not await self.reset_database():
            return False
        
        # Run migrations
        if not await self._run_migrations():
            return False
        
        # Seed
        return await self.seed_database()
    
    async def check_status(self) -> bool:
        """Check database status"""
        try:
            print("🔍 Checking database status...")
            
            # Check connection
            if not await self._check_connection():
                return False
            
            # Check tables
            await self._check_tables()
            
            # Check data
            await self._check_sample_data()
            
            return True
            
        except Exception as e:
            print(f"❌ Status check failed: {e}")
            return False
    
    async def _check_connection(self) -> bool:
        """Check database connection"""
        try:
            from reset_database import DatabaseReset
            reset = DatabaseReset()
            connected = await reset.check_database_connection()
            
            if connected:
                print("✅ Database connection: OK")
            else:
                print("❌ Database connection: FAILED")
                print("   Make sure PostgreSQL is running: docker-compose up postgres")
            
            return connected
        except Exception as e:
            print(f"❌ Connection check failed: {e}")
            return False
    
    async def _run_migrations(self) -> bool:
        """Run Alembic migrations"""
        try:
            print("🔄 Running migrations...")
            result = subprocess.run([
                "python3", "-m", "alembic", "upgrade", "head"
            ], cwd=self.backend_path, capture_output=True, text=True)
            
            if result.returncode != 0:
                print(f"❌ Migrations failed: {result.stderr}")
                return False
            
            print("✅ Migrations completed")
            return True
            
        except Exception as e:
            print(f"❌ Migrations failed: {e}")
            return False
    
    async def _check_tables(self):
        """Check if tables exist"""
        try:
            from app.infrastructure.database import db_config
            from sqlalchemy import text
            
            async with db_config.async_session() as session:
                result = await session.execute(text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    ORDER BY table_name;
                """))
                
                tables = [row[0] for row in result.fetchall()]
                
                if tables:
                    print(f"✅ Tables found: {', '.join(tables)}")
                else:
                    print("⚠️  No tables found - run migrations first")
                    
        except Exception as e:
            print(f"❌ Table check failed: {e}")
    
    async def _check_sample_data(self):
        """Check if sample data exists"""
        try:
            from app.infrastructure.database import db_config
            from sqlalchemy import text
            
            async with db_config.async_session() as session:
                # Check users
                result = await session.execute(text("SELECT COUNT(*) FROM users"))
                user_count = result.scalar()
                
                # Check portfolios
                result = await session.execute(text("SELECT COUNT(*) FROM portfolios"))
                portfolio_count = result.scalar()
                
                # Check holdings
                result = await session.execute(text("SELECT COUNT(*) FROM holdings"))
                holding_count = result.scalar()
                
                print(f"📊 Data summary:")
                print(f"   Users: {user_count}")
                print(f"   Portfolios: {portfolio_count}")
                print(f"   Holdings: {holding_count}")
                
        except Exception as e:
            print(f"❌ Data check failed: {e}")


async def main():
    parser = argparse.ArgumentParser(description="Database management commands")
    parser.add_argument('command', choices=[
        'init', 'reset', 'seed', 'fresh', 'status', 'migrate'
    ], help='Command to execute')
    
    args = parser.parse_args()
    
    manager = DatabaseManager()
    
    if args.command == 'init':
        success = await manager.init_database()
    elif args.command == 'reset':
        success = await manager.reset_database()
    elif args.command == 'seed':
        success = await manager.seed_database()
    elif args.command == 'fresh':
        success = await manager.fresh_database()
    elif args.command == 'status':
        success = await manager.check_status()
    elif args.command == 'migrate':
        success = await manager._run_migrations()
    else:
        print(f"Unknown command: {args.command}")
        return 1
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))