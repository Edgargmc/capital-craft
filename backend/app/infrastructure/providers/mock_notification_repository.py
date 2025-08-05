"""
📁 FILE: infrastructure/providers/mock_notification_repository.py

Mock implementation for development and testing
Follows same pattern as mock_stock_provider.py
"""
from typing import List, Optional, Dict
from ...core.entities.notification import Notification, NotificationStatus
from ...core.interfaces.notification_repository import NotificationRepository, NotificationDeliveryProvider


class MockNotificationRepository(NotificationRepository):
    """
    Mock implementation for development
    Stores notifications in memory like portfolios_db
    """
    
    def __init__(self):
        self._notifications: Dict[str, Notification] = {}
        self._user_notifications: Dict[str, List[str]] = {}
        self._delivery_provider = MockPushNotificationProvider()
    
    async def save_notification(self, notification: Notification) -> None:
        """Save notification to in-memory storage"""
        self._notifications[notification.id] = notification
        
        # Index by user
        if notification.user_id not in self._user_notifications:
            self._user_notifications[notification.user_id] = []
        
        self._user_notifications[notification.user_id].append(notification.id)
    
    async def get_notification_by_id(self, notification_id: str) -> Optional[Notification]:
        """Retrieve notification by ID"""
        return self._notifications.get(notification_id)
    
    async def get_user_notifications(
        self, 
        user_id: str, 
        status: Optional[NotificationStatus] = None,
        limit: int = 50
    ) -> List[Notification]:
        """Get notifications for a user with optional status filter"""
        user_notification_ids = self._user_notifications.get(user_id, [])
        notifications = []
        
        for notification_id in user_notification_ids[-limit:]:  # Get latest
            notification = self._notifications.get(notification_id)
            if notification:
                if status is None or notification.status == status:
                    notifications.append(notification)
        
        return list(reversed(notifications))  # Most recent first
    
    async def update_notification_status(
        self, 
        notification_id: str, 
        status: NotificationStatus
    ) -> None:
        """Update notification status"""
        if notification_id in self._notifications:
            notification = self._notifications[notification_id]
            if status == NotificationStatus.SENT:
                notification.mark_as_sent()
            elif status == NotificationStatus.FAILED:
                notification.mark_as_failed()
    
    async def send_notification(self, notification: Notification) -> bool:
        """Send notification via mock delivery provider"""
        return await self._delivery_provider.send(notification)


class MockPushNotificationProvider(NotificationDeliveryProvider):
    """
    Mock push notification provider for development
    Simulates sending notifications
    """
    
    def __init__(self):
        self._sent_notifications: List[Notification] = []
    
    async def send(self, notification: Notification) -> bool:
        """Simulate sending push notification"""
        print(f"🔔 [MOCK PUSH] To: {notification.user_id}")
        print(f"    Title: {notification.title}")
        print(f"    Message: {notification.message}")
        print(f"    Deep Link: {notification.deep_link}")
        print(f"    Trigger: {notification.trigger_type.value}")
        
        # Simulate success (can add failure simulation later)
        self._sent_notifications.append(notification)
        return True
    
    def supports_trigger_type(self, trigger_type) -> bool:
        """Mock provider supports all trigger types"""
        return True
    
    def get_provider_name(self) -> str:
        """Provider identifier"""
        return "mock_push"
    
    def get_sent_notifications(self) -> List[Notification]:
        """Helper for testing - get all sent notifications"""
        return self._sent_notifications.copy()
    
    def clear_sent_notifications(self) -> None:
        """Helper for testing - clear sent notifications"""
        self._sent_notifications.clear()