"""
In-Memory Portfolio Repository Implementation
Replicates current portfolios_db behavior exactly
"""
from typing import Optional, Dict
from app.core.interfaces.portfolio_repository import PortfolioRepository
from app.core.entities.portfolio import Portfolio


class InMemoryPortfolioRepository(PortfolioRepository):
    """
    In-memory implementation of portfolio repository.
    
    This replicates the exact behavior of the current portfolios_db dict
    to ensure zero functional changes during migration.
    
    Note: Data is lost on server restart (same as current behavior)
    """
    
    def __init__(self):
        self._portfolios: Dict[str, Portfolio] = {}
    
    async def get_portfolio(self, user_id: str) -> Optional[Portfolio]:
        """Get portfolio for user, return None if doesn't exist."""
        return self._portfolios.get(user_id)
    
    async def save_portfolio(self, portfolio: Portfolio) -> Portfolio:
        """Save portfolio to in-memory storage."""
        self._portfolios[portfolio.user_id] = portfolio
        return portfolio
    
    async def portfolio_exists(self, user_id: str) -> bool:
        """Check if portfolio exists for user."""
        return user_id in self._portfolios
    
    # Synchronous versions for backward compatibility
    def get_portfolio_sync(self, user_id: str) -> Optional[Portfolio]:
        """Sync version of get_portfolio."""
        return self._portfolios.get(user_id)
    
    def save_portfolio_sync(self, portfolio: Portfolio) -> Portfolio:
        """Sync version of save_portfolio."""
        self._portfolios[portfolio.user_id] = portfolio
        return portfolio
    
    def portfolio_exists_sync(self, user_id: str) -> bool:
        """Sync version of portfolio_exists."""
        return user_id in self._portfolios