"""
Notification Repository Interface
Follows same pattern as stock_data_provider.py
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from ..entities.notification import Notification, NotificationStatus


class NotificationRepository(ABC):
    """
    Abstract interface for notification persistence and delivery
    Follows SOLID principles - Dependency Inversion
    """
    
    @abstractmethod
    async def save_notification(self, notification: Notification) -> None:
        """Save notification to storage"""
        pass
    
    @abstractmethod
    async def get_notification_by_id(self, notification_id: str) -> Optional[Notification]:
        """Retrieve notification by ID"""
        pass
    
    @abstractmethod
    async def get_user_notifications(
        self, 
        user_id: str, 
        status: Optional[NotificationStatus] = None,
        limit: int = 50
    ) -> List[Notification]:
        """Get notifications for a user with optional status filter"""
        pass
    
    @abstractmethod
    async def update_notification_status(
        self, 
        notification_id: str, 
        status: NotificationStatus
    ) -> None:
        """Update notification status"""
        pass
    
    @abstractmethod
    async def send_notification(self, notification: Notification) -> bool:
        """
        Send notification via delivery mechanism (push, email, etc.)
        Returns True if successful, False otherwise
        """
        pass


class NotificationDeliveryProvider(ABC):
    """
    Abstract interface for notification delivery mechanisms
    Allows multiple providers (Push, Email, SMS, etc.)
    """
    
    @abstractmethod
    async def send(self, notification: Notification) -> bool:
        """Send notification via this provider"""
        pass
    
    @abstractmethod
    def supports_trigger_type(self, trigger_type) -> bool:
        """Check if provider supports this trigger type"""
        pass
    
    @abstractmethod
    def get_provider_name(self) -> str:
        """Get provider identifier"""
        pass