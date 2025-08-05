"""
📁 FILE: tests/unit/test_sell_stock.py

Fixed version - replace entire file content
"""
import pytest
from decimal import Decimal
from datetime import datetime
from unittest.mock import Mock
from app.core.entities.portfolio import Portfolio, Holding
from app.core.entities.stock import Stock
from app.use_cases.sell_stock import SellStock

class TestSellStockUseCase:
    def test_sell_partial_shares_success(self):
        """Test selling part of a holding"""
        mock_get_stock_data = Mock()
        mock_get_stock_data.execute.return_value = Stock(
            symbol="AAPL",
            current_price=Decimal("200.00"),  # Selling at $200
            name="Apple Inc.",
            sector="Technology",
            market_cap=2500000000000,
            pe_ratio=Decimal("25.5")
        )
        
        sell_stock_use_case = SellStock(mock_get_stock_data)
        
        # Portfolio with 10 AAPL shares bought at $150
        existing_holding = Holding(
            symbol="AAPL",
            shares=10,
            average_price=Decimal("150.00")
        )
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("8500.00"),
            holdings={"AAPL": existing_holding},
            created_at=datetime.now()
        )
        
        # Sell 5 shares at $200
        # ✅ FIX: Use execute_sync instead of execute
        updated_portfolio = sell_stock_use_case.execute_sync(portfolio, "AAPL", 5)
        
        # Assertions
        assert updated_portfolio.cash_balance == Decimal("9500.00")  # 8500 + (200 * 5)
        assert "AAPL" in updated_portfolio.holdings
        assert updated_portfolio.holdings["AAPL"].shares == 5  # 10 - 5
        assert updated_portfolio.holdings["AAPL"].average_price == Decimal("150.00")  # Same avg price

    def test_sell_all_shares_removes_holding(self):
        """Test selling all shares removes the holding completely"""
        mock_get_stock_data = Mock()
        mock_get_stock_data.execute.return_value = Stock(
            symbol="AAPL",
            current_price=Decimal("200.00"),
            name="Apple Inc.",
            sector="Technology",
            market_cap=2500000000000,
            pe_ratio=Decimal("25.5")
        )
        
        sell_stock_use_case = SellStock(mock_get_stock_data)
        
        existing_holding = Holding(
            symbol="AAPL",
            shares=10,
            average_price=Decimal("150.00")
        )
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("8500.00"),
            holdings={"AAPL": existing_holding},
            created_at=datetime.now()
        )
        
        # Sell all 10 shares
        # ✅ FIX: Use execute_sync instead of execute
        updated_portfolio = sell_stock_use_case.execute_sync(portfolio, "AAPL", 10)
        
        # Assertions
        assert updated_portfolio.cash_balance == Decimal("10500.00")  # 8500 + (200 * 10)
        assert "AAPL" not in updated_portfolio.holdings  # Holding removed
        assert len(updated_portfolio.holdings) == 0

    def test_sell_insufficient_shares_fails(self):
        """Test selling more shares than owned"""
        mock_get_stock_data = Mock()
        sell_stock_use_case = SellStock(mock_get_stock_data)
        
        existing_holding = Holding(
            symbol="AAPL",
            shares=5,  # Only 5 shares
            average_price=Decimal("150.00")
        )
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("9250.00"),
            holdings={"AAPL": existing_holding},
            created_at=datetime.now()
        )
        
        with pytest.raises(ValueError, match="Insufficient shares"):
            # ✅ FIX: Use execute_sync instead of execute
            sell_stock_use_case.execute_sync(portfolio, "AAPL", 10)  # Try to sell 10

    def test_sell_nonexistent_holding_fails(self):
        """Test selling stock not in portfolio"""
        mock_get_stock_data = Mock()
        sell_stock_use_case = SellStock(mock_get_stock_data)
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("10000.00"),
            holdings={},  # No holdings
            created_at=datetime.now()
        )
        
        with pytest.raises(ValueError, match="No holdings found for AAPL"):
            # ✅ FIX: Use execute_sync instead of execute
            sell_stock_use_case.execute_sync(portfolio, "AAPL", 5)

    def test_sell_negative_shares_fails(self):
        """Test selling negative shares"""
        mock_get_stock_data = Mock()
        sell_stock_use_case = SellStock(mock_get_stock_data)
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("10000.00"),
            holdings={},
            created_at=datetime.now()
        )
        
        with pytest.raises(ValueError, match="Shares must be positive"):
            # ✅ FIX: Use execute_sync instead of execute
            sell_stock_use_case.execute_sync(portfolio, "AAPL", -5)

    def test_sell_with_price_fetch_error(self):
        """Test selling when can't get current price"""
        mock_get_stock_data = Mock()
        mock_get_stock_data.execute.side_effect = Exception("API Error")
        
        sell_stock_use_case = SellStock(mock_get_stock_data)
        
        existing_holding = Holding(
            symbol="UNKNOWN",
            shares=10,
            average_price=Decimal("100.00")
        )
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("9000.00"),
            holdings={"UNKNOWN": existing_holding},
            created_at=datetime.now()
        )
        
        with pytest.raises(ValueError, match="Could not get current price"):
            # ✅ FIX: Use execute_sync instead of execute
            sell_stock_use_case.execute_sync(portfolio, "UNKNOWN", 5)