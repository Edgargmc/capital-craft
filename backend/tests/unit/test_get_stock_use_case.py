import pytest
from unittest.mock import Mock, patch
from decimal import Decimal
from app.use_cases.get_stock_data import GetStockDataUseCase

def test_get_stock_data_success():
    # Arrange
    use_case = GetStockDataUseCase()
    
    # Mock yfinance de forma más simple
    mock_ticker = Mock()
    mock_hist = Mock()
    mock_hist.empty = False
    
    # Configurar el mock para iloc[-1]
    mock_close = Mock()
    mock_close.iloc = Mock()
    mock_close.iloc.__getitem__ = Mock(return_value=150.00)
    mock_hist.__getitem__ = Mock(return_value=mock_close)
    
    mock_ticker.history.return_value = mock_hist
    mock_ticker.info = {
        'longName': 'Apple Inc.',
        'sector': 'Technology'
    }
    
    # Act & Assert
    with patch('yfinance.Ticker', return_value=mock_ticker):
        stock = use_case.execute("AAPL")
        
        assert stock.symbol == "AAPL"
        assert stock.name == "Apple Inc."
        assert stock.sector == "Technology"

def test_get_stock_data_not_found():
    # Arrange
    use_case = GetStockDataUseCase()
    
    # Mock empty response
    mock_ticker = Mock()
    mock_hist = Mock()
    mock_hist.empty = True
    mock_ticker.history.return_value = mock_hist
    
    # Act & Assert
    with patch('yfinance.Ticker', return_value=mock_ticker):
        with pytest.raises(ValueError):
            use_case.execute("INVALID")