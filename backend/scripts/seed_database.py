#!/usr/bin/env python3
"""
Database Seed Script
Populates database with sample data for development and testing

Usage:
    python scripts/seed_database.py [--clear-first]
    
Options:
    --clear-first    Clear all existing data before seeding
"""
import asyncio
import sys
import argparse
from decimal import Decimal
from pathlib import Path

# Add backend to path so we can import modules
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from sqlalchemy import delete
from app.infrastructure.database import db_config
from app.infrastructure.database.models import UserModel, PortfolioModel, HoldingModel, NotificationModel
from app.core.entities.user import AuthProvider


class DatabaseSeeder:
    """Handles database seeding operations"""
    
    def __init__(self):
        self.db_config = db_config
    
    async def seed_all(self, clear_first: bool = False) -> bool:
        """
        Seed database with all sample data
        
        Args:
            clear_first: Whether to clear existing data first
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if clear_first:
                print("🗑️  Clearing existing data...")
                await self._clear_all_data()
            
            print("🌱 Seeding users...")
            users = await self._seed_users()
            
            print("💼 Seeding portfolios...")
            portfolios = await self._seed_portfolios(users)
            
            print("📈 Seeding holdings...")
            await self._seed_holdings(portfolios)
            
            print("🔔 Seeding notifications...")
            await self._seed_notifications(users)
            
            print("✅ Database seeding completed successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Database seeding failed: {e}")
            return False
        finally:
            await self.db_config.close()
    
    async def _clear_all_data(self):
        """Clear all data from tables"""
        async with self.db_config.async_session() as session:
            # Clear in order to respect foreign key constraints
            await session.execute(delete(NotificationModel))
            await session.execute(delete(HoldingModel))
            await session.execute(delete(PortfolioModel))
            await session.execute(delete(UserModel))
            await session.commit()
    
    async def _seed_users(self) -> list[UserModel]:
        """Create sample users"""
        async with self.db_config.async_session() as session:
            users = [
                UserModel(
                    email="demo@capitalcraft.com",
                    username="demo_user",
                    provider="local",
                    password_hash="$2b$12$dummy_hash_for_demo_user_only",  # Demo only
                    avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=demo"
                ),
                UserModel(
                    email="investor@gmail.com",
                    username="smart_investor",
                    provider="google",
                    provider_id="google_123456789",
                    avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=investor"
                ),
                UserModel(
                    email="beginner@capitalcraft.com",
                    username="learning_trader",
                    provider="local",
                    password_hash="$2b$12$dummy_hash_for_beginner_only",  # Demo only
                    avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=beginner"
                ),
                UserModel(
                    email="test@example.com",
                    username="test_user",
                    provider="github",
                    provider_id="github_987654321",
                    avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=test"
                )
            ]
            
            session.add_all(users)
            await session.commit()
            
            # Refresh to get IDs
            for user in users:
                await session.refresh(user)
            
            return users
    
    async def _seed_portfolios(self, users: list[UserModel]) -> list[PortfolioModel]:
        """Create sample portfolios"""
        async with self.db_config.async_session() as session:
            portfolios = []
            
            # Create portfolios with different starting balances
            portfolio_configs = [
                (users[0], Decimal('10000.00')),  # Demo user - standard
                (users[1], Decimal('15000.00')),  # Smart investor - more cash
                (users[2], Decimal('5000.00')),   # Beginner - less cash
                (users[3], Decimal('20000.00')),  # Test user - lots of cash
            ]
            
            for user, cash_balance in portfolio_configs:
                portfolio = PortfolioModel(
                    user_id=user.id,
                    cash_balance=cash_balance
                )
                portfolios.append(portfolio)
            
            session.add_all(portfolios)
            await session.commit()
            
            # Refresh to get IDs
            for portfolio in portfolios:
                await session.refresh(portfolio)
            
            return portfolios
    
    async def _seed_holdings(self, portfolios: list[PortfolioModel]):
        """Create sample holdings"""
        async with self.db_config.async_session() as session:
            holdings = []
            
            # Demo user portfolio (balanced)
            demo_holdings = [
                HoldingModel(portfolio_id=portfolios[0].id, symbol="AAPL", shares=10, average_price=Decimal('150.00')),
                HoldingModel(portfolio_id=portfolios[0].id, symbol="MSFT", shares=5, average_price=Decimal('300.00')),
                HoldingModel(portfolio_id=portfolios[0].id, symbol="GOOGL", shares=3, average_price=Decimal('100.00')),
            ]
            
            # Smart investor portfolio (diversified)
            investor_holdings = [
                HoldingModel(portfolio_id=portfolios[1].id, symbol="AAPL", shares=20, average_price=Decimal('145.00')),
                HoldingModel(portfolio_id=portfolios[1].id, symbol="MSFT", shares=15, average_price=Decimal('295.00')),
                HoldingModel(portfolio_id=portfolios[1].id, symbol="TSLA", shares=8, average_price=Decimal('200.00')),
                HoldingModel(portfolio_id=portfolios[1].id, symbol="NVDA", shares=5, average_price=Decimal('400.00')),
                HoldingModel(portfolio_id=portfolios[1].id, symbol="SPY", shares=10, average_price=Decimal('450.00')),
            ]
            
            # Beginner portfolio (simple)
            beginner_holdings = [
                HoldingModel(portfolio_id=portfolios[2].id, symbol="AAPL", shares=5, average_price=Decimal('155.00')),
                HoldingModel(portfolio_id=portfolios[2].id, symbol="SPY", shares=3, average_price=Decimal('460.00')),
            ]
            
            # Test user portfolio (for testing)
            test_holdings = [
                HoldingModel(portfolio_id=portfolios[3].id, symbol="AAPL", shares=50, average_price=Decimal('140.00')),
                HoldingModel(portfolio_id=portfolios[3].id, symbol="MSFT", shares=30, average_price=Decimal('290.00')),
                HoldingModel(portfolio_id=portfolios[3].id, symbol="GOOGL", shares=20, average_price=Decimal('95.00')),
                HoldingModel(portfolio_id=portfolios[3].id, symbol="AMZN", shares=15, average_price=Decimal('120.00')),
                HoldingModel(portfolio_id=portfolios[3].id, symbol="TSLA", shares=25, average_price=Decimal('180.00')),
            ]
            
            all_holdings = demo_holdings + investor_holdings + beginner_holdings + test_holdings
            session.add_all(all_holdings)
            await session.commit()
    
    async def _seed_notifications(self, users: list[UserModel]):
        """Create sample notifications"""
        async with self.db_config.async_session() as session:
            notifications = []
            
            # Demo user notifications
            demo_notifications = [
                NotificationModel(
                    user_id=users[0].id,
                    title="Welcome to Capital Craft!",
                    message="Start your investment journey with our educational platform. You have $10,000 virtual cash to practice with.",
                    trigger_type="welcome",
                    is_read=False
                ),
                NotificationModel(
                    user_id=users[0].id,
                    title="First Stock Purchase",
                    message="Great job on buying your first stock (AAPL)! Learn about company research and diversification in our learning center.",
                    trigger_type="first_purchase",
                    is_read=True
                ),
            ]
            
            # Smart investor notifications
            investor_notifications = [
                NotificationModel(
                    user_id=users[1].id,
                    title="Portfolio Risk Analysis",
                    message="Your portfolio shows good diversification across sectors. Consider reviewing your tech allocation.",
                    trigger_type="risk_analysis",
                    is_read=False
                ),
                NotificationModel(
                    user_id=users[1].id,
                    title="High Volatility Alert",
                    message="TSLA has shown high volatility recently. Learn about volatility and risk management strategies.",
                    trigger_type="high_volatility",
                    is_read=False
                ),
            ]
            
            # Beginner notifications
            beginner_notifications = [
                NotificationModel(
                    user_id=users[2].id,
                    title="Investment Fundamentals",
                    message="Learn the basics of investing, including diversification and long-term strategies.",
                    trigger_type="education",
                    is_read=False
                ),
                NotificationModel(
                    user_id=users[2].id,
                    title="ETF Education",
                    message="You bought SPY, an ETF. Learn about the benefits of ETFs for beginning investors.",
                    trigger_type="etf_education",
                    is_read=False
                ),
            ]
            
            # Test user notifications
            test_notifications = [
                NotificationModel(
                    user_id=users[3].id,
                    title="Test Notification 1",
                    message="This is a test notification for development purposes.",
                    trigger_type="test",
                    is_read=False
                ),
                NotificationModel(
                    user_id=users[3].id,
                    title="Test Notification 2",
                    message="Another test notification that is already read.",
                    trigger_type="test",
                    is_read=True
                ),
            ]
            
            all_notifications = demo_notifications + investor_notifications + beginner_notifications + test_notifications
            session.add_all(all_notifications)
            await session.commit()


async def main():
    parser = argparse.ArgumentParser(description="Seed Capital Craft database with sample data")
    parser.add_argument(
        "--clear-first", 
        action="store_true", 
        help="Clear existing data before seeding"
    )
    
    args = parser.parse_args()
    
    seeder = DatabaseSeeder()
    
    print("🌱 Starting database seeding...")
    if args.clear_first:
        print("⚠️  This will clear ALL existing data!")
    
    success = await seeder.seed_all(clear_first=args.clear_first)
    
    if success:
        print("\n🎉 Sample data created successfully!")
        print("\n📊 Summary:")
        print("  • 4 users (demo, investor, beginner, test)")
        print("  • 4 portfolios with different balances")
        print("  • Multiple stock holdings (AAPL, MSFT, GOOGL, etc.)")
        print("  • Educational notifications")
        print("\n🔑 Login credentials (demo only):")
        print("  • demo@capitalcraft.com")
        print("  • beginner@capitalcraft.com")
        print("  • OAuth users: investor@gmail.com, test@example.com")
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))