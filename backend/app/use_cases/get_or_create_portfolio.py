"""
Get or Create Portfolio Use Case

@description Centralized logic for getting existing portfolio or creating new one
@layer Use Cases
@pattern Use Case
@dependencies PortfolioRepository, CreatePortfolio

Following SOLID principles:
- Single Responsibility: Only handles get-or-create logic
- Dependency Inversion: Depends on repository abstraction
- Open/Closed: Extensible without modification

@author Capital Craft Team
@created 2025-01-15
"""
from app.core.entities.portfolio import Portfolio
from app.core.interfaces.portfolio_repository import PortfolioRepository
from app.use_cases.create_portfolio import CreatePortfolio


class GetOrCreatePortfolioUseCase:
    """
    Use case to get existing portfolio or create new one.
    
    This centralizes the repeated get-or-create logic found in multiple endpoints,
    following DRY principle and Single Responsibility.
    """
    
    def __init__(self, portfolio_repository: PortfolioRepository):
        self._portfolio_repository = portfolio_repository
        self._create_portfolio_use_case = CreatePortfolio()
    
    async def execute(self, user_id: str) -> Portfolio:
        """
        Get existing portfolio or create new one if doesn't exist.
        
        Args:
            user_id: User identifier
            
        Returns:
            Portfolio (existing or newly created)
        """
        # Try to get existing portfolio
        portfolio = await self._portfolio_repository.get_portfolio(user_id)
        
        # Create new one if doesn't exist
        if portfolio is None:
            portfolio = self._create_portfolio_use_case.execute(user_id)
            await self._portfolio_repository.save_portfolio(portfolio)
        
        return portfolio
    
    def execute_sync(self, user_id: str) -> Portfolio:
        """
        Synchronous version for backward compatibility.
        
        Args:
            user_id: User identifier
            
        Returns:
            Portfolio (existing or newly created)
        """
        # Try to get existing portfolio (using sync version)
        if hasattr(self._portfolio_repository, 'get_portfolio_sync'):
            portfolio = self._portfolio_repository.get_portfolio_sync(user_id)
        else:
            # Fallback for repositories that don't have sync version
            import asyncio
            portfolio = asyncio.run(self._portfolio_repository.get_portfolio(user_id))
        
        # Create new one if doesn't exist
        if portfolio is None:
            portfolio = self._create_portfolio_use_case.execute(user_id)
            
            if hasattr(self._portfolio_repository, 'save_portfolio_sync'):
                self._portfolio_repository.save_portfolio_sync(portfolio)
            else:
                # Fallback for repositories that don't have sync version
                import asyncio
                asyncio.run(self._portfolio_repository.save_portfolio(portfolio))
        
        return portfolio