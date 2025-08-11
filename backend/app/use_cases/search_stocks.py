from typing import List
from app.core.entities.stock import Stock
from app.core.interfaces.stock_data_provider import StockDataProvider

class SearchStocksUseCase:
    """
    Use case for searching stocks by symbol or company name
    
    This use case follows Clean Architecture principles by:
    - Depending on StockDataProvider abstraction (Dependency Inversion)
    - Encapsulating business logic for stock search
    - Being provider-agnostic (works with Yahoo, Alpha Vantage, Mock)
    
    Args:
        stock_data_provider: Injected provider for stock data operations
        
    Example:
        >>> use_case = SearchStocksUseCase(yahoo_provider)
        >>> results = use_case.execute("appl", limit=5)
        >>> # Returns [Stock(symbol="AAPL", name="Apple Inc.", ...), ...]
    """
    
    def __init__(self, stock_data_provider: StockDataProvider):
        self._stock_data_provider = stock_data_provider
    
    def execute(self, query: str, limit: int = 10) -> List[Stock]:
        """
        Execute stock search with business logic validation
        
        Args:
            query: Search query (symbol or company name)
            limit: Maximum number of results to return (default: 10, max: 50)
            
        Returns:
            List[Stock]: List of matching stocks with complete data
            
        Raises:
            ValueError: If query is empty or limit is invalid
            
        Business Rules:
        - Query must be at least 1 character
        - Limit must be between 1 and 50
        - Results are sorted by relevance (exact symbol match first)
        """
        # Input validation
        if not query or not query.strip():
            raise ValueError("Search query cannot be empty")
            
        query = query.strip()
        
        if limit < 1 or limit > 50:
            raise ValueError("Limit must be between 1 and 50")
        
        # Execute search through provider
        return self._stock_data_provider.search_stocks(query, limit)