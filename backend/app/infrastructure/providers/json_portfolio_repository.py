"""
JSON Portfolio Repository Implementation

@description JSON file-based persistence for portfolios following Clean Architecture
@layer Infrastructure
@pattern Repository Pattern with JSON file storage per user
@dependencies Core entities, Repository interface, JSON, threading

Features:
- Thread-safe file operations per user
- Automatic data directory creation
- Error recovery mechanisms
- Individual files per user (portfolios_user1.json, portfolios_user2.json)

@author Capital Craft Team
@created 2025-01-15
"""
import json
import os
import asyncio
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any
from threading import Lock
from pathlib import Path

from ...core.entities.portfolio import Portfolio, Holding
from ...core.interfaces.portfolio_repository import PortfolioRepository


class JsonPortfolioRepository(PortfolioRepository):
    """
    JSON file-based portfolio repository implementation
    
    @description Provides persistent storage using individual JSON files per user
    @layer Infrastructure
    @pattern Repository Pattern
    
    Features:
    - One JSON file per user: data/portfolios_user1.json
    - Thread-safe file operations with file locking
    - Automatic backup and error recovery
    - Decimal precision preserved in JSON
    """
    
    def __init__(self, data_directory: str = "data"):
        """
        Initialize JSON repository with data directory
        
        @param data_directory Directory to store JSON files
        """
        self.data_directory = Path(data_directory)
        self._file_locks: Dict[str, Lock] = {}  # One lock per user file
        self._ensure_data_directory()
    
    def _ensure_data_directory(self) -> None:
        """Ensure data directory exists"""
        self.data_directory.mkdir(parents=True, exist_ok=True)
        print(f"✅ Portfolio JSON data directory ensured: {self.data_directory}")
    
    def _get_file_path(self, user_id: str) -> Path:
        """Get JSON file path for specific user"""
        return self.data_directory / f"portfolios_{user_id}.json"
    
    def _get_file_lock(self, user_id: str) -> Lock:
        """Get or create file lock for specific user (thread-safe)"""
        if user_id not in self._file_locks:
            self._file_locks[user_id] = Lock()
        return self._file_locks[user_id]
    
    def _portfolio_to_dict(self, portfolio: Portfolio) -> Dict[str, Any]:
        """Convert Portfolio entity to JSON-serializable dict"""
        return {
            "user_id": portfolio.user_id,
            "cash_balance": str(portfolio.cash_balance),  # Preserve Decimal precision
            "holdings": {
                symbol: {
                    "symbol": holding.symbol,
                    "shares": holding.shares,
                    "average_price": str(holding.average_price)  # Preserve Decimal precision
                }
                for symbol, holding in portfolio.holdings.items()
            },
            "created_at": portfolio.created_at.isoformat(),
            "updated_at": datetime.utcnow().isoformat()  # Track when saved
        }
    
    def _dict_to_portfolio(self, data: Dict[str, Any]) -> Portfolio:
        """Convert JSON dict back to Portfolio entity"""
        holdings = {}
        for symbol, holding_data in data.get("holdings", {}).items():
            holdings[symbol] = Holding(
                symbol=holding_data["symbol"],
                shares=holding_data["shares"],
                average_price=Decimal(holding_data["average_price"])
            )
        
        return Portfolio(
            user_id=data["user_id"],
            cash_balance=Decimal(data["cash_balance"]),
            holdings=holdings,
            created_at=datetime.fromisoformat(data["created_at"])
        )
    
    def _load_portfolio_from_file(self, user_id: str) -> Optional[Portfolio]:
        """Load portfolio from JSON file (thread-safe)"""
        file_path = self._get_file_path(user_id)
        
        if not file_path.exists():
            return None
        
        lock = self._get_file_lock(user_id)
        
        try:
            with lock:
                with open(file_path, 'r') as file:
                    data = json.load(file)
                    return self._dict_to_portfolio(data)
        except (json.JSONDecodeError, KeyError, FileNotFoundError) as e:
            print(f"⚠️ Error loading portfolio for {user_id}: {e}")
            return None
        except Exception as e:
            print(f"❌ Unexpected error loading portfolio for {user_id}: {e}")
            return None
    
    def _save_portfolio_to_file(self, portfolio: Portfolio) -> bool:
        """Save portfolio to JSON file (thread-safe)"""
        file_path = self._get_file_path(portfolio.user_id)
        lock = self._get_file_lock(portfolio.user_id)
        
        try:
            with lock:
                # Create backup if file exists
                if file_path.exists():
                    backup_path = file_path.with_suffix('.json.backup')
                    file_path.rename(backup_path)
                
                # Write new data
                data = self._portfolio_to_dict(portfolio)
                with open(file_path, 'w') as file:
                    json.dump(data, file, indent=2, ensure_ascii=False)
                
                # Remove backup on success
                backup_path = file_path.with_suffix('.json.backup')
                if backup_path.exists():
                    backup_path.unlink()
                
                print(f"✅ Portfolio saved for user {portfolio.user_id}")
                return True
                
        except Exception as e:
            print(f"❌ Error saving portfolio for {portfolio.user_id}: {e}")
            
            # Try to restore backup
            backup_path = file_path.with_suffix('.json.backup')
            if backup_path.exists():
                backup_path.rename(file_path)
                print(f"🔄 Restored backup for {portfolio.user_id}")
            
            return False
    
    # Repository Interface Implementation
    
    async def get_portfolio(self, user_id: str) -> Optional[Portfolio]:
        """Retrieve portfolio for a user from JSON file"""
        # Run file I/O in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._load_portfolio_from_file, user_id)
    
    async def save_portfolio(self, portfolio: Portfolio) -> Portfolio:
        """Save or update a portfolio to JSON file"""
        # Run file I/O in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        success = await loop.run_in_executor(None, self._save_portfolio_to_file, portfolio)
        
        if not success:
            raise RuntimeError(f"Failed to save portfolio for user {portfolio.user_id}")
        
        return portfolio
    
    async def portfolio_exists(self, user_id: str) -> bool:
        """Check if portfolio exists for user"""
        file_path = self._get_file_path(user_id)
        return file_path.exists()
    
    # Synchronous versions for backward compatibility
    
    def get_portfolio_sync(self, user_id: str) -> Optional[Portfolio]:
        """Sync version of get_portfolio"""
        return self._load_portfolio_from_file(user_id)
    
    def save_portfolio_sync(self, portfolio: Portfolio) -> Portfolio:
        """Sync version of save_portfolio"""
        success = self._save_portfolio_to_file(portfolio)
        if not success:
            raise RuntimeError(f"Failed to save portfolio for user {portfolio.user_id}")
        return portfolio
    
    def portfolio_exists_sync(self, user_id: str) -> bool:
        """Sync version of portfolio_exists"""
        file_path = self._get_file_path(user_id)
        return file_path.exists()