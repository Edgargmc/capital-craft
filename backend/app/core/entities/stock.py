from dataclasses import dataclass
from decimal import Decimal
from typing import Optional

@dataclass
class Stock:
    # Core identification & price
    symbol: str
    current_price: Decimal
    name: str = ""
    sector: str = ""
    
    # Valuation metrics
    market_cap: Optional[int] = None
    pe_ratio: Optional[Decimal] = None
    
    # 🎯 NEW: Fundamental analysis (educational value)
    eps: Optional[Decimal] = None                    # Earnings per share
    book_value: Optional[Decimal] = None             # Book value per share
    price_to_book: Optional[Decimal] = None          # P/B ratio
    profit_margin: Optional[Decimal] = None          # Profitability %
    
    # 🎯 NEW: Income investing education  
    dividend_yield: Optional[Decimal] = None         # Dividend yield %
    dividend_per_share: Optional[Decimal] = None     # Annual dividend
    
    # 🎯 NEW: Risk & opportunity assessment
    week_52_high: Optional[Decimal] = None           # 52-week high
    week_52_low: Optional[Decimal] = None            # 52-week low
    beta: Optional[Decimal] = None                   # Market risk measure
    
    # 🎯 NEW: Growth metrics
    earnings_growth_yoy: Optional[Decimal] = None    # Quarterly earnings growth
    revenue_growth_yoy: Optional[Decimal] = None     # Quarterly revenue growth
    
    # 🎯 NEW: Analyst sentiment
    analyst_target_price: Optional[Decimal] = None   # Average target price
    analyst_rating_buy: Optional[int] = None         # Number of buy ratings
    analyst_rating_hold: Optional[int] = None        # Number of hold ratings
    analyst_rating_sell: Optional[int] = None        # Number of sell ratings
    
    def __post_init__(self):
        self.symbol = self.symbol.upper()
        if self.current_price <= 0:
            raise ValueError("Price must be positive")
    
    # 🎯 NEW: Educational helper methods
    @property
    def is_dividend_stock(self) -> bool:
        """Returns True if stock pays meaningful dividends (>1% yield)"""
        return self.dividend_yield is not None and self.dividend_yield > Decimal('0.01')
    
    @property
    def current_vs_52week_range(self) -> Optional[Decimal]:
        """Returns current price position in 52-week range (0-1)"""
        if not self.week_52_high or not self.week_52_low:
            return None
        range_size = self.week_52_high - self.week_52_low
        if range_size <= 0:
            return None
        return (self.current_price - self.week_52_low) / range_size
    
    @property
    def analyst_sentiment(self) -> str:
        """Returns overall analyst sentiment"""
        if not all([self.analyst_rating_buy, self.analyst_rating_hold, self.analyst_rating_sell]):
            return "Unknown"
        
        total = self.analyst_rating_buy + self.analyst_rating_hold + self.analyst_rating_sell
        if total == 0:
            return "No Coverage"
        
        buy_ratio = self.analyst_rating_buy / total
        if buy_ratio >= 0.6:
            return "Bullish"
        elif buy_ratio >= 0.4:
            return "Mixed"
        else:
            return "Bearish"
    
    @property
    def upside_potential(self) -> Optional[Decimal]:
        """Returns potential upside to analyst target price"""
        if not self.analyst_target_price:
            return None
        return (self.analyst_target_price - self.current_price) / self.current_price