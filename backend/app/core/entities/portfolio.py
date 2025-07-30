from dataclasses import dataclass
from decimal import Decimal
from typing import Dict, Optional
from datetime import datetime



@dataclass
class Holding:
    """Represents a stock holding in the portfolio"""
    symbol: str
    shares: int
    average_price: Decimal
    
    def total_value(self, current_price: Decimal) -> Decimal:
        """Calculate total value of this holding at current price"""
        return Decimal(self.shares) * current_price
        
@dataclass 
class Portfolio:
    """Portfolio entity with business rules"""
    user_id: str
    cash_balance: Decimal
    holdings: Dict[str, Holding]
    created_at: datetime
    
    def __post_init__(self):
        """Validate business rules"""
        if self.cash_balance < 0:
            raise ValueError("Cash balance cannot be negative")
        
        if not self.user_id.strip():
            raise ValueError("User ID cannot be empty")
    
    def total_cash(self) -> Decimal:
        """Get available cash"""
        return self.cash_balance
    
    def has_holding(self, symbol: str) -> bool:
        """Check if portfolio has shares of a stock"""
        return symbol.upper() in self.holdings
