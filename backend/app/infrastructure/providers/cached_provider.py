import time
from typing import Dict, Tuple
from app.core.entities.stock import Stock
from app.core.interfaces.stock_data_provider import StockDataProvider

class CachedProvider(StockDataProvider):
    """Provider wrapper that adds caching to any provider"""
    
    def __init__(self, provider: StockDataProvider, cache_ttl_minutes: int = 15):
        self.provider = provider
        self.cache_ttl_seconds = cache_ttl_minutes * 60
        self._cache: Dict[str, Tuple[Stock, float]] = {}
    
    def get_stock_data(self, symbol: str) -> Stock:
        """Get stock data with caching"""
        symbol = symbol.upper()
        current_time = time.time()
        
        # Check cache
        if symbol in self._cache:
            cached_stock, cached_time = self._cache[symbol]
            if current_time - cached_time < self.cache_ttl_seconds:
                return cached_stock
        
        # Cache miss or expired - fetch fresh data
        stock = self.provider.get_stock_data(symbol)
        
        # Store in cache
        self._cache[symbol] = (stock, current_time)
        
        # Clean old entries (simple cleanup)
        self._cleanup_cache(current_time)
        
        return stock
    
    def _cleanup_cache(self, current_time: float):
        """Remove expired entries from cache"""
        expired_keys = [
            key for key, (_, cached_time) in self._cache.items()
            if current_time - cached_time >= self.cache_ttl_seconds
        ]
        for key in expired_keys:
            del self._cache[key]
