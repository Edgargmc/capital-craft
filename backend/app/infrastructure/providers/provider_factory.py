import os
from app.core.interfaces.stock_data_provider import StockDataProvider
from app.infrastructure.providers.yahoo_finance_provider import YahooFinanceProvider
from app.infrastructure.providers.mock_stock_provider import MockStockDataProvider
from app.infrastructure.providers.alpha_vantage_provider import AlphaVantageProvider
from app.infrastructure.providers.fallback_provider import FallbackProvider
from app.infrastructure.providers.cached_provider import CachedProvider



class ProviderFactory:
    """Factory to create stock data providers based on configuration"""
    
    @staticmethod
    def create_provider() -> StockDataProvider:
        """Create provider based on environment configuration"""
        provider_type = os.getenv("STOCK_DATA_PROVIDER", "mock").lower()
        
        if provider_type == "alpha_vantage":
            return ProviderFactory._create_alpha_vantage_provider()
        elif provider_type == "fallback":
            return ProviderFactory._create_fallback_provider()
        elif provider_type == "yahoo":
            return YahooFinanceProvider()
        elif provider_type == "mock":
            return MockStockDataProvider()
        else:
            # Default fallback
            print(f"Warning: Unknown provider '{provider_type}', defaulting to mock")
            return MockStockDataProvider()
    
    @staticmethod
    def _create_alpha_vantage_provider() -> StockDataProvider:
        """Create Alpha Vantage provider with caching"""
        api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        if not api_key:
            raise ValueError("ALPHA_VANTAGE_API_KEY environment variable is required")
        
        # Create Alpha Vantage provider
        av_provider = AlphaVantageProvider(api_key)
        
        # Add caching
        cache_ttl = int(os.getenv("CACHE_TTL_MINUTES", "15"))
        return CachedProvider(av_provider, cache_ttl)
    
    @staticmethod
    def _create_fallback_provider() -> StockDataProvider:
        """Create fallback provider: Alpha Vantage -> Mock"""
        providers = []
        
        # Try Alpha Vantage first
        api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        if api_key:
            av_provider = AlphaVantageProvider(api_key)
            cache_ttl = int(os.getenv("CACHE_TTL_MINUTES", "15"))
            cached_av_provider = CachedProvider(av_provider, cache_ttl)
            providers.append(cached_av_provider)
        
        # Always have Mock as fallback
        providers.append(MockStockDataProvider())
        
        return FallbackProvider(providers)
