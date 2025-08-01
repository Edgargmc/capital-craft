import requests
import time
from decimal import Decimal
from app.core.entities.stock import Stock
from app.core.interfaces.stock_data_provider import StockDataProvider
from typing import Optional

class AlphaVantageProvider(StockDataProvider):
    """Alpha Vantage implementation for real stock data"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://www.alphavantage.co/query"
    
    def get_stock_data(self, symbol: str) -> Stock:
        """Fetch real stock data from Alpha Vantage API"""
        try:
            # Get quote data (price)
            quote_data = self._get_quote_data(symbol)
            
            # Get company overview (fundamentals)
            overview_data = self._get_company_overview(symbol)
            
            # Map to Stock entity
            return self._map_to_stock(symbol, quote_data, overview_data)
            
        except Exception as e:
            if "API call frequency" in str(e):
                raise ValueError(f"Alpha Vantage rate limit reached. Please try again in a moment.")
            elif "Invalid API call" in str(e):
                raise ValueError(f"Stock symbol '{symbol}' not found. Please check the symbol.")
            else:
                raise ValueError(f"Unable to fetch data for {symbol}. Please try again later.")
    
    def _get_quote_data(self, symbol: str) -> dict:
        """Get current quote data from Alpha Vantage"""
        params = {
            'function': 'GLOBAL_QUOTE',
            'symbol': symbol,
            'apikey': self.api_key
        }
        
        response = requests.get(self.base_url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Check for API errors
        if 'Error Message' in data:
            raise ValueError(f"Invalid API call: {data['Error Message']}")
        
        if 'Note' in data:
            raise ValueError(f"API call frequency: {data['Note']}")
        
        # Check if quote data exists
        if 'Global Quote' not in data or not data['Global Quote']:
            raise ValueError(f"No quote data found for {symbol}")
        
        return data['Global Quote']
    
    def _get_company_overview(self, symbol: str) -> Optional[dict]:
        """Get company overview data from Alpha Vantage"""
        try:
            params = {
                'function': 'OVERVIEW',
                'symbol': symbol,
                'apikey': self.api_key
            }
            
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Check for errors (but don't fail if overview is not available)
            if 'Error Message' in data or 'Note' in data or not data:
                return None
            
            return data
            
        except:
            # If overview fails, continue without it
            return None
    
    def _map_to_stock(self, symbol: str, quote_data: dict, overview_data: Optional[dict]) -> Stock:
        """Map Alpha Vantage response to Stock entity"""
        
        # Extract price from quote data
        # Alpha Vantage returns: "05. price": "185.43"
        price_key = "05. price"
        if price_key not in quote_data:
            raise ValueError(f"Price data not available for {symbol}")
        
        current_price = Decimal(quote_data[price_key])
        
        # Extract company data from overview (with fallbacks)
        if overview_data:
            name = overview_data.get('Name', symbol)
            sector = overview_data.get('Sector', 'Unknown')
            market_cap = self._safe_int(overview_data.get('MarketCapitalization'))
            pe_ratio = self._safe_decimal(overview_data.get('PERatio'))
        else:
            # Fallback if overview is not available
            name = symbol
            sector = 'Unknown'
            market_cap = None
            pe_ratio = None
        
        return Stock(
            symbol=symbol.upper(),
            current_price=current_price,
            name=name,
            sector=sector,
            market_cap=market_cap,
            pe_ratio=pe_ratio
        )
    
    def _safe_int(self, value) -> Optional[int]:
        """Safely convert to int with None fallback"""
        try:
            if value and value != 'None' and value != '-':
                return int(float(value))
        except:
            pass
        return None
    
    def _safe_decimal(self, value) -> Optional[Decimal]:
        """Safely convert to Decimal with None fallback"""
        try:
            if value and value != 'None' and value != '-':
                return Decimal(str(value))
        except:
            pass
        return None

