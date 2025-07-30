import pytest
from decimal import Decimal
from datetime import datetime
from unittest.mock import Mock
from app.core.entities.portfolio import Portfolio, Holding
from app.core.entities.stock import Stock
from app.use_cases.get_portfolio_summary import GetPortfolioSummary

class TestGetPortfolioSummary:
    def test_empty_portfolio_summary(self):
        """Test summary for portfolio with no holdings"""
        mock_get_stock_data = Mock()
        summary_use_case = GetPortfolioSummary(mock_get_stock_data)
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("10000.00"),
            holdings={},
            created_at=datetime.now()
        )
        
        result = summary_use_case.execute(portfolio)
        
        assert result["cash_balance"] == 10000.0
        assert result["total_invested"] == 0.0
        assert result["total_current_value"] == 0.0
        assert result["total_portfolio_value"] == 10000.0
        assert result["total_unrealized_pnl"] == 0.0
        assert result["holdings_count"] == 0

    def test_portfolio_with_profitable_holding(self):
        """Test summary with a stock that gained value"""
        mock_get_stock_data = Mock()
        mock_get_stock_data.execute.return_value = Stock(
            symbol="AAPL",
            current_price=Decimal("180.00"),  # Current price
            name="Apple Inc.",
            sector="Technology",
            market_cap=2500000000000,
            pe_ratio=Decimal("25.5")
        )
        
        summary_use_case = GetPortfolioSummary(mock_get_stock_data)
        
        # Portfolio with AAPL bought at $150, now worth $180
        holding = Holding(
            symbol="AAPL",
            shares=10,
            average_price=Decimal("150.00")
        )
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("8500.00"),  # 10000 - (150 * 10)
            holdings={"AAPL": holding},
            created_at=datetime.now()
        )
        
        result = summary_use_case.execute(portfolio)
        
        # Assertions
        assert result["cash_balance"] == 8500.0
        assert result["total_invested"] == 1500.0  # 150 * 10
        assert result["total_current_value"] == 1800.0  # 180 * 10
        assert result["total_portfolio_value"] == 10300.0  # 8500 + 1800
        assert result["total_unrealized_pnl"] == 300.0  # 1800 - 1500
        assert result["total_unrealized_pnl_percent"] == 20.0  # 300/1500 * 100
        
        # Check holding details
        aapl_holding = result["holdings"]["AAPL"]
        assert aapl_holding["shares"] == 10
        assert aapl_holding["average_price"] == 150.0
        assert aapl_holding["current_price"] == 180.0
        assert aapl_holding["invested_value"] == 1500.0
        assert aapl_holding["current_value"] == 1800.0
        assert aapl_holding["unrealized_pnl"] == 300.0
        assert aapl_holding["unrealized_pnl_percent"] == 20.0

    def test_portfolio_with_losing_holding(self):
        """Test summary with a stock that lost value"""
        mock_get_stock_data = Mock()
        mock_get_stock_data.execute.return_value = Stock(
            symbol="TSLA",
            current_price=Decimal("120.00"),  # Current price
            name="Tesla Inc.",
            sector="Automotive",
            market_cap=1500000000000,
            pe_ratio=Decimal("15.0")
        )
        
        summary_use_case = GetPortfolioSummary(mock_get_stock_data)
        
        # Portfolio with TSLA bought at $150, now worth $120
        holding = Holding(
            symbol="TSLA",
            shares=5,
            average_price=Decimal("150.00")
        )
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("9250.00"),  # 10000 - (150 * 5)
            holdings={"TSLA": holding},
            created_at=datetime.now()
        )
        
        result = summary_use_case.execute(portfolio)
        
        # Assertions
        assert result["total_invested"] == 750.0  # 150 * 5
        assert result["total_current_value"] == 600.0  # 120 * 5
        assert result["total_portfolio_value"] == 9850.0  # 9250 + 600
        assert result["total_unrealized_pnl"] == -150.0  # 600 - 750
        assert result["total_unrealized_pnl_percent"] == -20.0  # -150/750 * 100

    def test_portfolio_with_stock_data_error(self):
        """Test summary when stock data can't be retrieved"""
        mock_get_stock_data = Mock()
        mock_get_stock_data.execute.side_effect = Exception("API Error")
        
        summary_use_case = GetPortfolioSummary(mock_get_stock_data)
        
        holding = Holding(
            symbol="UNKNOWN",
            shares=10,
            average_price=Decimal("100.00")
        )
        
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("9000.00"),
            holdings={"UNKNOWN": holding},
            created_at=datetime.now()
        )
        
        result = summary_use_case.execute(portfolio)
        
        # Should fallback to average price
        assert result["total_invested"] == 1000.0
        assert result["total_current_value"] == 1000.0  # Fallback to invested
        assert result["total_unrealized_pnl"] == 0.0
        assert "error" in result["holdings"]["UNKNOWN"]