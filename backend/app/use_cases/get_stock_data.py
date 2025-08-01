from app.core.entities.stock import Stock
from app.core.interfaces.stock_data_provider import StockDataProvider

class GetStockDataUseCase:
    """Use case for getting stock data - now provider-agnostic"""
    
    def __init__(self, stock_data_provider: StockDataProvider):
        self._stock_data_provider = stock_data_provider
    
    def execute(self, symbol: str) -> Stock:
        """Execute the use case using injected provider"""
        return self._stock_data_provider.get_stock_data(symbol)