from decimal import Decimal
from app.core.entities.portfolio import Portfolio, Holding
from app.core.entities.stock import Stock
from app.use_cases.get_stock_data import GetStockDataUseCase

class SellStock:
    """Use case to sell stocks and update portfolio"""
    
    def __init__(self, get_stock_data: GetStockDataUseCase):
        self.get_stock_data = get_stock_data
    
    def execute(self, portfolio: Portfolio, symbol: str, shares: int) -> Portfolio:
        """Sell shares of a stock"""
        # Validate inputs
        if shares <= 0:
            raise ValueError("Shares must be positive")
        
        if not symbol or not symbol.strip():
            raise ValueError("Stock symbol is required")
        
        symbol = symbol.upper().strip()
        
        # Check if holding exists
        if symbol not in portfolio.holdings:
            raise ValueError(f"No holdings found for {symbol}")
        
        current_holding = portfolio.holdings[symbol]
        
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
        """Update portfolio after stock sale"""
        new_holdings = portfolio.holdings.copy()
        
        if current_holding.shares == shares_sold:
            # Selling all shares - remove holding completely
            del new_holdings[symbol]
        else:
            # Partial sale - update holding with remaining shares
            remaining_shares = current_holding.shares - shares_sold
            new_holdings[symbol] = Holding(
                symbol=symbol,
                shares=remaining_shares,
                average_price=current_holding.average_price  # Keep same average price
            )
        
        # Return updated portfolio with increased cash
        return Portfolio(
            user_id=portfolio.user_id,
            cash_balance=portfolio.cash_balance + sale_proceeds,
            holdings=new_holdings,
            created_at=portfolio.created_at
        )

