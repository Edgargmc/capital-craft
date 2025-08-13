from datetime import datetime
from decimal import Decimal
from app.core.entities.portfolio import Portfolio

class CreatePortfolio:
    """Use case to create a new portfolio with initial cash"""
    
    INITIAL_CASH = Decimal("10000.00")  # $10,000 starting capital
    
    def execute(self, user_id: str) -> Portfolio:
        """Create new portfolio for user"""
        if not user_id or not user_id.strip():
            raise ValueError("User ID is required")
        
        return Portfolio(
            user_id=user_id.strip(),
            cash_balance=self.INITIAL_CASH,
            created_at=datetime.now()
        )
