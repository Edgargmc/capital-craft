from decimal import Decimal
from app.core.entities.portfolio import Portfolio, Holding
from app.core.entities.stock import Stock
from app.use_cases.get_stock_data import GetStockDataUseCase

class BuyStock:
    """Use case to buy stocks and update portfolio"""
    
    def __init__(self, get_stock_data: GetStockDataUseCase):  # <- Esta línea
        self.get_stock_data = get_stock_data
    
    def execute(self, portfolio: Portfolio, symbol: str, shares: int) -> Portfolio:
        """Buy shares of a stock"""
        # Validate inputs
        if shares <= 0:
            raise ValueError("Shares must be positive")
        
        if not symbol or not symbol.strip():
            raise ValueError("Stock symbol is required")
        
        # Get current stock data
        try:
            stock = self.get_stock_data.execute(symbol.upper().strip())
        except Exception as e:
            raise ValueError(f"Could not get stock data for {symbol}: {str(e)}")
        
        # Calculate total cost
        total_cost = stock.current_price * Decimal(shares)
        
        # Check if enough cash
        if portfolio.cash_balance < total_cost:
            raise ValueError(
                f"Insufficient funds. Need ${total_cost}, have ${portfolio.cash_balance}"
            )
        
        # Update portfolio
        updated_portfolio = self._update_portfolio(portfolio, stock, shares, total_cost)
        return updated_portfolio
    
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
        
        # Return updated portfolio
        return Portfolio(
            user_id=portfolio.user_id,
            cash_balance=portfolio.cash_balance - total_cost,
            holdings=new_holdings,
            created_at=portfolio.created_at
        )
