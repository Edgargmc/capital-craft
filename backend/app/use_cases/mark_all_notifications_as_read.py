"""
Mark All Notifications As Read Use Case

@description Handles the business logic for marking all user notifications as read
@layer Application  
@pattern Use Case Pattern
@dependencies Domain entities, Repository interfaces

@author Capital Craft Team
@created 2025-01-15
"""
from typing import List
from ..core.entities.notification import Notification
from ..core.interfaces.notification_repository import NotificationRepository


class MarkAllNotificationsAsReadUseCase:
    """
    Business logic for marking all notifications as read for a user
    
    @description Bulk operation to mark all unread notifications as read
    @layer Application
    @pattern Use Case Pattern
    
    Features:
    - Bulk update operation
    - Returns count of updated notifications
    - Skips dismissed notifications
    - Optimized for performance
    """
    
    def __init__(self, notification_repository: NotificationRepository):
        """
        Initialize use case with repository dependency
        
        @param notification_repository Repository for notification persistence
        """
        self.notification_repository = notification_repository
    
    async def execute(self, user_id: str) -> int:
        """
        Execute the mark all as read use case
        
        @param user_id User identifier
        @returns Number of notifications marked as read
        
        @example
        ```python
        use_case = MarkAllNotificationsAsReadUseCase(repository)
        count = await use_case.execute("demo")
        print(f"Marked {count} notifications as read")
        ```
        """
        
        # Use repository's optimized bulk operation
        marked_count = await self.notification_repository.mark_all_as_read(user_id)
        
        return marked_count
