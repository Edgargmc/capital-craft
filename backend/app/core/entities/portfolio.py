"""
Portfolio Entity - Domain Layer
Enhanced for PostgreSQL with User relationship and separated Holdings
"""
from dataclasses import dataclass
from decimal import Decimal
from typing import List, Optional
from datetime import datetime


@dataclass 
class Portfolio:
    """
    Portfolio Domain Entity - Enhanced for PostgreSQL
    
    Represents a user's investment portfolio with cash balance.
    Holdings are now managed as separate entities for better normalization.
    
    Business Rules:
    - Cash balance cannot be negative
    - Must belong to a valid user
    - Each user can have only one portfolio (for now)
    """
    
    # Identity
    id: Optional[str] = None  # UUID assigned by repository
    user_id: str = ""
    
    # Financial Data
    cash_balance: Decimal = Decimal('10000.00')  # Starting amount
    
    # Metadata
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Holdings (loaded separately by repository)
    _holdings: Optional[List['Holding']] = None
    
    def __post_init__(self):
        """Validate business rules"""
        if self.cash_balance < 0:
            raise ValueError("Cash balance cannot be negative")
        
        if not self.user_id or not self.user_id.strip():
            raise ValueError("User ID cannot be empty")
    
    def get_cash_balance(self) -> Decimal:
        """Get available cash"""
        return self.cash_balance
    
    def can_afford(self, amount: Decimal) -> bool:
        """Check if portfolio has enough cash for a purchase"""
        return self.cash_balance >= amount
    
    def add_cash(self, amount: Decimal) -> 'Portfolio':
        """Add cash to portfolio (e.g., from stock sale)"""
        if amount <= 0:
            raise ValueError("Amount to add must be positive")
        
        self.cash_balance += amount
        self.updated_at = datetime.utcnow()
        return self
    
    def subtract_cash(self, amount: Decimal) -> 'Portfolio':
        """Remove cash from portfolio (e.g., for stock purchase)"""
        if amount <= 0:
            raise ValueError("Amount to subtract must be positive")
        
        if not self.can_afford(amount):
            raise ValueError(f"Insufficient funds. Available: {self.cash_balance}, Required: {amount}")
        
        self.cash_balance -= amount
        self.updated_at = datetime.utcnow()
        return self
    
    def set_holdings(self, holdings: List['Holding']) -> 'Portfolio':
        """Set holdings for this portfolio (called by repository)"""
        self._holdings = holdings
        return self
    
    def get_holdings(self) -> List['Holding']:
        """Get holdings for this portfolio"""
        return self._holdings or []
    
    def calculate_total_portfolio_value(self, stock_prices: dict[str, Decimal]) -> Decimal:
        """
        Calculate total portfolio value (cash + holdings)
        
        Args:
            stock_prices: Dict mapping symbol to current price
            
        Returns:
            Total portfolio value
        """
        holdings_value = Decimal('0.00')
        
        for holding in self.get_holdings():
            current_price = stock_prices.get(holding.symbol, Decimal('0.00'))
            holdings_value += holding.calculate_current_value(current_price)
        
        return self.cash_balance + holdings_value
    
    def calculate_total_unrealized_pnl(self, stock_prices: dict[str, Decimal]) -> Decimal:
        """Calculate total unrealized profit/loss across all holdings"""
        total_pnl = Decimal('0.00')
        
        for holding in self.get_holdings():
            current_price = stock_prices.get(holding.symbol, Decimal('0.00'))
            total_pnl += holding.calculate_unrealized_pnl(current_price)
        
        return total_pnl
    
    def get_holding_by_symbol(self, symbol: str) -> Optional['Holding']:
        """Find holding by stock symbol"""
        symbol = symbol.upper()
        for holding in self.get_holdings():
            if holding.symbol == symbol:
                return holding
        return None
    
    def has_holding(self, symbol: str) -> bool:
        """Check if portfolio has shares of a stock"""
        return self.get_holding_by_symbol(symbol) is not None


def create_portfolio(user_id: str, initial_cash: Decimal = Decimal('10000.00')) -> Portfolio:
    """
    Factory function to create a new portfolio
    
    Args:
        user_id: ID of the user who owns this portfolio
        initial_cash: Starting cash amount
        
    Returns:
        New portfolio instance
    """
    return Portfolio(
        user_id=user_id,
        cash_balance=initial_cash,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


# Import Holding here to avoid circular imports
from .holding import Holding
