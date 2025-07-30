import pytest
from decimal import Decimal
from datetime import datetime
from app.core.entities.portfolio import Portfolio, Holding
from app.use_cases.create_portfolio import CreatePortfolio

class TestPortfolioEntity:
    def test_create_valid_portfolio(self):
        portfolio = Portfolio(
            user_id="user123",
            cash_balance=Decimal("10000.00"),
            holdings={},
            created_at=datetime.now()
        )
        assert portfolio.user_id == "user123"
        assert portfolio.cash_balance == Decimal("10000.00")
        assert len(portfolio.holdings) == 0

    def test_negative_cash_raises_error(self):
        with pytest.raises(ValueError, match="Cash balance cannot be negative"):
            Portfolio(
                user_id="user123",
                cash_balance=Decimal("-100.00"),
                holdings={},
                created_at=datetime.now()
            )

    def test_empty_user_id_raises_error(self):
        with pytest.raises(ValueError, match="User ID cannot be empty"):
            Portfolio(
                user_id="",
                cash_balance=Decimal("10000.00"),
                holdings={},
                created_at=datetime.now()
            )

class TestCreatePortfolioUseCase:
    def test_create_portfolio_success(self):
        use_case = CreatePortfolio()
        portfolio = use_case.execute("user123")
        
        assert portfolio.user_id == "user123"
        assert portfolio.cash_balance == Decimal("10000.00")
        assert len(portfolio.holdings) == 0
        assert isinstance(portfolio.created_at, datetime)

    def test_create_portfolio_empty_user_id_fails(self):
        use_case = CreatePortfolio()
        with pytest.raises(ValueError, match="User ID is required"):
            use_case.execute("")