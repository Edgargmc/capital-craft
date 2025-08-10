"""
Notification Repository Interface
Follows same pattern as stock_data_provider.py
Extended with persistence operations for read/dismiss functionality
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime, timedelta
from ..entities.notification import Notification, NotificationStatus, NotificationTriggerType


class NotificationRepository(ABC):
    """
    Abstract interface for notification persistence and delivery
    Follows SOLID principles - Dependency Inversion
    Extended with CRUD operations for notification state management
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
    
    @abstractmethod
    async def mark_as_read(self, notification_id: str) -> bool:
        """
        Mark notification as read
        
        Args:
            notification_id: Unique identifier of the notification
            
        Returns:
            True if successfully marked as read, False if notification not found
        """
        pass
    
    @abstractmethod
    async def dismiss_notification(self, notification_id: str) -> bool:
        """
        Dismiss notification (soft delete)
        
        Args:
            notification_id: Unique identifier of the notification
            
        Returns:
            True if successfully dismissed, False if notification not found
        """
        pass
    
    @abstractmethod
    async def mark_all_as_read(self, user_id: str) -> int:
        """
        Mark all notifications as read for a specific user
        
        Args:
            user_id: User identifier
            
        Returns:
            Number of notifications marked as read
        """
        pass
    
    @abstractmethod
    async def find_similar_notification(
        self, 
        user_id: str, 
        trigger_type: NotificationTriggerType,
        trigger_data: dict = None,
        within_hours: int = 24
    ) -> Optional[Notification]:
        """
        Find similar notification within time window to prevent duplicates
        
        Args:
            user_id: User identifier  
            trigger_type: Type of trigger
            trigger_data: Context data to help identify similar notifications
            within_hours: Time window to check for duplicates (default 24 hours)
            
        Returns:
            Similar notification if found, None otherwise
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