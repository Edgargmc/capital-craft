"""
Mark Notification As Read Use Case

@description Handles the business logic for marking notifications as read
@layer Application  
@pattern Use Case Pattern
@dependencies Domain entities, Repository interfaces

@author Capital Craft Team
@created 2025-01-15
"""
from typing import Optional
from ..core.entities.notification import Notification
from ..core.interfaces.notification_repository import NotificationRepository


class NotificationNotFoundError(Exception):
    """Raised when notification is not found"""
    pass


class NotificationAlreadyDismissedError(Exception):
    """Raised when trying to modify a dismissed notification"""
    pass


class MarkNotificationAsReadUseCase:
    """
    Business logic for marking notifications as read
    
    @description Handles marking individual notifications as read with validation
    @layer Application
    @pattern Use Case Pattern
    
    Features:
    - Validates notification exists
    - Prevents modification of dismissed notifications
    - Returns updated notification entity
    - Comprehensive error handling
    """
    
    def __init__(self, notification_repository: NotificationRepository):
        """
        Initialize use case with repository dependency
        
        @param notification_repository Repository for notification persistence
        """
        self.notification_repository = notification_repository
    
    async def execute(self, notification_id: str) -> bool:
        """
        Execute the mark as read use case
        
        @param notification_id Unique identifier of the notification
        @returns True if successfully marked as read
        @raises NotificationNotFoundError When notification doesn't exist
        @raises NotificationAlreadyDismissedError When notification is dismissed
        
        @example
        ```python
        use_case = MarkNotificationAsReadUseCase(repository)
        notification = await use_case.execute("notif-123")
        assert notification.is_read == True
        ```
        """
        
        # Retrieve notification
        notification = await self.notification_repository.get_notification_by_id(notification_id)
        
        if not notification:
            raise NotificationNotFoundError(f"Notification with ID {notification_id} not found")
        
        if notification.dismissed:
            raise NotificationAlreadyDismissedError(
                f"Cannot modify dismissed notification {notification_id}"
            )
        
        # Mark as read using domain method
        notification.mark_as_read()
        
        # Persist changes
        await self.notification_repository.save_notification(notification)
        
        return True
