"""
Dismiss Notification Use Case

@description Handles the business logic for dismissing notifications (soft delete)
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
    """Raised when notification is already dismissed"""
    pass


class DismissNotificationUseCase:
    """
    Business logic for dismissing notifications
    
    @description Handles soft deletion of notifications with validation
    @layer Application
    @pattern Use Case Pattern
    
    Features:
    - Validates notification exists and can be dismissed
    - Soft delete (marks as dismissed)
    - Returns updated notification entity
    - Comprehensive error handling
    """
    
    def __init__(self, notification_repository: NotificationRepository):
        """
        Initialize use case with repository dependency
        
        @param notification_repository Repository for notification persistence
        """
        self.notification_repository = notification_repository
    
    async def execute(self, notification_id: str) -> Notification:
        """
        Execute the dismiss notification use case
        
        @param notification_id Unique identifier of the notification
        @returns Updated notification entity  
        @raises NotificationNotFoundError When notification doesn't exist
        @raises NotificationAlreadyDismissedError When notification already dismissed
        
        @example
        ```python
        use_case = DismissNotificationUseCase(repository)
        notification = await use_case.execute("notif-123")
        assert notification.dismissed == True
        ```
        """
        
        # Retrieve notification
        notification = await self.notification_repository.get_notification_by_id(notification_id)
        
        if not notification:
            raise NotificationNotFoundError(f"Notification with ID {notification_id} not found")
        
        if notification.dismissed:
            raise NotificationAlreadyDismissedError(
                f"Notification {notification_id} is already dismissed"
            )
        
        if not notification.can_be_dismissed():
            raise NotificationAlreadyDismissedError(
                f"Notification {notification_id} cannot be dismissed"
            )
        
        # Dismiss using repository method (direct UPDATE)
        success = await self.notification_repository.dismiss_notification(notification_id)
        
        if not success:
            raise NotificationNotFoundError(f"Failed to dismiss notification {notification_id}")
        
        # Update the entity state and return
        notification.dismiss()
        return notification
