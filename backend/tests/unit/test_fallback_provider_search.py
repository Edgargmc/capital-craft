"""
📁 FILE: tests/unit/test_fallback_provider_search.py

Unit tests for FallbackProvider search_stocks method - Critical for system robustness
"""
import pytest
from unittest.mock import Mock

from app.infrastructure.providers.fallback_provider import FallbackProvider
from app.core.entities.stock import Stock
from app.core.interfaces.stock_data_provider import StockDataProvider
from decimal import Decimal


def test_fallback_provider_search_first_provider_success():
    """Test fallback provider returns results from first successful provider"""
    # Create mock providers
    provider1 = Mock(spec=StockDataProvider)
    provider2 = Mock(spec=StockDataProvider)
    provider3 = Mock(spec=StockDataProvider)
    
    # Setup: First provider succeeds
    expected_results = [
        Stock(symbol="AAPL", name="Apple Inc.", current_price=Decimal("185.50"), sector="Technology"),
        Stock(symbol="AMZN", name="Amazon.com Inc.", current_price=Decimal("151.25"), sector="Consumer Discretionary")
    ]
    provider1.search_stocks.return_value = expected_results
    provider2.search_stocks.return_value = []  # Should not be called
    provider3.search_stocks.return_value = []  # Should not be called
    
    # Create fallback provider
    fallback = FallbackProvider([provider1, provider2, provider3])
    
    # Execute
    result = fallback.search_stocks("apple", 5)
    
    # Verify
    assert result == expected_results
    assert len(result) == 2
    
    # Verify only first provider was called
    provider1.search_stocks.assert_called_once_with("apple", 5)
    provider2.search_stocks.assert_not_called()
    provider3.search_stocks.assert_not_called()


def test_fallback_provider_search_first_fails_second_succeeds():
    """Test fallback to second provider when first fails"""
    # Create mock providers
    provider1 = Mock(spec=StockDataProvider)
    provider2 = Mock(spec=StockDataProvider)
    provider3 = Mock(spec=StockDataProvider)
    
    # Setup: First provider fails, second succeeds
    provider1.search_stocks.side_effect = Exception("Provider 1 unavailable")
    expected_results = [
        Stock(symbol="MSFT", name="Microsoft Corporation", current_price=Decimal("415.20"), sector="Technology")
    ]
    provider2.search_stocks.return_value = expected_results
    provider3.search_stocks.return_value = []  # Should not be called
    
    # Create fallback provider
    fallback = FallbackProvider([provider1, provider2, provider3])
    
    # Execute
    result = fallback.search_stocks("microsoft", 3)
    
    # Verify
    assert result == expected_results
    assert len(result) == 1
    assert result[0].symbol == "MSFT"
    
    # Verify fallback behavior
    provider1.search_stocks.assert_called_once_with("microsoft", 3)
    provider2.search_stocks.assert_called_once_with("microsoft", 3)
    provider3.search_stocks.assert_not_called()


def test_fallback_provider_search_first_empty_second_has_results():
    """Test fallback when first provider returns empty results"""
    # Create mock providers
    provider1 = Mock(spec=StockDataProvider)
    provider2 = Mock(spec=StockDataProvider)
    
    # Setup: First provider returns empty, second has results
    provider1.search_stocks.return_value = []
    expected_results = [
        Stock(symbol="TSLA", name="Tesla Inc.", current_price=Decimal("248.75"), sector="Consumer Discretionary")
    ]
    provider2.search_stocks.return_value = expected_results
    
    # Create fallback provider
    fallback = FallbackProvider([provider1, provider2])
    
    # Execute
    result = fallback.search_stocks("tesla", 5)
    
    # Verify
    assert result == expected_results
    
    # Both providers should be called
    provider1.search_stocks.assert_called_once_with("tesla", 5)
    provider2.search_stocks.assert_called_once_with("tesla", 5)


def test_fallback_provider_search_all_providers_fail():
    """Test behavior when all providers fail"""
    # Create mock providers
    provider1 = Mock(spec=StockDataProvider)
    provider2 = Mock(spec=StockDataProvider)
    provider3 = Mock(spec=StockDataProvider)
    
    # Setup: All providers fail
    provider1.search_stocks.side_effect = Exception("Provider 1 down")
    provider2.search_stocks.side_effect = Exception("Provider 2 timeout")
    provider3.search_stocks.side_effect = Exception("Provider 3 error")
    
    # Create fallback provider
    fallback = FallbackProvider([provider1, provider2, provider3])
    
    # Execute
    result = fallback.search_stocks("query", 10)
    
    # Verify: Should return empty list when all fail
    assert result == []
    
    # All providers should have been attempted
    provider1.search_stocks.assert_called_once_with("query", 10)
    provider2.search_stocks.assert_called_once_with("query", 10)
    provider3.search_stocks.assert_called_once_with("query", 10)


def test_fallback_provider_search_all_providers_empty():
    """Test behavior when all providers return empty results"""
    # Create mock providers
    provider1 = Mock(spec=StockDataProvider)
    provider2 = Mock(spec=StockDataProvider)
    
    # Setup: All providers return empty
    provider1.search_stocks.return_value = []
    provider2.search_stocks.return_value = []
    
    # Create fallback provider
    fallback = FallbackProvider([provider1, provider2])
    
    # Execute
    result = fallback.search_stocks("nonexistent", 5)
    
    # Verify
    assert result == []
    
    # All providers should be called
    provider1.search_stocks.assert_called_once_with("nonexistent", 5)
    provider2.search_stocks.assert_called_once_with("nonexistent", 5)


def test_fallback_provider_search_mixed_failures_and_empty():
    """Test complex scenario with mix of failures and empty results"""
    # Create mock providers
    provider1 = Mock(spec=StockDataProvider)
    provider2 = Mock(spec=StockDataProvider)
    provider3 = Mock(spec=StockDataProvider)
    provider4 = Mock(spec=StockDataProvider)
    
    # Setup complex scenario
    provider1.search_stocks.side_effect = Exception("Network error")
    provider2.search_stocks.return_value = []  # Empty results
    provider3.search_stocks.side_effect = Exception("API rate limit")
    expected_results = [
        Stock(symbol="NVDA", name="NVIDIA Corporation", current_price=Decimal("875.30"), sector="Technology")
    ]
    provider4.search_stocks.return_value = expected_results
    
    # Create fallback provider
    fallback = FallbackProvider([provider1, provider2, provider3, provider4])
    
    # Execute
    result = fallback.search_stocks("nvidia", 3)
    
    # Verify
    assert result == expected_results
    assert len(result) == 1
    assert result[0].symbol == "NVDA"
    
    # All providers should have been attempted until success
    provider1.search_stocks.assert_called_once_with("nvidia", 3)
    provider2.search_stocks.assert_called_once_with("nvidia", 3)
    provider3.search_stocks.assert_called_once_with("nvidia", 3)
    provider4.search_stocks.assert_called_once_with("nvidia", 3)


def test_fallback_provider_search_no_providers_error():
    """Test error handling when no providers are configured"""
    # This should raise error during construction
    with pytest.raises(ValueError, match="At least one provider must be specified"):
        FallbackProvider([])


def test_fallback_provider_search_single_provider():
    """Test fallback provider works with single provider"""
    # Create single mock provider
    provider = Mock(spec=StockDataProvider)
    expected_results = [
        Stock(symbol="META", name="Meta Platforms Inc.", current_price=Decimal("502.15"), sector="Technology")
    ]
    provider.search_stocks.return_value = expected_results
    
    # Create fallback provider with single provider
    fallback = FallbackProvider([provider])
    
    # Execute
    result = fallback.search_stocks("meta", 5)
    
    # Verify
    assert result == expected_results
    provider.search_stocks.assert_called_once_with("meta", 5)


def test_fallback_provider_search_preserves_parameters():
    """Test that query and limit parameters are correctly passed to all providers"""
    # Create mock providers
    provider1 = Mock(spec=StockDataProvider)
    provider2 = Mock(spec=StockDataProvider)
    
    # Setup: First fails, second succeeds
    provider1.search_stocks.side_effect = Exception("Provider 1 error")
    provider2.search_stocks.return_value = []
    
    # Create fallback provider
    fallback = FallbackProvider([provider1, provider2])
    
    # Execute with specific parameters
    query = "specific_query"
    limit = 7
    fallback.search_stocks(query, limit)
    
    # Verify parameters are preserved across fallbacks
    provider1.search_stocks.assert_called_once_with(query, limit)
    provider2.search_stocks.assert_called_once_with(query, limit)


def test_fallback_provider_search_realistic_scenario():
    """Test realistic scenario: Alpha Vantage → Yahoo Finance → Mock fallback"""
    # Simulate real-world provider scenario
    alpha_vantage = Mock()
    alpha_vantage.__class__.__name__ = "AlphaVantageProvider"
    yahoo_finance = Mock()  
    yahoo_finance.__class__.__name__ = "YahooFinanceProvider"
    mock_provider = Mock()
    mock_provider.__class__.__name__ = "MockStockDataProvider"
    
    # Setup: Alpha Vantage fails (rate limit), Yahoo has limited results, Mock works
    alpha_vantage.search_stocks.side_effect = Exception("API rate limit exceeded")
    yahoo_finance.search_stocks.return_value = []  # Limited search capability
    mock_results = [
        Stock(symbol="AAPL", name="Apple Inc.", current_price=Decimal("185.50"), sector="Technology"),
        Stock(symbol="GOOGL", name="Alphabet Inc.", current_price=Decimal("138.75"), sector="Technology")
    ]
    mock_provider.search_stocks.return_value = mock_results
    
    # Create fallback provider
    fallback = FallbackProvider([alpha_vantage, yahoo_finance, mock_provider])
    
    # Execute
    result = fallback.search_stocks("tech", 10)
    
    # Verify mock provider was used as final fallback
    assert result == mock_results
    assert len(result) == 2
    
    # All providers should have been attempted
    alpha_vantage.search_stocks.assert_called_once_with("tech", 10)
    yahoo_finance.search_stocks.assert_called_once_with("tech", 10)
    mock_provider.search_stocks.assert_called_once_with("tech", 10)