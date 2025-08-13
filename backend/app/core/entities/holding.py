"""
Holding Entity - Domain Layer
Represents a stock holding within a portfolio
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from dataclasses import dataclass


@dataclass
class Holding:
    """
    Holding Domain Entity
    
    Represents a stock position within a portfolio.
    Extracted from the Portfolio entity to follow Single Responsibility Principle.
    
    Business Rules:
    - Shares must be positive
    - Average price must be positive
    - Symbol must be valid stock symbol (uppercase)
    """
    
    # Identity
    id: Optional[str] = None  # UUID assigned by repository
    portfolio_id: Optional[str] = None  # Reference to portfolio
    
    # Stock Information
    symbol: str = ""
    shares: int = 0
    average_price: Decimal = Decimal('0.00')
    
    # Metadata
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        """Validate holding data after initialization"""
        if not self.symbol:
            raise ValueError("Stock symbol is required")
        
        if self.shares <= 0:
            raise ValueError("Shares must be positive")
        
        if self.average_price <= 0:
            raise ValueError("Average price must be positive")
        
        # Normalize symbol to uppercase
        self.symbol = self.symbol.upper()
    
    def get_total_cost(self) -> Decimal:
        """Calculate total cost basis of this holding"""
        return self.average_price * Decimal(str(self.shares))
    
    def add_shares(self, shares: int, price: Decimal) -> 'Holding':
        """
        Add shares to existing holding (updates average price)
        
        Args:
            shares: Number of shares to add
            price: Price per share for new purchase
            
        Returns:
            Updated holding instance
        """
        if shares <= 0:
            raise ValueError("Shares to add must be positive")
        
        if price <= 0:
            raise ValueError("Price must be positive")
        
        # Calculate new average price
        current_total_cost = self.get_total_cost()
        new_cost = price * Decimal(str(shares))
        total_shares = self.shares + shares
        
        self.average_price = (current_total_cost + new_cost) / Decimal(str(total_shares))
        self.shares = total_shares
        self.updated_at = datetime.utcnow()
        
        return self
    
    def remove_shares(self, shares: int) -> 'Holding':
        """
        Remove shares from holding (average price stays the same)
        
        Args:
            shares: Number of shares to remove
            
        Returns:
            Updated holding instance
        """
        if shares <= 0:
            raise ValueError("Shares to remove must be positive")
        
        if shares > self.shares:
            raise ValueError(f"Cannot remove {shares} shares, only {self.shares} available")
        
        self.shares -= shares
        self.updated_at = datetime.utcnow()
        
        return self
    
    def calculate_current_value(self, current_price: Decimal) -> Decimal:
        """Calculate current market value of holding"""
        return current_price * Decimal(str(self.shares))
    
    def calculate_unrealized_pnl(self, current_price: Decimal) -> Decimal:
        """Calculate unrealized profit/loss"""
        current_value = self.calculate_current_value(current_price)
        cost_basis = self.get_total_cost()
        return current_value - cost_basis
    
    def calculate_unrealized_pnl_percentage(self, current_price: Decimal) -> Decimal:
        """Calculate unrealized profit/loss as percentage"""
        pnl = self.calculate_unrealized_pnl(current_price)
        cost_basis = self.get_total_cost()
        
        if cost_basis == 0:
            return Decimal('0.00')
        
        return (pnl / cost_basis) * Decimal('100')
    
    def is_empty(self) -> bool:
        """Check if holding has no shares"""
        return self.shares == 0


def create_holding(portfolio_id: str, symbol: str, shares: int, price: Decimal) -> Holding:
    """
    Factory function to create a new holding
    
    Args:
        portfolio_id: ID of the portfolio this holding belongs to
        symbol: Stock symbol
        shares: Number of shares
        price: Price per share
        
    Returns:
        New holding instance
    """
    return Holding(
        portfolio_id=portfolio_id,
        symbol=symbol.upper(),
        shares=shares,
        average_price=price,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )