import pytest
from decimal import Decimal
from datetime import datetime
from unittest.mock import Mock
from app.core.entities.portfolio import Portfolio, Holding
from app.core.entities.stock import Stock
from app.use_cases.buy_stock import BuyStock

class TestBuyStockUseCase:
    def test_buy_stock_success(self):
        # Mock dependencies
        mock_get_stock_data = Mock()
        mock_get_stock_data.execute.return_value = Stock(
            symbol="AAPL",
            current_price=Decimal("150.00"),
            name="Apple Inc.",
            sector="Technology",
            market_cap=2500000000000,
            pe_ratio=Decimal("25.5")
        )
        
        # Create use case
        buy_stock_use_case = BuyStock(mock_get_stock_data)
        
        # Initial portfolio
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("10000.00"),
            holdings={},
            created_at=datetime.now()
        )
        
        # Execute buy
        updated_portfolio = buy_stock_use_case.execute(portfolio, "AAPL", 10)
        
        # Assertions
        assert updated_portfolio.cash_balance == Decimal("8500.00")  # 10000 - (150 * 10)
        assert "AAPL" in updated_portfolio.holdings
        assert updated_portfolio.holdings["AAPL"].shares == 10
        assert updated_portfolio.holdings["AAPL"].average_price == Decimal("150.00")

    def test_buy_stock_insufficient_funds(self):
        mock_get_stock_data = Mock()
        mock_get_stock_data.execute.return_value = Stock(
            symbol="AAPL",
            current_price=Decimal("150.00"),
            name="Apple Inc.",
            sector="Technology",
            market_cap=2500000000000,
            pe_ratio=Decimal("25.5")
        )
        
        buy_stock_use_case = BuyStock(mock_get_stock_data)
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("100.00"),  # Only $100
            holdings={},
            created_at=datetime.now()
        )
        
        with pytest.raises(ValueError, match="Insufficient funds"):
            buy_stock_use_case.execute(portfolio, "AAPL", 10)  # Need $1500

    def test_buy_stock_negative_shares(self):
        mock_get_stock_data = Mock()
        buy_stock_use_case = BuyStock(mock_get_stock_data)
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("10000.00"),
            holdings={},
            created_at=datetime.now()
        )
        
        with pytest.raises(ValueError, match="Shares must be positive"):
            buy_stock_use_case.execute(portfolio, "AAPL", -5)

    def test_buy_existing_holding_averages_price(self):
        mock_get_stock_data = Mock()
        mock_get_stock_data.execute.return_value = Stock(
            symbol="AAPL",
            current_price=Decimal("160.00"),  # Different price
            name="Apple Inc.",
            sector="Technology",
            market_cap=2500000000000,
            pe_ratio=Decimal("25.5")
        )
        
        buy_stock_use_case = BuyStock(mock_get_stock_data)
        
        # Portfolio with existing AAPL holding
        existing_holding = Holding(
            symbol="AAPL",
            shares=5,
            average_price=Decimal("150.00")  # Bought at $150
        )
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("10000.00"),
            holdings={"AAPL": existing_holding},
            created_at=datetime.now()
        )
        
        # Buy 5 more shares at $160
        updated_portfolio = buy_stock_use_case.execute(portfolio, "AAPL", 5)
        
        # Should average: (5*$150 + 5*$160) / 10 = $155
        assert updated_portfolio.holdings["AAPL"].shares == 10
        assert updated_portfolio.holdings["AAPL"].average_price == Decimal("155.00")