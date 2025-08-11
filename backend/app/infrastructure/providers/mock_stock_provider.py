from decimal import Decimal
from typing import List
from app.core.entities.stock import Stock
from app.core.interfaces.stock_data_provider import StockDataProvider
import random

class MockStockDataProvider(StockDataProvider):
    """Enhanced Mock implementation with complete educational data for demos and development"""
    
    def __init__(self):
        # Complete realistic stock database with ALL educational fields
        self._stocks = {
            "AAPL": {
                "name": "Apple Inc.",
                "sector": "Technology",
                "price": 185.50,
                "market_cap": 2850000000000,
                # Valuation metrics
                "pe_ratio": 28.5,
                "eps": 6.48,
                "book_value": 4.95,
                "price_to_book": 37.5,
                "profit_margin": 0.235,
                # Dividend data (Apple has low dividend)
                "dividend_yield": 0.0047,  # 0.47%
                "dividend_per_share": 0.95,
                # Risk & technical
                "week_52_high": 199.62,
                "week_52_low": 164.08,
                "beta": 1.29,
                # Growth metrics
                "earnings_growth_yoy": 0.112,  # 11.2%
                "revenue_growth_yoy": 0.081,   # 8.1%
                # Analyst data
                "analyst_target_price": 210.50,
                "analyst_rating_buy": 18,
                "analyst_rating_hold": 8,
                "analyst_rating_sell": 2
            },
            "GOOGL": {
                "name": "Alphabet Inc.",
                "sector": "Technology", 
                "price": 138.75,
                "market_cap": 1750000000000,
                "pe_ratio": 25.2,
                "eps": 5.51,
                "book_value": 24.32,
                "price_to_book": 5.7,
                "profit_margin": 0.191,
                "dividend_yield": 0.0,  # No dividend
                "dividend_per_share": 0.0,
                "week_52_high": 153.78,
                "week_52_low": 121.46,
                "beta": 1.05,
                "earnings_growth_yoy": 0.143,
                "revenue_growth_yoy": 0.124,
                "analyst_target_price": 155.00,
                "analyst_rating_buy": 22,
                "analyst_rating_hold": 6,
                "analyst_rating_sell": 1
            },
            "MSFT": {
                "name": "Microsoft Corporation",
                "sector": "Technology",
                "price": 415.20,
                "market_cap": 3080000000000,
                "pe_ratio": 32.1,
                "eps": 12.93,
                "book_value": 17.85,
                "price_to_book": 23.3,
                "profit_margin": 0.342,
                "dividend_yield": 0.0264,  # 2.64% - Good dividend
                "dividend_per_share": 11.05,
                "week_52_high": 468.35,
                "week_52_low": 362.90,
                "beta": 0.89,
                "earnings_growth_yoy": 0.201,
                "revenue_growth_yoy": 0.156,
                "analyst_target_price": 450.00,
                "analyst_rating_buy": 25,
                "analyst_rating_hold": 4,
                "analyst_rating_sell": 0
            },
            "AMZN": {
                "name": "Amazon.com Inc.",
                "sector": "Consumer Discretionary",
                "price": 151.25,
                "market_cap": 1580000000000,
                "pe_ratio": 45.8,
                "eps": 3.30,
                "book_value": 14.52,
                "price_to_book": 10.4,
                "profit_margin": 0.056,
                "dividend_yield": 0.0,  # No dividend
                "dividend_per_share": 0.0,
                "week_52_high": 174.20,
                "week_52_low": 118.35,
                "beta": 1.15,
                "earnings_growth_yoy": 0.952,  # High growth
                "revenue_growth_yoy": 0.128,
                "analyst_target_price": 175.00,
                "analyst_rating_buy": 20,
                "analyst_rating_hold": 7,
                "analyst_rating_sell": 1
            },
            "TSLA": {
                "name": "Tesla Inc.",
                "sector": "Consumer Discretionary",
                "price": 248.75,
                "market_cap": 789000000000,
                "pe_ratio": 65.3,
                "eps": 3.81,
                "book_value": 21.89,
                "price_to_book": 11.4,
                "profit_margin": 0.096,
                "dividend_yield": 0.0,  # No dividend (growth stock)
                "dividend_per_share": 0.0,
                "week_52_high": 299.29,
                "week_52_low": 138.80,
                "beta": 2.31,  # Very volatile
                "earnings_growth_yoy": 0.321,
                "revenue_growth_yoy": 0.192,
                "analyst_target_price": 220.00,
                "analyst_rating_buy": 12,
                "analyst_rating_hold": 15,
                "analyst_rating_sell": 8
            },
            "NVDA": {
                "name": "NVIDIA Corporation",
                "sector": "Technology",
                "price": 875.30,
                "market_cap": 2150000000000,
                "pe_ratio": 68.7,
                "eps": 12.73,
                "book_value": 12.52,
                "price_to_book": 69.9,
                "profit_margin": 0.533,  # Excellent margins
                "dividend_yield": 0.0029,  # 0.29% - Low dividend
                "dividend_per_share": 2.50,
                "week_52_high": 974.00,
                "week_52_low": 176.50,
                "beta": 1.68,
                "earnings_growth_yoy": 5.810,  # Explosive growth
                "revenue_growth_yoy": 1.262,
                "analyst_target_price": 950.00,
                "analyst_rating_buy": 28,
                "analyst_rating_hold": 3,
                "analyst_rating_sell": 1
            },
            "META": {
                "name": "Meta Platforms Inc.",
                "sector": "Technology",
                "price": 502.15,
                "market_cap": 1280000000000,
                "pe_ratio": 23.9,
                "eps": 21.03,
                "book_value": 49.62,
                "price_to_book": 10.1,
                "profit_margin": 0.291,
                "dividend_yield": 0.0164,  # 1.64% - Started dividend recently
                "dividend_per_share": 8.25,
                "week_52_high": 542.81,
                "week_52_low": 313.66,
                "beta": 1.23,
                "earnings_growth_yoy": 0.164,
                "revenue_growth_yoy": 0.112,
                "analyst_target_price": 550.00,
                "analyst_rating_buy": 19,
                "analyst_rating_hold": 9,
                "analyst_rating_sell": 2
            },
            "NFLX": {
                "name": "Netflix Inc.",
                "sector": "Communication Services",
                "price": 485.60,
                "market_cap": 215000000000,
                "pe_ratio": 34.2,
                "eps": 14.19,
                "book_value": 12.85,
                "price_to_book": 37.8,
                "profit_margin": 0.127,
                "dividend_yield": 0.0,  # No dividend
                "dividend_per_share": 0.0,
                "week_52_high": 700.99,
                "week_52_low": 445.73,
                "beta": 1.35,
                "earnings_growth_yoy": 0.201,
                "revenue_growth_yoy": 0.134,
                "analyst_target_price": 520.00,
                "analyst_rating_buy": 16,
                "analyst_rating_hold": 11,
                "analyst_rating_sell": 3
            },
            "DIS": {
                "name": "The Walt Disney Company",
                "sector": "Communication Services",
                "price": 112.85,
                "market_cap": 205000000000,
                "pe_ratio": 18.7,
                "eps": 6.03,
                "book_value": 51.78,
                "price_to_book": 2.2,
                "profit_margin": 0.089,
                "dividend_yield": 0.0,  # Suspended dividend
                "dividend_per_share": 0.0,
                "week_52_high": 123.74,
                "week_52_low": 83.91,
                "beta": 1.09,
                "earnings_growth_yoy": -0.023,  # Slight decline
                "revenue_growth_yoy": 0.056,
                "analyst_target_price": 125.00,
                "analyst_rating_buy": 14,
                "analyst_rating_hold": 12,
                "analyst_rating_sell": 4
            },
            "KO": {
                "name": "The Coca-Cola Company",
                "sector": "Consumer Staples",
                "price": 62.40,
                "market_cap": 270000000000,
                "pe_ratio": 25.1,
                "eps": 2.49,
                "book_value": 11.52,
                "price_to_book": 5.4,
                "profit_margin": 0.234,
                "dividend_yield": 0.0298,  # 2.98% - Excellent dividend
                "dividend_per_share": 1.86,
                "week_52_high": 65.75,
                "week_52_low": 51.55,
                "beta": 0.65,  # Low risk, stable
                "earnings_growth_yoy": 0.041,
                "revenue_growth_yoy": 0.032,
                "analyst_target_price": 68.00,
                "analyst_rating_buy": 9,
                "analyst_rating_hold": 15,
                "analyst_rating_sell": 2
            },
            "JPM": {
                "name": "JPMorgan Chase & Co.",
                "sector": "Financial Services",
                "price": 189.75,
                "market_cap": 555000000000,
                "pe_ratio": 11.8,
                "eps": 16.08,
                "book_value": 92.36,
                "price_to_book": 2.1,
                "profit_margin": 0.321,
                "dividend_yield": 0.0219,  # 2.19% - Good bank dividend
                "dividend_per_share": 4.15,
                "week_52_high": 224.27,
                "week_52_low": 154.86,
                "beta": 1.18,
                "earnings_growth_yoy": 0.147,
                "revenue_growth_yoy": 0.089,
                "analyst_target_price": 210.00,
                "analyst_rating_buy": 17,
                "analyst_rating_hold": 8,
                "analyst_rating_sell": 1
            },
            "JNJ": {
                "name": "Johnson & Johnson",
                "sector": "Healthcare",
                "price": 158.90,
                "market_cap": 415000000000,
                "pe_ratio": 14.6,
                "eps": 10.88,
                "book_value": 28.47,
                "price_to_book": 5.6,
                "profit_margin": 0.184,
                "dividend_yield": 0.0311,  # 3.11% - Dividend aristocrat
                "dividend_per_share": 4.95,
                "week_52_high": 168.85,
                "week_52_low": 143.13,
                "beta": 0.72,  # Low risk
                "earnings_growth_yoy": 0.023,
                "revenue_growth_yoy": 0.045,
                "analyst_target_price": 175.00,
                "analyst_rating_buy": 11,
                "analyst_rating_hold": 13,
                "analyst_rating_sell": 3
            }
        }
    
    def get_stock_data(self, symbol: str) -> Stock:
        """Return complete mock stock data with slight price variations for realism"""
        symbol = symbol.upper()
        
        if symbol not in self._stocks:
            # Generate realistic error for unknown symbols
            raise ValueError(f"Stock symbol '{symbol}' not found. Please check the symbol.")
        
        stock_data = self._stocks[symbol]
        
        # Add slight price variation (+/- 1%) for realism
        base_price = stock_data["price"]
        variation = random.uniform(-0.01, 0.01)  # +/- 1%
        current_price = base_price * (1 + variation)
        
        # Helper function to safely convert to Decimal or None
        def safe_decimal(value):
            if value is None or value == 0:
                return None
            return Decimal(str(value))
        
        def safe_int(value):
            if value is None or value == 0:
                return None
            return int(value)
        
        return Stock(
            # Core fields
            symbol=symbol,
            current_price=Decimal(str(round(current_price, 2))),
            name=stock_data["name"],
            sector=stock_data["sector"],
            market_cap=stock_data["market_cap"],
            pe_ratio=safe_decimal(stock_data["pe_ratio"]),
            
            # 🎯 Enhanced educational fields
            eps=safe_decimal(stock_data["eps"]),
            book_value=safe_decimal(stock_data["book_value"]),
            price_to_book=safe_decimal(stock_data["price_to_book"]),
            profit_margin=safe_decimal(stock_data["profit_margin"]),
            
            # Dividend data
            dividend_yield=safe_decimal(stock_data["dividend_yield"]),
            dividend_per_share=safe_decimal(stock_data["dividend_per_share"]),
            
            # Risk & technical
            week_52_high=safe_decimal(stock_data["week_52_high"]),
            week_52_low=safe_decimal(stock_data["week_52_low"]),
            beta=safe_decimal(stock_data["beta"]),
            
            # Growth metrics
            earnings_growth_yoy=safe_decimal(stock_data["earnings_growth_yoy"]),
            revenue_growth_yoy=safe_decimal(stock_data["revenue_growth_yoy"]),
            
            # Analyst data
            analyst_target_price=safe_decimal(stock_data["analyst_target_price"]),
            analyst_rating_buy=safe_int(stock_data["analyst_rating_buy"]),
            analyst_rating_hold=safe_int(stock_data["analyst_rating_hold"]),
            analyst_rating_sell=safe_int(stock_data["analyst_rating_sell"])
        )
    
    def search_stocks(self, query: str, limit: int = 10) -> List[Stock]:
        """
        Search stocks by symbol or company name in mock database
        
        Args:
            query: Search query (case-insensitive)
            limit: Maximum number of results to return
            
        Returns:
            List[Stock]: Sorted list of matching stocks (exact symbol matches first)
            
        Business Logic:
        - Exact symbol matches appear first
        - Partial symbol matches appear second  
        - Company name matches appear third
        - Sector matches appear last
        """
        query_lower = query.lower().strip()
        
        if not query_lower:
            return []
        
        matches = []
        
        # Priority 1: Exact symbol matches
        for symbol, data in self._stocks.items():
            if symbol.lower() == query_lower:
                matches.append((symbol, data, 1))  # Priority 1
        
        # Priority 2: Partial symbol matches (symbol starts with query)
        for symbol, data in self._stocks.items():
            if symbol.lower().startswith(query_lower) and symbol.lower() != query_lower:
                matches.append((symbol, data, 2))  # Priority 2
        
        # Priority 3: Company name matches (contains query)
        for symbol, data in self._stocks.items():
            if query_lower in data["name"].lower():
                # Avoid duplicates from previous matches
                if not any(match[0] == symbol for match in matches):
                    matches.append((symbol, data, 3))  # Priority 3
        
        # Priority 4: Sector matches
        for symbol, data in self._stocks.items():
            if query_lower in data["sector"].lower():
                # Avoid duplicates from previous matches
                if not any(match[0] == symbol for match in matches):
                    matches.append((symbol, data, 4))  # Priority 4
        
        # Sort by priority (lower number = higher priority)
        matches.sort(key=lambda x: x[2])
        
        # Convert to Stock objects (limit results)
        result_stocks = []
        for symbol, stock_data, _ in matches[:limit]:
            try:
                stock = self.get_stock_data(symbol)
                result_stocks.append(stock)
            except Exception:
                # Skip stocks that fail to load
                continue
        
        return result_stocks