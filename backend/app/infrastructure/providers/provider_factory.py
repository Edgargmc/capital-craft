import os
from app.core.interfaces.stock_data_provider import StockDataProvider
from app.infrastructure.providers.yahoo_finance_provider import YahooFinanceProvider
from app.infrastructure.providers.mock_stock_provider import MockStockDataProvider

class ProviderFactory:
    """Factory to create stock data providers based on configuration"""
    
    @staticmethod
    def create_provider() -> StockDataProvider:
        """Create provider based on environment configuration"""
        provider_type = os.getenv("STOCK_DATA_PROVIDER", "mock").lower()
        
        if provider_type == "yahoo":
            return YahooFinanceProvider()
        elif provider_type == "mock":
            return MockStockDataProvider()
        else:
            # Default fallback
            print(f"Warning: Unknown provider '{provider_type}', defaulting to mock")
            return MockStockDataProvider()
