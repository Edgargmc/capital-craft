"""
📁 FILE: use_cases/sell_stock.py

Enhanced version - keeping your existing structure + adding notifications
"""
from decimal import Decimal
from typing import Optional
from app.core.entities.portfolio import Portfolio, Holding
from app.core.entities.stock import Stock
from app.use_cases.get_stock_data import GetStockDataUseCase
from app.core.entities.notification import NotificationTriggerType
from app.use_cases.generate_notification import GenerateNotificationUseCase
from app.core.interfaces.portfolio_repository import PortfolioRepository
from app.use_cases.get_or_create_portfolio import GetOrCreatePortfolioUseCase


class SellStock:
    """
    Enhanced: Use case to sell stocks and update portfolio + contextual notifications
    Now follows Clean Architecture - handles portfolio retrieval internally
    """
    
    def __init__(self, 
                 get_stock_data: GetStockDataUseCase,
                 portfolio_repository: PortfolioRepository,
                 notification_service: Optional[GenerateNotificationUseCase] = None):
        self.get_stock_data = get_stock_data
        self.portfolio_repository = portfolio_repository
        self.notification_service = notification_service
        self.get_or_create_portfolio = GetOrCreatePortfolioUseCase(portfolio_repository)
    
    async def execute_with_user_id(self, user_id: str, symbol: str, shares: int) -> Portfolio:
        """
        NEW: Execute sell stock with user_id (Clean Architecture approach)
        Use case handles portfolio retrieval internally
        """
        # Get portfolio (must exist to sell)
        portfolio = await self.get_or_create_portfolio.execute(user_id)
        
        # Calculate P&L before selling for educational context
        pnl_data = self._calculate_pnl(portfolio, symbol, shares)
        
        # Execute sell transaction
        updated_portfolio = self._execute_sell_transaction(portfolio, symbol, shares)
        
        # Save updated portfolio
        await self.portfolio_repository.save_portfolio(updated_portfolio)
        
        # Generate contextual notifications if service available
        if self.notification_service and pnl_data:
            await self._generate_sell_notifications(user_id, symbol, shares, pnl_data, updated_portfolio)
        
        return updated_portfolio

    async def execute(self, portfolio: Portfolio, symbol: str, shares: int, user_id: str = None) -> Portfolio:
        """
        LEGACY: Sell shares with portfolio object (backward compatibility)
        """
        # Calculate P&L before selling for educational context
        pnl_data = self._calculate_pnl(portfolio, symbol, shares) if user_id else None
        
        # Your original sell logic
        updated_portfolio = self._execute_sell_transaction(portfolio, symbol, shares)
        
        # NEW: Generate contextual notifications if service available
        if self.notification_service and user_id and pnl_data:
            await self._generate_sell_notifications(user_id, symbol, shares, pnl_data, updated_portfolio)
        
        return updated_portfolio
    
    def execute_sync(self, portfolio: Portfolio, symbol: str, shares: int) -> Portfolio:
        """
        Synchronous version - your original execute method functionality
        For backward compatibility where notifications are not needed
        """
        return self._execute_sell_transaction(portfolio, symbol, shares)
    
    def _execute_sell_transaction(self, portfolio: Portfolio, symbol: str, shares: int) -> Portfolio:
        """
        Execute sell transaction using new Portfolio API
        """
        # Validate inputs
        if shares <= 0:
            raise ValueError("Shares must be positive")
        
        if not symbol or not symbol.strip():
            raise ValueError("Stock symbol is required")
        
        symbol = symbol.upper().strip()
        
        # Get current holdings
        current_holdings = portfolio.get_holdings()
        
        # Find holding for this symbol
        current_holding = next((h for h in current_holdings if h.symbol == symbol), None)
        
        # Check if holding exists
        if not current_holding:
            raise ValueError(f"No holdings found for {symbol}")
        
        # Check if enough shares to sell
        if current_holding.shares < shares:
            raise ValueError(
                f"Insufficient shares. Have {current_holding.shares}, trying to sell {shares}"
            )
        
        # Get current stock price for sale
        try:
            stock = self.get_stock_data.execute(symbol)
            sell_price = stock.current_price
        except Exception as e:
            raise ValueError(f"Could not get current price for {symbol}: {str(e)}")
        
        # Calculate sale proceeds
        sale_proceeds = sell_price * Decimal(shares)
        
        # Update portfolio
        updated_portfolio = self._update_portfolio(portfolio, symbol, shares, sale_proceeds, current_holding)
        return updated_portfolio
    
    def _update_portfolio(self, portfolio: Portfolio, symbol: str, shares_sold: int, 
                         sale_proceeds: Decimal, current_holding: Holding) -> Portfolio:
        """
        Update portfolio using new Portfolio API
        """
        # Get current holdings as list
        current_holdings = portfolio.get_holdings()
        
        # Create new holdings list
        new_holdings = []
        
        if current_holding.shares == shares_sold:
            # Selling all shares - remove this holding completely
            new_holdings = [h for h in current_holdings if h.symbol != symbol]
        else:
            # Partial sale - update holding with remaining shares
            remaining_shares = current_holding.shares - shares_sold
            
            # Add all holdings except the one we're updating
            new_holdings = [h for h in current_holdings if h.symbol != symbol]
            
            # Add updated holding
            new_holdings.append(Holding(
                symbol=symbol,
                shares=remaining_shares,
                average_price=current_holding.average_price  # Keep same average price
            ))
        
        # Create updated portfolio with increased cash
        updated_portfolio = Portfolio(
            user_id=portfolio.user_id,
            cash_balance=portfolio.cash_balance + sale_proceeds,
            created_at=portfolio.created_at,
            id=portfolio.id,
            updated_at=portfolio.updated_at
        )
        updated_portfolio.set_holdings(new_holdings)
        
        return updated_portfolio
    
    def _calculate_pnl(self, portfolio: Portfolio, symbol: str, shares: int) -> dict:
        """
        NEW: Calculate profit/loss data for educational context
        """
        try:
            symbol = symbol.upper().strip()
            
            # Find holding for this symbol
            current_holdings = portfolio.get_holdings()
            holding = next((h for h in current_holdings if h.symbol == symbol), None)
            
            if not holding:
                return {"type": "none", "amount": 0.0, "percentage": 0.0}
            stock = self.get_stock_data.execute(symbol)
            
            # Calculate P&L for the shares being sold
            cost_basis = holding.average_price * shares
            current_value = stock.current_price * shares
            pnl_amount = float(current_value - cost_basis)
            pnl_percentage = float((current_value - cost_basis) / cost_basis * 100)
            
            return {
                "type": "profit" if pnl_amount > 0 else "loss" if pnl_amount < 0 else "breakeven",
                "amount": pnl_amount,
                "percentage": pnl_percentage,
                "cost_basis": float(cost_basis),
                "current_value": float(current_value)
            }
        except Exception:
            return {"type": "unknown", "amount": 0.0, "percentage": 0.0}
    
    async def _generate_sell_notifications(
        self, 
        user_id: str, 
        symbol: str, 
        shares: int,
        pnl_data: dict,
        updated_portfolio: Portfolio
    ) -> None:
        """
        NEW: Generate contextual notifications when user sells stocks
        Baby step: Focus on learning from trading decisions
        """
        try:
            # 1. Profit-taking education
            if pnl_data["type"] == "profit" and pnl_data["percentage"] > 10:
                await self.notification_service.execute(
                    user_id=user_id,
                    trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
                    trigger_data={
                        "topic": "Profit Taking Strategy",
                        "topic_description": "when and how to lock in your investment gains",
                        "relevance_score": 0.95,
                        "content_slug": "volatility_basics",  # Use existing content for now
                        "transaction_context": f"You made {pnl_data['percentage']:.1f}% profit on {symbol}",
                        "profit_amount": pnl_data["amount"]
                    }
                )
            
            # 2. Loss management education
            elif pnl_data["type"] == "loss" and pnl_data["percentage"] < -10:
                await self.notification_service.execute(
                    user_id=user_id,
                    trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
                    trigger_data={
                        "topic": "Managing Investment Losses",
                        "topic_description": "learning from losses and managing risk",
                        "relevance_score": 0.9,
                        "content_slug": "volatility_basics",  # Use existing content for now
                        "transaction_context": f"You sold {symbol} at {pnl_data['percentage']:.1f}% loss",
                        "loss_amount": abs(pnl_data["amount"])
                    }
                )
            
            # 3. Portfolio rebalancing education (for multiple holdings)
            elif len(updated_portfolio.get_holdings()) >= 2:
                await self.notification_service.execute(
                    user_id=user_id,
                    trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
                    trigger_data={
                        "topic": "Portfolio Rebalancing",
                        "topic_description": "maintaining optimal portfolio allocation",
                        "relevance_score": 0.8,
                        "content_slug": "diversification_basics", 
                        "transaction_context": f"You sold {shares} shares of {symbol}",
                        "remaining_stocks": len(updated_portfolio.get_holdings())
                    }
                )
        
        except Exception as e:
            # Don't fail the transaction if notification fails
            print(f"Sell notification generation failed: {e}")
            pass