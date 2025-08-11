"""
📁 FILE: tests/unit/test_search_stocks_use_case.py

Unit tests for SearchStocksUseCase following Clean Architecture principles
"""
import pytest
from unittest.mock import Mock

from app.use_cases.search_stocks import SearchStocksUseCase
from app.core.entities.stock import Stock
from app.core.interfaces.stock_data_provider import StockDataProvider
from decimal import Decimal


def test_search_stocks_success():
    """Test successful stock search with multiple results"""
    # Create mock provider
    mock_provider = Mock(spec=StockDataProvider)
    
    # Setup mock return value with realistic stock data
    expected_stocks = [
        Stock(
            symbol="AAPL",
            name="Apple Inc.",
            current_price=Decimal("185.50"),
            sector="Technology"
        ),
        Stock(
            symbol="AMZN", 
            name="Amazon.com Inc.",
            current_price=Decimal("151.25"),
            sector="Consumer Discretionary"
        )
    ]
    mock_provider.search_stocks.return_value = expected_stocks
    
    # Create use case with injected provider
    use_case = SearchStocksUseCase(stock_data_provider=mock_provider)
    
    # Execute
    result = use_case.execute("app", limit=5)
    
    # Verify
    assert result == expected_stocks
    assert len(result) == 2
    assert result[0].symbol == "AAPL"
    assert result[1].symbol == "AMZN"
    mock_provider.search_stocks.assert_called_once_with("app", 5)


def test_search_stocks_empty_query_validation():
    """Test validation for empty query"""
    mock_provider = Mock(spec=StockDataProvider)
    use_case = SearchStocksUseCase(stock_data_provider=mock_provider)
    
    # Test empty string
    with pytest.raises(ValueError, match="Search query cannot be empty"):
        use_case.execute("")
    
    # Test whitespace only
    with pytest.raises(ValueError, match="Search query cannot be empty"):
        use_case.execute("   ")
    
    # Test None-like input
    with pytest.raises(ValueError, match="Search query cannot be empty"):
        use_case.execute(None)  # type: ignore
    
    # Verify provider was never called
    mock_provider.search_stocks.assert_not_called()


def test_search_stocks_limit_validation():
    """Test validation for limit parameter"""
    mock_provider = Mock(spec=StockDataProvider)
    use_case = SearchStocksUseCase(stock_data_provider=mock_provider)
    
    # Test limit too small
    with pytest.raises(ValueError, match="Limit must be between 1 and 50"):
        use_case.execute("AAPL", limit=0)
    
    # Test limit too large
    with pytest.raises(ValueError, match="Limit must be between 1 and 50"):
        use_case.execute("AAPL", limit=51)
    
    # Test negative limit
    with pytest.raises(ValueError, match="Limit must be between 1 and 50"):
        use_case.execute("AAPL", limit=-1)
    
    # Verify provider was never called
    mock_provider.search_stocks.assert_not_called()


def test_search_stocks_valid_limits():
    """Test that valid limit values work correctly"""
    mock_provider = Mock(spec=StockDataProvider)
    mock_provider.search_stocks.return_value = []
    use_case = SearchStocksUseCase(stock_data_provider=mock_provider)
    
    # Test minimum valid limit
    use_case.execute("AAPL", limit=1)
    mock_provider.search_stocks.assert_called_with("AAPL", 1)
    
    # Test maximum valid limit
    use_case.execute("AAPL", limit=50)
    mock_provider.search_stocks.assert_called_with("AAPL", 50)
    
    # Test default limit
    use_case.execute("AAPL")
    mock_provider.search_stocks.assert_called_with("AAPL", 10)


def test_search_stocks_query_trimming():
    """Test that query whitespace is trimmed properly"""
    mock_provider = Mock(spec=StockDataProvider)
    mock_provider.search_stocks.return_value = []
    use_case = SearchStocksUseCase(stock_data_provider=mock_provider)
    
    # Test query with leading/trailing spaces
    use_case.execute("  AAPL  ", limit=5)
    
    # Verify trimmed query is passed to provider
    mock_provider.search_stocks.assert_called_once_with("AAPL", 5)


def test_search_stocks_no_results():
    """Test handling of empty search results"""
    mock_provider = Mock(spec=StockDataProvider)
    mock_provider.search_stocks.return_value = []
    use_case = SearchStocksUseCase(stock_data_provider=mock_provider)
    
    result = use_case.execute("INVALID_SYMBOL", limit=10)
    
    assert result == []
    assert len(result) == 0
    mock_provider.search_stocks.assert_called_once_with("INVALID_SYMBOL", 10)


def test_search_stocks_provider_exception_propagation():
    """Test that provider exceptions are properly propagated"""
    mock_provider = Mock(spec=StockDataProvider)
    mock_provider.search_stocks.side_effect = Exception("Provider unavailable")
    use_case = SearchStocksUseCase(stock_data_provider=mock_provider)
    
    with pytest.raises(Exception, match="Provider unavailable"):
        use_case.execute("AAPL")
    
    mock_provider.search_stocks.assert_called_once_with("AAPL", 10)


def test_search_stocks_single_result():
    """Test search returning exactly one result"""
    mock_provider = Mock(spec=StockDataProvider)
    expected_stock = Stock(
        symbol="GOOGL",
        name="Alphabet Inc.",
        current_price=Decimal("138.75"),
        sector="Technology"
    )
    mock_provider.search_stocks.return_value = [expected_stock]
    
    use_case = SearchStocksUseCase(stock_data_provider=mock_provider)
    result = use_case.execute("google")
    
    assert len(result) == 1
    assert result[0] == expected_stock
    assert result[0].symbol == "GOOGL"
    assert result[0].name == "Alphabet Inc."


def test_search_stocks_limit_applied():
    """Test that limit parameter is correctly applied"""
    mock_provider = Mock(spec=StockDataProvider)
    
    # Create 5 mock stocks
    mock_stocks = []
    for i in range(5):
        mock_stocks.append(Stock(
            symbol=f"STOCK{i}",
            name=f"Company {i}",
            current_price=Decimal("100.00"),
            sector="Technology"
        ))
    
    mock_provider.search_stocks.return_value = mock_stocks
    
    use_case = SearchStocksUseCase(stock_data_provider=mock_provider)
    result = use_case.execute("tech", limit=3)
    
    # Verify the provider was called with correct limit
    mock_provider.search_stocks.assert_called_once_with("tech", 3)
    
    # The actual limiting should be done by the provider
    # but we verify the use case passes the limit correctly
    assert len(result) == 5  # Provider returns all 5 in this mock


def test_search_stocks_case_sensitivity():
    """Test that search handles case variations properly"""
    mock_provider = Mock(spec=StockDataProvider)
    mock_provider.search_stocks.return_value = []
    
    use_case = SearchStocksUseCase(stock_data_provider=mock_provider)
    
    # Test various case combinations
    test_cases = ["AAPL", "aapl", "Apple", "APPLE", "aPpLe"]
    
    for query in test_cases:
        use_case.execute(query)
        # Verify query is passed as-is (case handling is provider responsibility)
        mock_provider.search_stocks.assert_called_with(query, 10)
        mock_provider.reset_mock()