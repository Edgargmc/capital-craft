"""
📁 FILE: use_cases/buy_stock.py

FINAL CLEAN VERSION - Replace entire file
"""
from decimal import Decimal
from typing import Optional
from app.core.entities.portfolio import Portfolio, Holding
from app.core.entities.stock import Stock
from app.use_cases.get_stock_data import GetStockDataUseCase
from app.core.entities.notification import NotificationTriggerType
from app.use_cases.generate_notification import GenerateNotificationUseCase


class BuyStock:
    """
    Enhanced: Use case to buy stocks and update portfolio + contextual notifications
    """
    
    def __init__(self, 
                 get_stock_data: GetStockDataUseCase,
                 notification_service: Optional[GenerateNotificationUseCase] = None):
        self.get_stock_data = get_stock_data
        self.notification_service = notification_service
    
    async def execute(self, portfolio: Portfolio, symbol: str, shares: int, user_id: str = None) -> Portfolio:
        """Enhanced: Buy shares with optional educational notifications"""
        # Validation
        if shares <= 0:
            raise ValueError("Shares must be positive")
        
        if not symbol or not symbol.strip():
            raise ValueError("Stock symbol is required")
        
        # Get stock data
        try:
            stock = self.get_stock_data.execute(symbol.upper().strip())
        except Exception as e:
            raise ValueError(f"Could not get stock data for {symbol}: {str(e)}")
        
        # Check funds
        total_cost = stock.current_price * Decimal(shares)
        if portfolio.cash_balance < total_cost:
            raise ValueError(f"Insufficient funds. Need ${total_cost}, have ${portfolio.cash_balance}")
        
        # Update portfolio
        updated_portfolio = self._update_portfolio(portfolio, stock, shares, total_cost)
        
        # Generate notifications
        if self.notification_service and user_id:
            await self._generate_buy_notifications(user_id, stock, shares, updated_portfolio)
        
        return updated_portfolio
    
    def execute_sync(self, portfolio: Portfolio, symbol: str, shares: int) -> Portfolio:
        """Synchronous version for backward compatibility"""
        if shares <= 0:
            raise ValueError("Shares must be positive")
        
        if not symbol or not symbol.strip():
            raise ValueError("Stock symbol is required")
        
        try:
            stock = self.get_stock_data.execute(symbol.upper().strip())
        except Exception as e:
            raise ValueError(f"Could not get stock data for {symbol}: {str(e)}")
        
        total_cost = stock.current_price * Decimal(shares)
        if portfolio.cash_balance < total_cost:
            raise ValueError(f"Insufficient funds. Need ${total_cost}, have ${portfolio.cash_balance}")
        
        return self._update_portfolio(portfolio, stock, shares, total_cost)
    
    def _update_portfolio(self, portfolio: Portfolio, stock: Stock, shares: int, total_cost: Decimal) -> Portfolio:
        """Update portfolio with new purchase"""
        symbol = stock.symbol
        new_holdings = portfolio.holdings.copy()
        
        if symbol in new_holdings:
            # Update existing holding
            existing = new_holdings[symbol]
            total_shares = existing.shares + shares
            total_value = (existing.average_price * Decimal(existing.shares)) + total_cost
            new_average_price = total_value / Decimal(total_shares)
            
            new_holdings[symbol] = Holding(
                symbol=symbol,
                shares=total_shares,
                average_price=new_average_price
            )
        else:
            # Create new holding
            new_holdings[symbol] = Holding(
                symbol=symbol,
                shares=shares,
                average_price=stock.current_price
            )
        
        return Portfolio(
            user_id=portfolio.user_id,
            cash_balance=portfolio.cash_balance - total_cost,
            holdings=new_holdings,
            created_at=portfolio.created_at
        )
    
    async def _generate_buy_notifications(
        self, 
        user_id: str, 
        stock: Stock, 
        shares: int,
        updated_portfolio: Portfolio
    ) -> None:
        """Generate contextual notifications with working triggers"""
        try:
            print(f"\n=== NOTIFICATION DEBUG ===")
            print(f"Stock: {stock.symbol}")
            print(f"Holdings: {len(updated_portfolio.holdings)}")
            
            # 1. First-time stock purchase
            if len(updated_portfolio.holdings) == 1:
                print("✅ TRIGGERING: First stock purchase")
                await self.notification_service.execute(
                    user_id=user_id,
                    trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
                    trigger_data={
                        "topic": "Your First Stock Purchase",
                        "topic_description": "congratulations on your first investment! Here's what you should know",
                        "relevance_score": 1.0,
                        "content_slug": "investment_fundamentals",
                        "transaction_context": f"You just bought {shares} shares of {stock.symbol}"
                    }
                )
            
            # 2. High volatility stock
            if stock.beta and float(stock.beta) > 1.3:
                print(f"✅ TRIGGERING: High volatility (Beta: {stock.beta})")
                await self.notification_service.execute(
                    user_id=user_id,
                    trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
                    trigger_data={
                        "stock_symbol": stock.symbol,
                        "change_percent": 10.0,
                        "min_abs_change_percent": 10.0,
                        "content_slug": "volatility_basics",
                        "beta": float(stock.beta),
                        "transaction_context": f"You bought volatile stock {stock.symbol} (Beta: {stock.beta})"
                    }
                )
                
            # 3. Dividend stock
            print(f"Dividend check: yield={stock.dividend_yield}, is_dividend={stock.is_dividend_stock}")
            if stock.is_dividend_stock:
                print(f"✅ TRIGGERING: Dividend education")
                await self.notification_service.execute(
                    user_id=user_id,
                    trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
                    trigger_data={
                        "topic": "Dividend Investing",
                        "topic_description": "how dividend stocks can provide steady income",
                        "relevance_score": 0.9,
                        "content_slug": "volatility_basics",
                        "transaction_context": f"You bought dividend-paying stock {stock.symbol}",
                        "dividend_yield": float(stock.dividend_yield) if stock.dividend_yield else 0.0
                    }
                )
            
            # 4. Diversification
            if len(updated_portfolio.holdings) >= 3:
                print(f"✅ TRIGGERING: Diversification ({len(updated_portfolio.holdings)} stocks)")
                await self.notification_service.execute(
                    user_id=user_id,
                    trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
                    trigger_data={
                        "topic": "Portfolio Diversification",
                        "topic_description": "building a well-balanced investment portfolio",
                        "relevance_score": 0.8,
                        "content_slug": "diversification_basics",
                        "transaction_context": f"You now own {len(updated_portfolio.holdings)} different stocks"
                    }
                )
            
            print("=== END DEBUG ===\n")
            
        except Exception as e:
            print(f"❌ Notification generation failed: {e}")
            import traceback
            traceback.print_exc()