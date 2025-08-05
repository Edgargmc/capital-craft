"""
📁 FILE: tests/unit/test_get_stock_use_case.py

Fixed test with proper dependency injection
"""
import pytest
from unittest.mock import Mock

from app.use_cases.get_stock_data import GetStockDataUseCase
from app.core.entities.stock import Stock
from app.core.interfaces.stock_data_provider import StockDataProvider


def test_get_stock_data_success():
    """Test successful stock data retrieval"""
    # Create mock provider
    mock_provider = Mock(spec=StockDataProvider)
    
    # Setup mock return value
    expected_stock = Stock(
        symbol="AAPL",
        name="Apple Inc.",
        current_price=150.0,
        sector="Technology"
    )
    mock_provider.get_stock_data.return_value = expected_stock
    
    # Create use case with injected provider - FIX HERE
    use_case = GetStockDataUseCase(stock_data_provider=mock_provider)
    
    # Execute
    result = use_case.execute("AAPL")
    
    # Verify
    assert result == expected_stock
    mock_provider.get_stock_data.assert_called_once_with("AAPL")


def test_get_stock_data_not_found():
    """Test stock not found scenario"""
    # Create mock provider
    mock_provider = Mock(spec=StockDataProvider)
    
    # Setup mock to raise exception
    mock_provider.get_stock_data.side_effect = ValueError("Stock not found")
    
    # Create use case with injected provider - FIX HERE
    use_case = GetStockDataUseCase(stock_data_provider=mock_provider)
    
    # Execute and verify exception
    with pytest.raises(ValueError, match="Stock not found"):
        use_case.execute("INVALID")
    
    mock_provider.get_stock_data.assert_called_once_with("INVALID")