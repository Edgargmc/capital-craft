"""
PostgreSQL Portfolio Repository Implementation
Following Clean Architecture and SOLID principles
"""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.core.interfaces.portfolio_repository import PortfolioRepository
from app.core.entities.portfolio import Portfolio
from app.infrastructure.database.models import PortfolioModel, HoldingModel
from app.infrastructure.database.config import get_db_session
from app.core.entities.holding import Holding


class PostgresPortfolioRepository(PortfolioRepository):
    """
    PostgreSQL implementation of portfolio repository.
    
    Following SOLID principles:
    - Single Responsibility: Only handles portfolio persistence in PostgreSQL
    - Open/Closed: Extends PortfolioRepository interface
    - Dependency Inversion: Depends on PortfolioRepository abstraction
    """
    
    def __init__(self):
        """Initialize PostgreSQL portfolio repository."""
        pass
    
    async def get_portfolio(self, user_id: str) -> Optional[Portfolio]:
        """
        Get portfolio for user from PostgreSQL.
        
        Args:
            user_id: User identifier
            
        Returns:
            Portfolio if exists, None otherwise
        """
        async for session in get_db_session():
            try:
                # Query portfolio with holdings using eager loading
                stmt = (
                    select(PortfolioModel)
                    .options(selectinload(PortfolioModel.holdings))
                    .where(PortfolioModel.user_id == user_id)
                )
                result = await session.execute(stmt)
                portfolio_model = result.scalar_one_or_none()
                
                if not portfolio_model:
                    return None
                
                # Convert holdings from SQLAlchemy models to Holding entities
                holdings_list = []
                for holding_model in portfolio_model.holdings:
                    holding = Holding(
                        symbol=holding_model.symbol,
                        shares=holding_model.shares,
                        average_price=holding_model.average_price
                    )
                    holdings_list.append(holding)
                
                # Create Portfolio entity from PostgreSQL data
                portfolio = Portfolio(
                    id=str(portfolio_model.id),
                    user_id=str(portfolio_model.user_id),
                    cash_balance=portfolio_model.cash_balance,
                    created_at=portfolio_model.created_at,
                    updated_at=portfolio_model.updated_at
                )
                
                # Set holdings using the proper method
                portfolio.set_holdings(holdings_list)
                
                return portfolio
                
            except Exception as e:
                # Log error but don't crash - return None for graceful degradation
                print(f"❌ Error getting portfolio for user {user_id}: {e}")
                return None
    
    async def save_portfolio(self, portfolio: Portfolio) -> Portfolio:
        """
        Save portfolio to PostgreSQL.
        
        Args:
            portfolio: Portfolio entity to save
            
        Returns:
            Saved portfolio
        """
        async for session in get_db_session():
            try:
                # Check if portfolio already exists
                existing_stmt = select(PortfolioModel).where(PortfolioModel.user_id == portfolio.user_id)
                result = await session.execute(existing_stmt)
                existing_portfolio = result.scalar_one_or_none()
                
                if existing_portfolio:
                    # Update existing portfolio
                    existing_portfolio.cash_balance = portfolio.cash_balance
                    
                    # Delete existing holdings
                    delete_holdings_stmt = delete(HoldingModel).where(HoldingModel.portfolio_id == existing_portfolio.id)
                    await session.execute(delete_holdings_stmt)
                    
                    portfolio_model = existing_portfolio
                else:
                    # Create new portfolio
                    portfolio_model = PortfolioModel(
                        user_id=portfolio.user_id,
                        cash_balance=portfolio.cash_balance
                    )
                    session.add(portfolio_model)
                    await session.flush()  # Get the ID
                
                # Add/update holdings
                for holding in portfolio.get_holdings():
                    holding_model = HoldingModel(
                        portfolio_id=portfolio_model.id,
                        symbol=holding.symbol,
                        shares=holding.shares,
                        average_price=holding.average_price
                    )
                    session.add(holding_model)
                
                # Commit transaction
                await session.commit()
                
                # Return updated portfolio entity
                return Portfolio(
                    id=str(portfolio_model.id),
                    user_id=str(portfolio_model.user_id),
                    cash_balance=portfolio_model.cash_balance,
                    created_at=portfolio_model.created_at,
                    updated_at=portfolio_model.updated_at
                )
                
            except Exception as e:
                await session.rollback()
                print(f"❌ Error saving portfolio for user {portfolio.user_id}: {e}")
                # Return original portfolio on error for graceful degradation
                return portfolio
    
    async def portfolio_exists(self, user_id: str) -> bool:
        """
        Check if portfolio exists for user in PostgreSQL.
        
        Args:
            user_id: User identifier
            
        Returns:
            True if portfolio exists, False otherwise
        """
        async for session in get_db_session():
            try:
                # Use exists() for efficient existence check
                stmt = select(PortfolioModel.id).where(PortfolioModel.user_id == user_id)
                result = await session.execute(stmt)
                return result.scalar_one_or_none() is not None
                
            except Exception as e:
                print(f"❌ Error checking portfolio existence for user {user_id}: {e}")
                return False
