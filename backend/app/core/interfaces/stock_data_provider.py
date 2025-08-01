from abc import ABC, abstractmethod
from app.core.entities.stock import Stock

class StockDataProvider(ABC):
    """Abstract interface for stock data providers"""
    
    @abstractmethod
    def get_stock_data(self, symbol: str) -> Stock:
        """Fetch stock data for given symbol"""
        pass
