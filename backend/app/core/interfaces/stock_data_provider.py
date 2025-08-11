from abc import ABC, abstractmethod
from typing import List
from app.core.entities.stock import Stock

class StockDataProvider(ABC):
    """Abstract interface for stock data providers"""
    
    @abstractmethod
    def get_stock_data(self, symbol: str) -> Stock:
        """Fetch stock data for given symbol"""
        pass
    
    @abstractmethod
    def search_stocks(self, query: str, limit: int = 10) -> List[Stock]:
        """Search stocks by symbol or company name"""
        pass
