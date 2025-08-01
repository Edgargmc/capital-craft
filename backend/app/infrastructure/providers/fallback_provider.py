from app.core.entities.stock import Stock
from app.core.interfaces.stock_data_provider import StockDataProvider
from typing import List

class FallbackProvider(StockDataProvider):
    """Provider that cascades through multiple providers for maximum reliability"""
    
    def __init__(self, providers: List[StockDataProvider]):
        if not providers:
            raise ValueError("At least one provider must be specified")
        self.providers = providers
    
    def get_stock_data(self, symbol: str) -> Stock:
        """Try providers in order until one succeeds"""
        last_error = None
        
        for i, provider in enumerate(self.providers):
            try:
                return provider.get_stock_data(symbol)
            except Exception as e:
                last_error = e
                # Log which provider failed (in production, use proper logging)
                provider_name = provider.__class__.__name__
                print(f"Provider {provider_name} failed for {symbol}: {str(e)}")
                
                # Continue to next provider
                continue
        
        # All providers failed
        if last_error:
            raise last_error
        else:
            raise ValueError(f"All providers failed for symbol {symbol}")

