from decimal import Decimal
from typing import Dict, Any
from app.core.entities.portfolio import Portfolio
from app.use_cases.get_stock_data import GetStockDataUseCase

class GetPortfolioSummary:
    """Use case to calculate portfolio summary with P&L"""
    
    def __init__(self, get_stock_data: GetStockDataUseCase):
        self.get_stock_data = get_stock_data
    
    def execute(self, portfolio: Portfolio) -> Dict[str, Any]:
        """Calculate portfolio summary with current values and P&L"""
        
        # Start with cash
        total_portfolio_value = portfolio.cash_balance
        total_invested = Decimal("0")
        total_current_value = Decimal("0")
        holdings_summary = {}
        
        # Calculate each holding
        for symbol, holding in portfolio.holdings.items():
            try:
                # Get current stock price
                current_stock = self.get_stock_data.execute(symbol)
                current_price = current_stock.current_price
                
                # Calculate values
                invested_value = holding.average_price * Decimal(holding.shares)
                current_value = current_price * Decimal(holding.shares)
                unrealized_pnl = current_value - invested_value
                unrealized_pnl_percent = (unrealized_pnl / invested_value * 100) if invested_value > 0 else Decimal("0")
                
                # Add to totals
                total_invested += invested_value
                total_current_value += current_value
                total_portfolio_value += current_value
                
                # Store holding summary
                holdings_summary[symbol] = {
                    "symbol": symbol,
                    "shares": holding.shares,
                    "average_price": float(holding.average_price),
                    "current_price": float(current_price),
                    "invested_value": float(invested_value),
                    "current_value": float(current_value),
                    "unrealized_pnl": float(unrealized_pnl),
                    "unrealized_pnl_percent": float(unrealized_pnl_percent)
                }
                
            except Exception as e:
                # If we can't get current price, use average price as fallback
                invested_value = holding.average_price * Decimal(holding.shares)
                total_invested += invested_value
                total_current_value += invested_value  # No change if can't get price
                total_portfolio_value += invested_value
                
                holdings_summary[symbol] = {
                    "symbol": symbol,
                    "shares": holding.shares,
                    "average_price": float(holding.average_price),
                    "current_price": float(holding.average_price),  # Fallback
                    "invested_value": float(invested_value),
                    "current_value": float(invested_value),
                    "unrealized_pnl": 0.0,
                    "unrealized_pnl_percent": 0.0,
                    "error": f"Could not get current price: {str(e)}"
                }
        
        # Calculate total P&L
        total_unrealized_pnl = total_current_value - total_invested
        total_unrealized_pnl_percent = (total_unrealized_pnl / total_invested * 100) if total_invested > 0 else Decimal("0")
        
        return {
            "user_id": portfolio.user_id,
            "cash_balance": float(portfolio.cash_balance),
            "total_invested": float(total_invested),
            "total_current_value": float(total_current_value),
            "total_portfolio_value": float(total_portfolio_value),
            "total_unrealized_pnl": float(total_unrealized_pnl),
            "total_unrealized_pnl_percent": float(total_unrealized_pnl_percent),
            "holdings_count": len(portfolio.holdings),
            "holdings": holdings_summary,
            "created_at": portfolio.created_at.isoformat()
        }
