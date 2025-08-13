"""
📁 FILE: tests/unit/test_buy_stock.py

Updated version - Clean Architecture dependencies
"""
import unittest
from unittest.mock import Mock, AsyncMock
from decimal import Decimal
from datetime import datetime
import asyncio

from app.core.entities.portfolio import Portfolio, Holding
from app.core.entities.stock import Stock
from app.use_cases.buy_stock import BuyStock
from app.use_cases.get_stock_data import GetStockDataUseCase
from app.core.interfaces.portfolio_repository import PortfolioRepository


class TestBuyStockUseCase(unittest.IsolatedAsyncioTestCase):
    
    def setUp(self):
        """Set up test fixtures with Clean Architecture dependencies"""
        # Mock stock data provider
        self.mock_get_stock_data = Mock(spec=GetStockDataUseCase)
        
        # Mock portfolio repository with async methods
        self.mock_portfolio_repository = AsyncMock(spec=PortfolioRepository)
        
        # Mock notification service (optional)
        self.mock_notification_service = None

    async def test_buy_stock_success(self):
        """Test successful stock purchase with Clean Architecture"""
        # Mock stock data
        self.mock_get_stock_data.execute.return_value = Stock(
            symbol="AAPL",
            current_price=Decimal("150.00"),
            name="Apple Inc.",
            sector="Technology",
            market_cap=2500000000000,
            pe_ratio=Decimal("25.5")
        )
        
        # Create use case with repository
        buy_stock_use_case = BuyStock(
            self.mock_get_stock_data, 
            self.mock_portfolio_repository,
            self.mock_notification_service
        )
        
        # Initial portfolio
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("10000.00"),
            created_at=datetime.now()
        )
        
        # Execute with await
        result = await buy_stock_use_case.execute(portfolio, "AAPL", 10)
        
        # Assertions
        self.assertEqual(result.user_id, "user123")
        self.assertEqual(result.cash_balance, Decimal("8500.00"))  # 10000 - (150 * 10)
        
        # Check holdings using new API (but this will fail due to portfolio.holdings bug)
        holdings = result.get_holdings()
        self.assertEqual(len(holdings), 1)
        aapl_holding = holdings[0]
        self.assertEqual(aapl_holding.symbol, "AAPL")
        self.assertEqual(aapl_holding.shares, 10)
        self.assertEqual(aapl_holding.average_price, Decimal("150.00"))

    async def test_buy_stock_insufficient_funds(self):
        """Test buying stock with insufficient funds"""
        # Mock stock data
        self.mock_get_stock_data.execute.return_value = Stock(
            symbol="AAPL",
            current_price=Decimal("150.00"),
            name="Apple Inc.",
            sector="Technology",
            market_cap=2500000000000,
            pe_ratio=Decimal("25.5")
        )
        
        # Create use case with repository
        buy_stock_use_case = BuyStock(
            self.mock_get_stock_data,
            self.mock_portfolio_repository,
            self.mock_notification_service
        )
        
        # Portfolio with insufficient funds
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("100.00"),  # Not enough for 10 shares at $150
            created_at=datetime.now()
        )
        
        # Should raise ValueError with await
        with self.assertRaises(ValueError) as context:
            await buy_stock_use_case.execute(portfolio, "AAPL", 10)
        
        self.assertIn("Insufficient funds", str(context.exception))

    async def test_buy_stock_negative_shares(self):
        """Test buying negative shares should fail"""
        # Create use case with repository
        buy_stock_use_case = BuyStock(
            self.mock_get_stock_data,
            self.mock_portfolio_repository,
            self.mock_notification_service
        )
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("10000.00"),
            created_at=datetime.now()
        )
        
        # Should raise ValueError for negative shares with await
        with self.assertRaises(ValueError) as context:
            await buy_stock_use_case.execute(portfolio, "AAPL", -5)
        
        self.assertIn("Shares must be positive", str(context.exception))

    async def test_buy_existing_holding_averages_price(self):
        """Test buying more shares of existing holding averages the price"""
        # Mock stock data
        self.mock_get_stock_data.execute.return_value = Stock(
            symbol="AAPL",
            current_price=Decimal("160.00"),  # Different price
            name="Apple Inc.",
            sector="Technology",
            market_cap=2500000000000,
            pe_ratio=Decimal("25.5")
        )
        
        # Create use case with repository
        buy_stock_use_case = BuyStock(
            self.mock_get_stock_data,
            self.mock_portfolio_repository,
            self.mock_notification_service
        )
        
        # Portfolio with existing AAPL holding
        existing_holding = Holding(
            symbol="AAPL",
            shares=5,
            average_price=Decimal("150.00")
        )
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("10000.00"),
            created_at=datetime.now()
        )
        portfolio.set_holdings([existing_holding])
        
        # Buy 5 more shares at $160 with await
        result = await buy_stock_use_case.execute(portfolio, "AAPL", 5)
        
        # Should average: (5 * 150 + 5 * 160) / 10 = 155
        expected_avg_price = Decimal("155.00")
        
        # Check with new API (will fail due to portfolio.holdings bug in use case)
        holdings = result.get_holdings()
        aapl_holding = next((h for h in holdings if h.symbol == "AAPL"), None)
        self.assertIsNotNone(aapl_holding)
        self.assertEqual(aapl_holding.shares, 10)
        self.assertEqual(aapl_holding.average_price, expected_avg_price)
        self.assertEqual(result.cash_balance, Decimal("9200.00"))  # 10000 - (160 * 5)


if __name__ == '__main__':
    unittest.main()