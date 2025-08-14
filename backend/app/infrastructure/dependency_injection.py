"""
Dependency Injection Container for Notification System

@description Manages dependencies following SOLID principles and Clean Architecture
@layer Infrastructure
@pattern Dependency Injection Container
@dependencies Repository implementations, Use cases

@author Capital Craft Team
@created 2025-01-15
"""
import os
from typing import Dict, Any
from functools import lru_cache
from fastapi import Depends

from ..core.interfaces.notification_repository import NotificationRepository
from ..infrastructure.json_notification_repository import JSONNotificationRepository
from ..infrastructure.providers.mock_notification_repository import MockNotificationRepository
from ..infrastructure.repositories.postgresql_notification_repository import PostgreSQLNotificationRepository
from ..infrastructure.repositories.smart_notification_repository import SmartNotificationRepository
from ..use_cases.generate_notification import GenerateNotificationUseCase
from ..use_cases.mark_notification_as_read import MarkNotificationAsReadUseCase
from ..use_cases.dismiss_notification import DismissNotificationUseCase
from ..use_cases.mark_all_notifications_as_read import MarkAllNotificationsAsReadUseCase

# Portfolio Repository imports
from ..core.interfaces.portfolio_repository import PortfolioRepository
from ..infrastructure.providers.in_memory_portfolio_repository import InMemoryPortfolioRepository
from ..infrastructure.providers.json_portfolio_repository import JsonPortfolioRepository
from ..use_cases.get_or_create_portfolio import GetOrCreatePortfolioUseCase

# User Repository imports
from ..core.interfaces.user_repository import UserRepository
from ..infrastructure.repositories.postgres_user_repository import PostgresUserRepository
from ..use_cases.create_user import CreateUserUseCase
from ..use_cases.authenticate_user import AuthenticateUserUseCase
from ..infrastructure.database import get_db_session

# Stock Data Provider imports
from ..infrastructure.providers.provider_factory import ProviderFactory
from ..use_cases.buy_stock import BuyStock
from ..use_cases.sell_stock import SellStock
from ..use_cases.analyze_portfolio_risk import AnalyzePortfolioRisk


class DIContainer:
    """
    Dependency Injection Container
    
    @description Manages dependencies following SOLID principles
    @pattern Singleton + Factory
    
    Features:
    - Singleton instances for repositories
    - Factory pattern for use cases
    - Environment-based configuration
    - Easy testing with mock implementations
    """
    
    def __init__(self):
        self._dependencies: Dict[str, Any] = {}
        self._setup_repositories()
    
    def _setup_repositories(self) -> None:
        """Setup repository implementations based on environment"""
        
        self._setup_notification_repository()
        self._setup_portfolio_repository()
    
    def _setup_notification_repository(self) -> None:
        """Setup notification repository based on configuration"""
        # Check for mock repository first (testing)
        if os.getenv("USE_MOCK_REPOSITORY", "false").lower() == "true":
            print("🔧 Notification repository: MockNotificationRepository (testing)")
            self._dependencies["notification_repository"] = MockNotificationRepository()
            return
        
        # Check NOTIFICATION_STORAGE first - if PostgreSQL, use direct connection
        storage_type = os.getenv("NOTIFICATION_STORAGE", "json").lower()
        
        if storage_type == "postgres" or storage_type == "postgresql":
            # Force PostgreSQL storage when explicitly configured
            print("🔧 Notification repository: PostgreSQLNotificationRepository (database storage)")
            from ..infrastructure.database.config import DatabaseConfig
            db_config = DatabaseConfig()
            self._dependencies["notification_repository"] = PostgreSQLNotificationRepository(db_config)
            return
        
        # Check if smart repository is enabled (default: false for direct control)
        use_smart_repo = os.getenv("USE_SMART_NOTIFICATION_REPOSITORY", "false").lower() == "true"
        
        if use_smart_repo:
            # Smart repository with feature flag support
            print("🧠 Notification repository: SmartNotificationRepository (feature flag routing)")
            self._dependencies["notification_repository"] = SmartNotificationRepository()
            return
        
        # Legacy single-backend setup
        if storage_type == "json":
            # JSON file storage (original implementation)
            data_path = os.getenv("NOTIFICATION_DATA_PATH", "data/notifications.json")
            print(f"🔧 Notification repository: JSONNotificationRepository (path: {data_path})")
            self._dependencies["notification_repository"] = JSONNotificationRepository(data_path)
        else:
            # Default to JSON (safest option)
            print(f"🔧 Unknown NOTIFICATION_STORAGE '{storage_type}', using JSON")
            data_path = os.getenv("NOTIFICATION_DATA_PATH", "data/notifications.json")
            self._dependencies["notification_repository"] = JSONNotificationRepository(data_path)
    
    def _setup_portfolio_repository(self) -> None:
        """Setup portfolio repository based on configuration"""
        # Check environment variable for storage type
        # TEMPORARY: Default to postgres for testing (was "memory")
        storage_type = os.getenv("PORTFOLIO_STORAGE", "postgres").lower()
        
        if storage_type == "memory":
            # Use in-memory storage (no JSON files generated)
            self._dependencies["portfolio_repository"] = InMemoryPortfolioRepository()
            print(" Portfolio repository initialized: InMemoryPortfolioRepository (no files generated)")
        elif storage_type == "json":
            # JSON persistence (creates files)
            data_path = os.getenv("PORTFOLIO_DATA_PATH", "data")
            self._dependencies["portfolio_repository"] = JsonPortfolioRepository(data_path)
            print(f" Portfolio repository initialized: JsonPortfolioRepository (path: {data_path})")
        elif storage_type == "postgres":
            # NEW: PostgreSQL persistence (database storage)
            from ..infrastructure.providers.postgres_portfolio_repository import PostgresPortfolioRepository
            self._dependencies["portfolio_repository"] = PostgresPortfolioRepository()
            print(" Portfolio repository initialized: PostgresPortfolioRepository (database storage)")
        else:
            # Default to memory (safest option)
            print(f"  Unknown PORTFOLIO_STORAGE '{storage_type}', using memory")
            self._dependencies["portfolio_repository"] = InMemoryPortfolioRepository()
    
    @lru_cache(maxsize=None)
    def get_notification_repository(self) -> NotificationRepository:
        """Get notification repository instance (singleton)"""
        return self._dependencies["notification_repository"]
    
    @lru_cache(maxsize=None)
    def get_portfolio_repository(self) -> PortfolioRepository:
        """Get portfolio repository instance (singleton)"""
        return self._dependencies["portfolio_repository"]
    
    def get_generate_notification_use_case(self) -> GenerateNotificationUseCase:
        """Factory method for GenerateNotificationUseCase"""
        return GenerateNotificationUseCase(self.get_notification_repository())
    
    def get_mark_notification_as_read_use_case(self) -> MarkNotificationAsReadUseCase:
        """Factory method for MarkNotificationAsReadUseCase"""
        return MarkNotificationAsReadUseCase(self.get_notification_repository())
    
    def get_dismiss_notification_use_case(self) -> DismissNotificationUseCase:
        """Factory method for DismissNotificationUseCase"""
        return DismissNotificationUseCase(self.get_notification_repository())
    
    def get_mark_all_notifications_as_read_use_case(self) -> MarkAllNotificationsAsReadUseCase:
        """Factory method for MarkAllNotificationsAsReadUseCase"""
        return MarkAllNotificationsAsReadUseCase(self.get_notification_repository())
    
    def get_get_or_create_portfolio_use_case(self) -> GetOrCreatePortfolioUseCase:
        """Factory method for GetOrCreatePortfolioUseCase"""
        return GetOrCreatePortfolioUseCase(self.get_portfolio_repository())
    
    def register_mock_repository(self, mock_repository: NotificationRepository) -> None:
        """Register mock repository for testing"""
        self._dependencies["notification_repository"] = mock_repository
        # Clear cache to ensure new repository is used
        self.get_notification_repository.cache_clear()


# Global container instance - LAZY LOADING
_container = None


def _get_container() -> DIContainer:
    """Get or create the global container instance (lazy loading)"""
    global _container
    if _container is None:
        _container = DIContainer()
    return _container


# FastAPI dependency functions
def get_notification_repository() -> NotificationRepository:
    """FastAPI dependency for notification repository"""
    return _get_container().get_notification_repository()


def get_generate_notification_use_case() -> GenerateNotificationUseCase:
    """FastAPI dependency for generate notification use case"""
    return _get_container().get_generate_notification_use_case()


def get_mark_notification_as_read_use_case() -> MarkNotificationAsReadUseCase:
    """FastAPI dependency for mark as read use case"""
    return _get_container().get_mark_notification_as_read_use_case()


def get_dismiss_notification_use_case() -> DismissNotificationUseCase:
    """FastAPI dependency for dismiss notification use case"""
    return _get_container().get_dismiss_notification_use_case()


def get_mark_all_notifications_as_read_use_case() -> MarkAllNotificationsAsReadUseCase:
    """FastAPI dependency for mark all as read use case"""
    return _get_container().get_mark_all_notifications_as_read_use_case()


def get_portfolio_repository() -> PortfolioRepository:
    """FastAPI dependency for portfolio repository"""
    return _get_container().get_portfolio_repository()


def get_get_or_create_portfolio_use_case() -> GetOrCreatePortfolioUseCase:
    """FastAPI dependency for get or create portfolio use case"""
    return _get_container().get_get_or_create_portfolio_use_case()


def get_container() -> DIContainer:
    """Get the global container instance (for testing)"""
    return _get_container()


# User authentication dependencies (using dependency injection)
async def get_user_repository(session = Depends(get_db_session)) -> UserRepository:
    """FastAPI dependency for user repository"""
    return PostgresUserRepository(session)


async def get_create_user_use_case(
    user_repository: UserRepository = Depends(get_user_repository),
    portfolio_repository: PortfolioRepository = Depends(get_portfolio_repository)
) -> CreateUserUseCase:
    """FastAPI dependency for create user use case"""
    return CreateUserUseCase(user_repository, portfolio_repository)


async def get_authenticate_user_use_case(
    user_repository: UserRepository = Depends(get_user_repository)
) -> AuthenticateUserUseCase:
    """FastAPI dependency for authenticate user use case"""
    return AuthenticateUserUseCase(user_repository)


# Stock data provider dependencies
def get_stock_data_provider():
    """FastAPI dependency for stock data provider"""
    factory = ProviderFactory()
    return factory.create_provider()


def get_buy_stock_use_case(
    portfolio_repository: PortfolioRepository = Depends(get_portfolio_repository)
) -> BuyStock:
    """FastAPI dependency for buy stock use case"""
    # Create GetStockDataUseCase manually
    stock_provider = get_stock_data_provider()
    from ..use_cases.get_stock_data import GetStockDataUseCase
    get_stock_data = GetStockDataUseCase(stock_provider)
    
    # Use container method for notification service
    notification_service = _get_container().get_generate_notification_use_case()
    
    # Create BuyStock with correct parameter order
    return BuyStock(
        get_stock_data=get_stock_data,
        portfolio_repository=portfolio_repository,
        notification_service=notification_service
    )


def get_sell_stock_use_case(
    portfolio_repository: PortfolioRepository = Depends(get_portfolio_repository)
) -> SellStock:
    """FastAPI dependency for sell stock use case"""
    # Create GetStockDataUseCase manually (same pattern as BuyStock)
    stock_provider = get_stock_data_provider()
    from ..use_cases.get_stock_data import GetStockDataUseCase
    get_stock_data = GetStockDataUseCase(stock_provider)
    
    notification_repo = _get_container().get_notification_repository()
    # Correct parameter order to match SellStock constructor
    # SellStock.__init__(get_stock_data, portfolio_repository, notification_service)
    return SellStock(get_stock_data, portfolio_repository, notification_repo)


def get_analyze_portfolio_risk_use_case() -> AnalyzePortfolioRisk:
    """FastAPI dependency for analyze portfolio risk use case"""
    # Create GetStockDataUseCase properly wrapped
    stock_provider = get_stock_data_provider()
    from ..use_cases.get_stock_data import GetStockDataUseCase
    get_stock_data = GetStockDataUseCase(stock_provider)
    
    # Get notification service
    notification_service = _get_container().get_generate_notification_use_case()
    
    # Get notification repository for duplicate detection
    notification_repository = _get_container().get_notification_repository()
    
    # ✅ FIXED: Include notification repository for duplicate detection
    return AnalyzePortfolioRisk(get_stock_data, notification_service, notification_repository)
