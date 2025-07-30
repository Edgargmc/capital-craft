from dataclasses import dataclass
from decimal import Decimal
from typing import Optional

@dataclass
class Stock:
    symbol: str
    current_price: Decimal
    name: str = ""
    sector: str = ""
    market_cap: Optional[int] = None
    pe_ratio: Optional[Decimal] = None
    
    def __post_init__(self):
        self.symbol = self.symbol.upper()
        if self.current_price <= 0:
            raise ValueError("Price must be positive")