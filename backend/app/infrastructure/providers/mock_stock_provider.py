from decimal import Decimal
from app.core.entities.stock import Stock
from app.core.interfaces.stock_data_provider import StockDataProvider
import random

class MockStockDataProvider(StockDataProvider):
    """Mock implementation with realistic stock data for demos and development"""
    
    def __init__(self):
        # Realistic stock database
        self._stocks = {
            "AAPL": {
                "name": "Apple Inc.",
                "sector": "Technology",
                "price": 185.50,
                "market_cap": 2850000000000,
                "pe_ratio": 28.5
            },
            "GOOGL": {
                "name": "Alphabet Inc.",
                "sector": "Technology", 
                "price": 138.75,
                "market_cap": 1750000000000,
                "pe_ratio": 25.2
            },
            "MSFT": {
                "name": "Microsoft Corporation",
                "sector": "Technology",
                "price": 415.20,
                "market_cap": 3080000000000,
                "pe_ratio": 32.1
            },
            "AMZN": {
                "name": "Amazon.com Inc.",
                "sector": "Consumer Discretionary",
                "price": 151.25,
                "market_cap": 1580000000000,
                "pe_ratio": 45.8
            },
            "TSLA": {
                "name": "Tesla Inc.",
                "sector": "Consumer Discretionary",
                "price": 248.75,
                "market_cap": 789000000000,
                "pe_ratio": 65.3
            },
            "NVDA": {
                "name": "NVIDIA Corporation",
                "sector": "Technology",
                "price": 875.30,
                "market_cap": 2150000000000,
                "pe_ratio": 68.7
            },
            "META": {
                "name": "Meta Platforms Inc.",
                "sector": "Technology",
                "price": 502.15,
                "market_cap": 1280000000000,
                "pe_ratio": 23.9
            },
            "NFLX": {
                "name": "Netflix Inc.",
                "sector": "Communication Services",
                "price": 485.60,
                "market_cap": 215000000000,
                "pe_ratio": 34.2
            },
            "DIS": {
                "name": "The Walt Disney Company",
                "sector": "Communication Services",
                "price": 112.85,
                "market_cap": 205000000000,
                "pe_ratio": 18.7
            },
            "KO": {
                "name": "The Coca-Cola Company",
                "sector": "Consumer Staples",
                "price": 62.40,
                "market_cap": 270000000000,
                "pe_ratio": 25.1
            },
            "JPM": {
                "name": "JPMorgan Chase & Co.",
                "sector": "Financial Services",
                "price": 189.75,
                "market_cap": 555000000000,
                "pe_ratio": 11.8
            },
            "JNJ": {
                "name": "Johnson & Johnson",
                "sector": "Healthcare",
                "price": 158.90,
                "market_cap": 415000000000,
                "pe_ratio": 14.6
            }
        }
    
    def get_stock_data(self, symbol: str) -> Stock:
        """Return mock stock data with slight price variations for realism"""
        symbol = symbol.upper()
        
        if symbol not in self._stocks:
            # Generate realistic error for unknown symbols
            raise ValueError(f"Stock symbol '{symbol}' not found. Please check the symbol.")
        
        stock_data = self._stocks[symbol]
        
        # Add slight price variation (+/- 2%) for realism
        base_price = stock_data["price"]
        variation = random.uniform(-0.02, 0.02)  # +/- 2%
        current_price = base_price * (1 + variation)
        
        return Stock(
            symbol=symbol,
            current_price=Decimal(str(round(current_price, 2))),
            name=stock_data["name"],
            sector=stock_data["sector"],
            market_cap=stock_data["market_cap"],
            pe_ratio=Decimal(str(stock_data["pe_ratio"]))
        )