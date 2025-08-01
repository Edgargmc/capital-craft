# Update alpha_vantage_provider.py with debug logging
# app/infrastructure/providers/alpha_vantage_provider.py

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
        """Enhanced mapping to Stock entity with all valuable fields"""
        
        print(f"\n🗺️  MAPPING DATA TO ENHANCED STOCK ENTITY for {symbol}")
        
        # Extract price from quote data
        price_key = "05. price"
        if price_key not in quote_data:
            raise ValueError(f"Price data not available for {symbol}")
        
        current_price = Decimal(quote_data[price_key])
        print(f"💰 Extracted price: {current_price}")
        
        # Extract ALL valuable data from overview
        if overview_data:
            name = overview_data.get('Name', symbol)
            sector = overview_data.get('Sector', 'Unknown')
            
            # Core valuation
            market_cap = self._safe_int(overview_data.get('MarketCapitalization'))
            pe_ratio = self._safe_decimal(overview_data.get('PERatio'))
            
            # 🎯 Fundamental metrics
            eps = self._safe_decimal(overview_data.get('EPS'))
            book_value = self._safe_decimal(overview_data.get('BookValue'))
            price_to_book = self._safe_decimal(overview_data.get('PriceToBookRatio'))
            profit_margin = self._safe_decimal(overview_data.get('ProfitMargin'))
            
            # 🎯 Dividend data
            dividend_yield = self._safe_decimal(overview_data.get('DividendYield'))
            dividend_per_share = self._safe_decimal(overview_data.get('DividendPerShare'))
            
            # 🎯 Risk & technical
            week_52_high = self._safe_decimal(overview_data.get('52WeekHigh'))
            week_52_low = self._safe_decimal(overview_data.get('52WeekLow'))
            beta = self._safe_decimal(overview_data.get('Beta'))
            
            # 🎯 Growth metrics
            earnings_growth_yoy = self._safe_decimal(overview_data.get('QuarterlyEarningsGrowthYOY'))
            revenue_growth_yoy = self._safe_decimal(overview_data.get('QuarterlyRevenueGrowthYOY'))
            
            # 🎯 Analyst data
            analyst_target_price = self._safe_decimal(overview_data.get('AnalystTargetPrice'))
            analyst_rating_buy = self._safe_int(overview_data.get('AnalystRatingBuy'))
            analyst_rating_hold = self._safe_int(overview_data.get('AnalystRatingHold'))
            analyst_rating_sell = self._safe_int(overview_data.get('AnalystRatingSell'))
            
            print(f"🏷️  Extracted enhanced data:")
            print(f"   EPS: {eps}")
            print(f"   Dividend Yield: {dividend_yield}")
            print(f"   52W High/Low: {week_52_high}/{week_52_low}")
            print(f"   Beta: {beta}")
            print(f"   Analyst Target: {analyst_target_price}")
            print(f"   Buy/Hold/Sell: {analyst_rating_buy}/{analyst_rating_hold}/{analyst_rating_sell}")
            
        else:
            # Fallback if overview is not available
            name = symbol
            sector = 'Unknown'
            market_cap = pe_ratio = eps = book_value = price_to_book = profit_margin = None
            dividend_yield = dividend_per_share = week_52_high = week_52_low = beta = None
            earnings_growth_yoy = revenue_growth_yoy = analyst_target_price = None
            analyst_rating_buy = analyst_rating_hold = analyst_rating_sell = None
            
            print(f"⚠️  Using fallback data (no overview)")
        
        enhanced_stock = Stock(
            # Core fields
            symbol=symbol.upper(),
            current_price=current_price,
            name=name,
            sector=sector,
            market_cap=market_cap,
            pe_ratio=pe_ratio,
            
            # 🎯 Enhanced fields
            eps=eps,
            book_value=book_value,
            price_to_book=price_to_book,
            profit_margin=profit_margin,
            dividend_yield=dividend_yield,
            dividend_per_share=dividend_per_share,
            week_52_high=week_52_high,
            week_52_low=week_52_low,
            beta=beta,
            earnings_growth_yoy=earnings_growth_yoy,
            revenue_growth_yoy=revenue_growth_yoy,
            analyst_target_price=analyst_target_price,
            analyst_rating_buy=analyst_rating_buy,
            analyst_rating_hold=analyst_rating_hold,
            analyst_rating_sell=analyst_rating_sell
        )
        
        print(f"✅ ENHANCED STOCK ENTITY CREATED:")
        print(f"   Dividend Stock: {enhanced_stock.is_dividend_stock}")
        print(f"   52W Position: {enhanced_stock.current_vs_52week_range}")
        print(f"   Analyst Sentiment: {enhanced_stock.analyst_sentiment}")
        print(f"   Upside Potential: {enhanced_stock.upside_potential}")
        print("=" * 60)
        
        return enhanced_stock
    
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
    