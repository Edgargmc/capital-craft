"""
Portfolio Migration Script: Memory to JSON

@description Utility script to migrate portfolios from memory to JSON storage
@usage python -m app.scripts.migrate_portfolios_to_json
@layer Infrastructure / Scripts

Since current system uses in-memory storage, this script is primarily for:
1. Testing JSON repository functionality
2. Creating sample data for development
3. Future migration when moving from one storage to another

@author Capital Craft Team
@created 2025-01-15
"""
import asyncio
import os
from pathlib import Path
from decimal import Decimal
from datetime import datetime

# Add backend to path for imports
import sys
backend_path = Path(__file__).parent.parent
sys.path.append(str(backend_path))

from core.entities.portfolio import Portfolio, Holding
from infrastructure.providers.json_portfolio_repository import JsonPortfolioRepository
from infrastructure.providers.in_memory_portfolio_repository import InMemoryPortfolioRepository


class PortfolioMigrationTool:
    """
    Tool for migrating portfolios between different storage implementations
    """
    
    def __init__(self):
        self.json_repo = JsonPortfolioRepository("data")
        self.memory_repo = InMemoryPortfolioRepository()
    
    def create_sample_data(self):
        """Create sample portfolio data for testing"""
        print("🔧 Creating sample portfolio data...")
        
        # Sample portfolio 1
        portfolio1 = Portfolio(
            user_id="demo",
            cash_balance=Decimal("8500.00"),
            created_at=datetime.utcnow()
        )
        
        # Create holdings separately for portfolio1
        holdings1 = [
            Holding(
                portfolio_id=portfolio1.id,
                symbol="AAPL",
                shares=10,
                average_price=Decimal("180.50")
            ),
            Holding(
                portfolio_id=portfolio1.id,
                symbol="TSLA",
                shares=5,
                average_price=Decimal("220.00")
            )
        ]
        portfolio1.set_holdings(holdings1)

        # Sample portfolio 2
        portfolio2 = Portfolio(
            user_id="investor",
            cash_balance=Decimal("15000.00"),
            created_at=datetime.utcnow()
        )
        
        # Create holdings separately for portfolio2
        holdings2 = [
            Holding(
                portfolio_id=portfolio2.id,
                symbol="MSFT",
                shares=15,
                average_price=Decimal("320.00")
            ),
            Holding(
                portfolio_id=portfolio2.id,
                symbol="GOOGL",
                shares=8,
                average_price=Decimal("2650.00")
            )
        ]
        portfolio2.set_holdings(holdings2)

        return [portfolio1, portfolio2]
    
    async def migrate_memory_to_json(self, portfolios_data):
        """
        Migrate portfolios from memory storage to JSON storage
        
        Args:
            portfolios_data: List of Portfolio entities to migrate
        """
        print("🚀 Starting migration from Memory to JSON...")
        
        migrated_count = 0
        failed_count = 0
        
        for portfolio in portfolios_data:
            try:
                # Save to JSON repository
                await self.json_repo.save_portfolio(portfolio)
                print(f"✅ Migrated portfolio for user: {portfolio.user_id}")
                migrated_count += 1
                
            except Exception as e:
                print(f"❌ Failed to migrate portfolio for {portfolio.user_id}: {e}")
                failed_count += 1
        
        print(f"\n📊 Migration Summary:")
        print(f"   ✅ Successfully migrated: {migrated_count}")
        print(f"   ❌ Failed migrations: {failed_count}")
        print(f"   📁 JSON files location: {self.json_repo.data_directory}")
    
    async def validate_migration(self, original_portfolios):
        """
        Validate that migrated data is identical to original
        
        Args:
            original_portfolios: List of original Portfolio entities
        """
        print("\n🔍 Validating migration...")
        
        for original in original_portfolios:
            try:
                # Load from JSON
                loaded = await self.json_repo.get_portfolio(original.user_id)
                
                if loaded is None:
                    print(f"❌ Portfolio not found for {original.user_id}")
                    continue
                
                # Validate core fields
                errors = []
                if loaded.user_id != original.user_id:
                    errors.append(f"user_id mismatch: {loaded.user_id} vs {original.user_id}")
                
                if loaded.cash_balance != original.cash_balance:
                    errors.append(f"cash_balance mismatch: {loaded.cash_balance} vs {original.cash_balance}")
                
                if len(loaded.holdings) != len(original.holdings):
                    errors.append(f"holdings count mismatch: {len(loaded.holdings)} vs {len(original.holdings)}")
                
                # Validate holdings
                for symbol, original_holding in original.holdings.items():
                    if symbol not in loaded.holdings:
                        errors.append(f"Missing holding: {symbol}")
                        continue
                    
                    loaded_holding = loaded.holdings[symbol]
                    if loaded_holding.shares != original_holding.shares:
                        errors.append(f"{symbol} shares mismatch: {loaded_holding.shares} vs {original_holding.shares}")
                    
                    if loaded_holding.average_price != original_holding.average_price:
                        errors.append(f"{symbol} price mismatch: {loaded_holding.average_price} vs {original_holding.average_price}")
                
                if errors:
                    print(f"❌ Validation failed for {original.user_id}:")
                    for error in errors:
                        print(f"   - {error}")
                else:
                    print(f"✅ Validation passed for {original.user_id}")
                    
            except Exception as e:
                print(f"❌ Validation error for {original.user_id}: {e}")
    
    def list_json_files(self):
        """List all JSON portfolio files"""
        print(f"\n📁 JSON Portfolio Files in {self.json_repo.data_directory}:")
        
        json_files = list(self.json_repo.data_directory.glob("portfolios_*.json"))
        
        if not json_files:
            print("   (No JSON portfolio files found)")
            return
        
        for file_path in json_files:
            try:
                file_size = file_path.stat().st_size
                print(f"   📄 {file_path.name} ({file_size} bytes)")
            except Exception as e:
                print(f"   ❌ {file_path.name} (error reading: {e})")


async def main():
    """Main migration function"""
    print("🔄 Portfolio Migration Tool")
    print("=" * 50)
    
    migration_tool = PortfolioMigrationTool()
    
    # Create sample data (since memory storage doesn't persist)
    sample_portfolios = migration_tool.create_sample_data()
    
    # Migrate to JSON
    await migration_tool.migrate_memory_to_json(sample_portfolios)
    
    # Validate migration
    await migration_tool.validate_migration(sample_portfolios)
    
    # List created files
    migration_tool.list_json_files()
    
    print("\n✨ Migration tool completed!")


if __name__ == "__main__":
    asyncio.run(main())