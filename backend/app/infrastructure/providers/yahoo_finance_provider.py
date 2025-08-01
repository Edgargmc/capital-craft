import yfinance as yf
import time
from random import uniform
from decimal import Decimal
from app.core.entities.stock import Stock
from app.core.interfaces.stock_data_provider import StockDataProvider

class YahooFinanceProvider(StockDataProvider):
    """Yahoo Finance implementation of StockDataProvider"""
    
    def get_stock_data(self, symbol: str) -> Stock:
        # Retry logic with backoff (moved from use case)
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Progressive delay
                if attempt > 0:
                    time.sleep(uniform(1.0, 2.0) * attempt)
                else:
                    time.sleep(uniform(0.1, 0.3))
                
                ticker = yf.Ticker(symbol)
                
                # Try to get historical data first (more reliable)
                hist = ticker.history(period="5d")
                
                if hist.empty:
                    if attempt < max_retries - 1:
                        continue
                    raise ValueError(f"No price data found for {symbol}")
                
                current_price = float(hist['Close'].iloc[-1])
                
                # Try to get info, but don't fail if it doesn't work
                try:
                    info = ticker.info
                    name = info.get('longName', symbol)
                    sector = info.get('sector', 'Technology')
                    market_cap = info.get('marketCap')
                    pe_ratio = Decimal(str(info.get('forwardPE', 0))) if info.get('forwardPE') else None
                except:
                    # Fallback data if info fails
                    name = symbol
                    sector = 'Unknown'
                    market_cap = None
                    pe_ratio = None
                
                return Stock(
                    symbol=symbol.upper(),
                    current_price=Decimal(str(current_price)),
                    name=name,
                    sector=sector,
                    market_cap=market_cap,
                    pe_ratio=pe_ratio
                )
                
            except ValueError:
                # Re-raise ValueError (our custom errors)
                raise
            except Exception as e:
                if attempt < max_retries - 1:
                    continue  # Try again
                    
                # Final attempt failed
                if "429" in str(e) or "Too Many Requests" in str(e):
                    raise ValueError(f"Yahoo Finance is temporarily busy. Please try again in a moment.")
                elif "404" in str(e) or "Not Found" in str(e):
                    raise ValueError(f"Stock symbol '{symbol}' not found. Please check the symbol.")
                else:
                    raise ValueError(f"Unable to fetch data for {symbol}. Yahoo Finance may be experiencing issues.")

