"""
Simple test script for JSON portfolio repository
"""
import asyncio
import sys
from pathlib import Path
from decimal import Decimal
from datetime import datetime

# Add app to path
sys.path.append(str(Path(__file__).parent))

from app.core.entities.portfolio import Portfolio, Holding
from app.infrastructure.providers.json_portfolio_repository import JsonPortfolioRepository


async def test_json_portfolio_repository():
    """Test JSON portfolio repository functionality"""
    print("🔧 Testing JSON Portfolio Repository...")
    
    # Initialize repository
    json_repo = JsonPortfolioRepository("data")
    
    # Create sample portfolio
    portfolio = Portfolio(
        user_id="json_test_user",
        cash_balance=Decimal("9500.25"),
        holdings={
            "AAPL": Holding(
                symbol="AAPL",
                shares=15,
                average_price=Decimal("175.80")
            ),
            "GOOGL": Holding(
                symbol="GOOGL",
                shares=3,
                average_price=Decimal("2800.50")
            )
        },
        created_at=datetime.utcnow()
    )
    
    print(f"📝 Original Portfolio:")
    print(f"   User: {portfolio.user_id}")
    print(f"   Cash: ${portfolio.cash_balance}")
    print(f"   Holdings: {len(portfolio.holdings)} stocks")
    
    # Test saving
    print("\n💾 Testing save_portfolio...")
    saved_portfolio = await json_repo.save_portfolio(portfolio)
    print(f"✅ Portfolio saved for user: {saved_portfolio.user_id}")
    
    # Test loading
    print("\n📖 Testing get_portfolio...")
    loaded_portfolio = await json_repo.get_portfolio("json_test_user")
    
    if loaded_portfolio:
        print(f"✅ Portfolio loaded for user: {loaded_portfolio.user_id}")
        print(f"   Cash: ${loaded_portfolio.cash_balance}")
        print(f"   Holdings: {len(loaded_portfolio.holdings)} stocks")
        
        # Validate data integrity
        if loaded_portfolio.cash_balance == portfolio.cash_balance:
            print("✅ Cash balance preserved")
        else:
            print("❌ Cash balance mismatch")
        
        if len(loaded_portfolio.holdings) == len(portfolio.holdings):
            print("✅ Holdings count preserved")
        else:
            print("❌ Holdings count mismatch")
        
        # Check AAPL holding
        if "AAPL" in loaded_portfolio.holdings:
            aapl = loaded_portfolio.holdings["AAPL"]
            if aapl.shares == 15 and aapl.average_price == Decimal("175.80"):
                print("✅ AAPL holding data preserved")
            else:
                print(f"❌ AAPL holding mismatch: {aapl.shares} shares at ${aapl.average_price}")
    
    else:
        print("❌ Portfolio not loaded")
    
    # Test portfolio_exists
    print("\n🔍 Testing portfolio_exists...")
    exists = await json_repo.portfolio_exists("json_test_user")
    if exists:
        print("✅ portfolio_exists returns True")
    else:
        print("❌ portfolio_exists returns False")
    
    # Test non-existent portfolio
    print("\n🔍 Testing non-existent portfolio...")
    non_existent = await json_repo.get_portfolio("non_existent_user")
    if non_existent is None:
        print("✅ Non-existent portfolio returns None")
    else:
        print("❌ Non-existent portfolio should return None")
    
    print("\n✨ JSON Portfolio Repository test completed!")


if __name__ == "__main__":
    asyncio.run(test_json_portfolio_repository())