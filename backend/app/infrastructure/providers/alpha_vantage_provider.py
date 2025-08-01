
import requests
import time
import json  # Add for pretty printing
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
            print(f"\n🚀 FETCHING DATA FOR: {symbol}")
            
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
        print(f"📊 Fetching QUOTE data for {symbol}...")
        
        params = {
            'function': 'GLOBAL_QUOTE',
            'symbol': symbol,
            'apikey': self.api_key
        }
        
        response = requests.get(self.base_url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # 🔍 DEBUG: Print full quote response
        print(f"📈 QUOTE API RESPONSE for {symbol}:")
        print("=" * 50)
        print(json.dumps(data, indent=2))
        print("=" * 50)
        
        # Check for API errors
        if 'Error Message' in data:
            raise ValueError(f"Invalid API call: {data['Error Message']}")
        
        if 'Note' in data:
            raise ValueError(f"API call frequency: {data['Note']}")
        
        # Check if quote data exists
        if 'Global Quote' not in data or not data['Global Quote']:
            raise ValueError(f"No quote data found for {symbol}")
        
        quote = data['Global Quote']
        print(f"📊 EXTRACTED QUOTE DATA:")
        print(json.dumps(quote, indent=2))
        
        return quote
    
    def _get_company_overview(self, symbol: str) -> Optional[dict]:
        """Get company overview data from Alpha Vantage"""
        print(f"🏢 Fetching OVERVIEW data for {symbol}...")
        
        try:
            params = {
                'function': 'OVERVIEW',
                'symbol': symbol,
                'apikey': self.api_key
            }
            
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # 🔍 DEBUG: Print full overview response
            print(f"🏢 OVERVIEW API RESPONSE for {symbol}:")
            print("=" * 50)
            print(json.dumps(data, indent=2))
            print("=" * 50)
            
            # Check for errors (but don't fail if overview is not available)
            if 'Error Message' in data or 'Note' in data or not data:
                print(f"⚠️  Overview data not available for {symbol}")
                return None
            
            print(f"✅ Overview data available for {symbol}")
            return data
            
        except Exception as e:
            print(f"❌ Overview fetch failed for {symbol}: {str(e)}")
            # If overview fails, continue without it
            return None
    
    def _map_to_stock(self, symbol: str, quote_data: dict, overview_data: Optional[dict]) -> Stock:
        """Map Alpha Vantage response to Stock entity"""
        
        print(f"\n🗺️  MAPPING DATA TO STOCK ENTITY for {symbol}")
        print(f"Quote keys available: {list(quote_data.keys())}")
        if overview_data:
            print(f"Overview keys available: {list(overview_data.keys())}")
        
        # Extract price from quote data
        # Alpha Vantage returns: "05. price": "185.43"
        price_key = "05. price"
        if price_key not in quote_data:
            print(f"❌ Price key '{price_key}' not found in quote data")
            print(f"Available keys: {list(quote_data.keys())}")
            raise ValueError(f"Price data not available for {symbol}")
        
        current_price = Decimal(quote_data[price_key])
        print(f"💰 Extracted price: {current_price}")
        
        # Extract company data from overview (with fallbacks)
        if overview_data:
            name = overview_data.get('Name', symbol)
            sector = overview_data.get('Sector', 'Unknown')
            market_cap = self._safe_int(overview_data.get('MarketCapitalization'))
            pe_ratio = self._safe_decimal(overview_data.get('PERatio'))
            
            print(f"🏷️  Extracted from overview:")
            print(f"   Name: {name}")
            print(f"   Sector: {sector}")
            print(f"   Market Cap: {market_cap}")
            print(f"   PE Ratio: {pe_ratio}")
        else:
            # Fallback if overview is not available
            name = symbol
            sector = 'Unknown'
            market_cap = None
            pe_ratio = None
            
            print(f"⚠️  Using fallback data (no overview)")
        
        final_stock = Stock(
            symbol=symbol.upper(),
            current_price=current_price,
            name=name,
            sector=sector,
            market_cap=market_cap,
            pe_ratio=pe_ratio
        )
        
        print(f"✅ FINAL STOCK ENTITY:")
        print(f"   Symbol: {final_stock.symbol}")
        print(f"   Price: {final_stock.current_price}")
        print(f"   Name: {final_stock.name}")
        print(f"   Sector: {final_stock.sector}")
        print(f"   Market Cap: {final_stock.market_cap}")
        print(f"   PE Ratio: {final_stock.pe_ratio}")
        print("=" * 60)
        
        return final_stock
    
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