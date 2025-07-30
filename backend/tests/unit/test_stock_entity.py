import pytest
from decimal import Decimal
from app.core.entities.stock import Stock

def test_create_stock():
    # Arrange
    symbol = "AAPL"
    price = Decimal("150.00")
    name = "Apple Inc."
    sector = "Technology"
    
    # Act
    stock = Stock(symbol, price, name, sector)
    
    # Assert
    assert stock.symbol == "AAPL"
    assert stock.current_price == Decimal("150.00")
    assert stock.name == "Apple Inc."
    assert stock.sector == "Technology"

def test_stock_symbol_uppercase():
    # Act
    stock = Stock("aapl", Decimal("150.00"))
    
    # Assert
    assert stock.symbol == "AAPL"

def test_negative_price_raises_error():
    # Act & Assert
    with pytest.raises(ValueError):
        Stock("AAPL", Decimal("-10.00"))