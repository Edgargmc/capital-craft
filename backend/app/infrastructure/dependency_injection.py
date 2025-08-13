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
        
        # Setup notification repository
        print(f"USE_MOCK_REPOSITORY: {os.getenv("USE_MOCK_REPOSITORY", "false").lower()}")
        if os.getenv("USE_MOCK_REPOSITORY", "false").lower() == "true":
            print(f"USE_MOCK_REPOSITORY: True")
            self._dependencies["notification_repository"] = MockNotificationRepository()
        else:
            print(f"USE_MOCK_REPOSITORY: False")
            data_path = os.getenv("NOTIFICATION_DATA_PATH", "data/notifications.json")
            self._dependencies["notification_repository"] = JSONNotificationRepository(data_path)
        
        # Setup portfolio repository (Baby Step 2C: JSON by default, Memory as fallback)
        portfolio_storage = os.getenv("PORTFOLIO_STORAGE", "json").lower()  # Changed default to JSON
        
        if portfolio_storage == "memory":
            self._dependencies["portfolio_repository"] = InMemoryPortfolioRepository()
            print("✅ Portfolio repository initialized: InMemoryPortfolioRepository")
        else:
            # Default to JSON persistence
            data_path = os.getenv("PORTFOLIO_DATA_PATH", "data")
            self._dependencies["portfolio_repository"] = JsonPortfolioRepository(data_path)
            print(f"✅ Portfolio repository initialized: JsonPortfolioRepository (path: {data_path})")
    
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


# Global container instance
_container = DIContainer()


# FastAPI dependency functions
def get_notification_repository() -> NotificationRepository:
    """FastAPI dependency for notification repository"""
    return _container.get_notification_repository()


def get_generate_notification_use_case() -> GenerateNotificationUseCase:
    """FastAPI dependency for generate notification use case"""
    return _container.get_generate_notification_use_case()


def get_mark_notification_as_read_use_case() -> MarkNotificationAsReadUseCase:
    """FastAPI dependency for mark as read use case"""
    return _container.get_mark_notification_as_read_use_case()


def get_dismiss_notification_use_case() -> DismissNotificationUseCase:
    """FastAPI dependency for dismiss notification use case"""
    return _container.get_dismiss_notification_use_case()


def get_mark_all_notifications_as_read_use_case() -> MarkAllNotificationsAsReadUseCase:
    """FastAPI dependency for mark all as read use case"""
    return _container.get_mark_all_notifications_as_read_use_case()


def get_portfolio_repository() -> PortfolioRepository:
    """FastAPI dependency for portfolio repository"""
    return _container.get_portfolio_repository()


def get_get_or_create_portfolio_use_case() -> GetOrCreatePortfolioUseCase:
    """FastAPI dependency for get or create portfolio use case"""
    return _container.get_get_or_create_portfolio_use_case()


def get_container() -> DIContainer:
    """Get the global container instance (for testing)"""
    return _container


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
