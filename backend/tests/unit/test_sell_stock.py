"""
📁 FILE: tests/unit/test_sell_stock.py

Fixed version - replace entire file content
"""
import unittest
from unittest.mock import Mock, AsyncMock
from decimal import Decimal
from datetime import datetime
import asyncio

from app.core.entities.portfolio import Portfolio, Holding
from app.core.entities.stock import Stock
from app.use_cases.sell_stock import SellStock
from app.use_cases.get_stock_data import GetStockDataUseCase
from app.core.interfaces.portfolio_repository import PortfolioRepository


class TestSellStockUseCase(unittest.IsolatedAsyncioTestCase):
    
    def setUp(self):
        """Set up test fixtures with Clean Architecture dependencies"""
        # Mock stock data provider
        self.mock_get_stock_data = Mock(spec=GetStockDataUseCase)
        
        # Mock portfolio repository with async methods
        self.mock_portfolio_repository = AsyncMock(spec=PortfolioRepository)
        
        # Mock notification service (optional)
        self.mock_notification_service = None

    async def test_sell_partial_shares_success(self):
        """Test selling partial shares successfully with Clean Architecture"""
        # Mock stock data
        self.mock_get_stock_data.execute.return_value = Stock(
            symbol="AAPL",
            current_price=Decimal("160.00"),
            name="Apple Inc.",
            sector="Technology",
            market_cap=2500000000000,
            pe_ratio=Decimal("25.5")
        )
        
        # Create use case with repository
        sell_stock_use_case = SellStock(
            self.mock_get_stock_data,
            self.mock_portfolio_repository,
            self.mock_notification_service
        )
        
        # Portfolio with AAPL holding
        holding = Holding(
            symbol="AAPL",
            shares=10,
            average_price=Decimal("150.00")
        )
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("5000.00"),
            holdings={"AAPL": holding},
            created_at=datetime.now()
        )
        
        # Sell 5 shares at $160 with await
        result = await sell_stock_use_case.execute(portfolio, "AAPL", 5)
        
        # Assertions
        self.assertEqual(result.user_id, "user123")
        self.assertEqual(result.cash_balance, Decimal("5800.00"))  # 5000 + (160 * 5)
        self.assertIn("AAPL", result.holdings)
        self.assertEqual(result.holdings["AAPL"].shares, 5)  # 10 - 5
        self.assertEqual(result.holdings["AAPL"].average_price, Decimal("150.00"))  # Unchanged

    async def test_sell_all_shares_removes_holding(self):
        """Test selling all shares removes the holding"""
        # Mock stock data
        self.mock_get_stock_data.execute.return_value = Stock(
            symbol="AAPL",
            current_price=Decimal("160.00"),
            name="Apple Inc.",
            sector="Technology",
            market_cap=2500000000000,
            pe_ratio=Decimal("25.5")
        )
        
        # Create use case with repository
        sell_stock_use_case = SellStock(
            self.mock_get_stock_data,
            self.mock_portfolio_repository,
            self.mock_notification_service
        )
        
        # Portfolio with AAPL holding
        holding = Holding(
            symbol="AAPL",
            shares=10,
            average_price=Decimal("150.00")
        )
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("5000.00"),
            holdings={"AAPL": holding},
            created_at=datetime.now()
        )
        
        # Sell all 10 shares with await
        result = await sell_stock_use_case.execute(portfolio, "AAPL", 10)
        
        # Assertions
        self.assertEqual(result.cash_balance, Decimal("6600.00"))  # 5000 + (160 * 10)
        self.assertNotIn("AAPL", result.holdings)  # Holding should be removed

    async def test_sell_insufficient_shares_fails(self):
        """Test selling more shares than owned should fail"""
        # Mock stock data
        self.mock_get_stock_data.execute.return_value = Stock(
            symbol="AAPL",
            current_price=Decimal("160.00"),
            name="Apple Inc.",
            sector="Technology",
            market_cap=2500000000000,
            pe_ratio=Decimal("25.5")
        )
        
        # Create use case with repository
        sell_stock_use_case = SellStock(
            self.mock_get_stock_data,
            self.mock_portfolio_repository,
            self.mock_notification_service
        )
        
        # Portfolio with only 5 AAPL shares
        holding = Holding(
            symbol="AAPL",
            shares=5,
            average_price=Decimal("150.00")
        )
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("5000.00"),
            holdings={"AAPL": holding},
            created_at=datetime.now()
        )
        
        # Try to sell 10 shares (more than owned) with await
        with self.assertRaises(ValueError) as context:
            await sell_stock_use_case.execute(portfolio, "AAPL", 10)
        
        self.assertIn("Insufficient shares", str(context.exception))

    async def test_sell_nonexistent_holding_fails(self):
        """Test selling shares of non-existent holding should fail"""
        # Create use case with repository
        sell_stock_use_case = SellStock(
            self.mock_get_stock_data,
            self.mock_portfolio_repository,
            self.mock_notification_service
        )
        
        # Portfolio without AAPL holding
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("5000.00"),
            holdings={},
            created_at=datetime.now()
        )
        
        # Try to sell AAPL shares with await
        with self.assertRaises(ValueError) as context:
            await sell_stock_use_case.execute(portfolio, "AAPL", 5)
        
        self.assertIn("No holdings found", str(context.exception))

    async def test_sell_negative_shares_fails(self):
        """Test selling negative shares should fail"""
        # Create use case with repository
        sell_stock_use_case = SellStock(
            self.mock_get_stock_data,
            self.mock_portfolio_repository,
            self.mock_notification_service
        )
        
        # Portfolio with AAPL holding
        holding = Holding(
            symbol="AAPL",
            shares=10,
            average_price=Decimal("150.00")
        )
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("5000.00"),
            holdings={"AAPL": holding},
            created_at=datetime.now()
        )
        
        # Try to sell negative shares with await
        with self.assertRaises(ValueError) as context:
            await sell_stock_use_case.execute(portfolio, "AAPL", -5)
        
        self.assertIn("Shares must be positive", str(context.exception))

    async def test_sell_with_price_fetch_error(self):
        """Test selling when stock price fetch fails"""
        # Mock stock data to raise exception
        self.mock_get_stock_data.execute.side_effect = Exception("API Error")
        
        # Create use case with repository
        sell_stock_use_case = SellStock(
            self.mock_get_stock_data,
            self.mock_portfolio_repository,
            self.mock_notification_service
        )
        
        # Portfolio with AAPL holding
        holding = Holding(
            symbol="AAPL",
            shares=10,
            average_price=Decimal("150.00")
        )
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("5000.00"),
            holdings={"AAPL": holding},
            created_at=datetime.now()
        )
        
        # Should raise ValueError when price fetch fails with await
        with self.assertRaises(ValueError) as context:
            await sell_stock_use_case.execute(portfolio, "AAPL", 5)
        
        self.assertIn("Could not get current price", str(context.exception))


if __name__ == '__main__':
    unittest.main()