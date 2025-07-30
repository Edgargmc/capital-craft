import yfinance as yf
import time
from random import uniform
from decimal import Decimal
from app.core.entities.stock import Stock

class GetStockDataUseCase:
    def execute(self, symbol: str) -> Stock:
        try:
            # Add small delay to avoid rate limiting
            time.sleep(uniform(0.1, 0.5))
            
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="1d")
            
            if hist.empty:
                raise ValueError(f"No data found for {symbol}")
            
            current_price = float(hist['Close'].iloc[-1])
            
            # Get info with error handling
            try:
                info = ticker.info
            except Exception:
                # If info fails, use basic data
                info = {}
            
            return Stock(
                symbol=symbol,
                current_price=Decimal(str(current_price)),
                name=info.get('longName', symbol),
                sector=info.get('sector', 'Unknown'),
                market_cap=info.get('marketCap'),
                pe_ratio=Decimal(str(info.get('forwardPE', 0))) if info.get('forwardPE') else None
            )
            
        except Exception as e:
            if "429" in str(e) or "Too Many Requests" in str(e):
                raise ValueError(f"Yahoo Finance rate limit reached. Please try again in a moment.")
            elif "404" in str(e) or "Not Found" in str(e):
                raise ValueError(f"Stock symbol '{symbol}' not found")
            else:
                raise ValueError(f"Unable to fetch data for {symbol}. Please check the symbol and try again.")