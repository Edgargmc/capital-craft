"""
Portfolio Repository Interface
Following Clean Architecture and SOLID principles
"""
from abc import ABC, abstractmethod
from typing import Optional
from app.core.entities.portfolio import Portfolio


class PortfolioRepository(ABC):
    """
    Abstract repository for portfolio persistence operations.
    
    Following SOLID principles:
    - Single Responsibility: Only handles portfolio persistence
    - Dependency Inversion: Use cases depend on this abstraction
    - Interface Segregation: Specific to portfolio operations
    """
    
    @abstractmethod
    async def get_portfolio(self, user_id: str) -> Optional[Portfolio]:
        """
        Retrieve portfolio for a user.
        
        Args:
            user_id: User identifier
            
        Returns:
            Portfolio if exists, None otherwise
        """
        pass
    
    @abstractmethod
    async def save_portfolio(self, portfolio: Portfolio) -> Portfolio:
        """
        Save or update a portfolio.
        
        Args:
            portfolio: Portfolio entity to save
            
        Returns:
            Saved portfolio (may include updated timestamps, etc.)
        """
        pass
    
    @abstractmethod
    async def portfolio_exists(self, user_id: str) -> bool:
        """
        Check if portfolio exists for user.
        
        Args:
            user_id: User identifier
            
        Returns:
            True if portfolio exists, False otherwise
        """
        pass