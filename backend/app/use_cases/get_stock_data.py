import yfinance as yf
from decimal import Decimal
from app.core.entities.stock import Stock

class GetStockDataUseCase:
    def execute(self, symbol: str) -> Stock:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="1d")
        info = ticker.info
        
        if hist.empty:
            raise ValueError(f"No data found for {symbol}")
        
        current_price = float(hist['Close'].iloc[-1])
        
        return Stock(
            symbol=symbol,
            current_price=Decimal(str(current_price)),
            name=info.get('longName', symbol),
            sector=info.get('sector', 'Unknown'),
            market_cap=info.get('marketCap'),
            pe_ratio=Decimal(str(info.get('forwardPE', 0))) if info.get('forwardPE') else None
        )