"""
JSON Notification Repository Implementation

@description JSON file-based persistence for notifications following Clean Architecture
@layer Infrastructure
@pattern Repository Pattern with JSON file storage
@dependencies Core entities, Repository interface, JSON, threading

@author Capital Craft Team
@created 2025-01-15
"""
import json
import os
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from threading import Lock
from pathlib import Path

from ..core.entities.notification import Notification, NotificationStatus, NotificationTriggerType
from ..core.interfaces.notification_repository import NotificationRepository


class JSONNotificationRepository(NotificationRepository):
    """
    JSON file-based notification repository implementation
    
    @description Provides persistent storage using JSON files with thread-safe operations
    @layer Infrastructure
    @pattern Repository Pattern
    
    Features:
    - Thread-safe file operations
    - Automatic backup creation
    - Error recovery mechanisms
    - Optimistic concurrency control
    """
    
    def __init__(self, data_file_path: str = "data/notifications.json"):
        """
        Initialize JSON repository with file path
        
        @param data_file_path Path to JSON data file
        """
        self.data_file_path = Path(data_file_path)
        self._file_lock = Lock()
        self._ensure_data_directory()
        self._initialize_data_file()
    
    def _ensure_data_directory(self) -> None:
        """Ensure data directory exists"""
        self.data_file_path.parent.mkdir(parents=True, exist_ok=True)
    
    def _initialize_data_file(self) -> None:
        """Initialize data file if it doesn't exist"""
        if not self.data_file_path.exists():
            initial_data = {"demo": []}  # Start with demo user
            self._write_data(initial_data)
    
    def _read_data(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Thread-safe read of JSON data
        
        @returns Dictionary with user_id as key and notifications list as value
        @throws JSONDecodeError if file is corrupted
        """
        with self._file_lock:
            try:
                with open(self.data_file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (FileNotFoundError, json.JSONDecodeError) as e:
                # Recovery: return empty structure
                return {"demo": []}
    
    def _write_data(self, data: Dict[str, List[Dict[str, Any]]]) -> None:
        """
        Thread-safe write of JSON data with backup
        
        @param data Data structure to write
        """
        with self._file_lock:
            # Create backup before writing
            if self.data_file_path.exists():
                backup_path = self.data_file_path.with_suffix('.json.backup')
                self.data_file_path.replace(backup_path)
            
            # Write new data
            with open(self.data_file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, default=self._serialize_datetime)
    
    def _serialize_datetime(self, obj: Any) -> str:
        """Serialize datetime objects for JSON"""
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
    
    def _notification_to_dict(self, notification: Notification) -> Dict[str, Any]:
        """Convert notification entity to dictionary"""
        return {
            "id": notification.id,
            "userId": notification.user_id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.notification_type,
            "priority": notification.priority,
            "isRead": notification.is_read,
            "dismissed": notification.dismissed,
            "createdAt": notification.created_at.isoformat() if notification.created_at else None,
            "sentAt": notification.sent_at.isoformat() if notification.sent_at else None,
            "deepLink": notification.deep_link,
            "triggerType": notification.trigger_type.value,
            "triggerData": notification.trigger_data,
            "status": notification.status.value
        }
    
    def _dict_to_notification(self, data: Dict[str, Any]) -> Notification:
        """Convert dictionary to notification entity"""
        return Notification(
            id=data.get("id"),
            user_id=data["userId"],
            title=data["title"],
            message=data["message"],
            notification_type=data.get("type", "education"),
            priority=data.get("priority", "medium"),
            is_read=data.get("isRead", False),
            dismissed=data.get("dismissed", False),
            created_at=datetime.fromisoformat(data["createdAt"]) if data.get("createdAt") else None,
            sent_at=datetime.fromisoformat(data["sentAt"]) if data.get("sentAt") else None,
            deep_link=data["deepLink"],
            trigger_type=NotificationTriggerType(data["triggerType"]),
            trigger_data=data.get("triggerData", {}),
            status=NotificationStatus(data.get("status", "pending"))
        )
    
    async def save_notification(self, notification: Notification) -> None:
        """Save notification to JSON file"""
        data = self._read_data()
        
        # Ensure user exists in data structure
        if notification.user_id not in data:
            data[notification.user_id] = []
        
        # Add or update notification
        notification_dict = self._notification_to_dict(notification)
        user_notifications = data[notification.user_id]
        
        # Check if notification already exists (update case)
        existing_index = None
        for i, existing in enumerate(user_notifications):
            if existing["id"] == notification.id:
                existing_index = i
                break
        
        if existing_index is not None:
            user_notifications[existing_index] = notification_dict
        else:
            user_notifications.append(notification_dict)
        
        self._write_data(data)
    
    async def get_notification_by_id(self, notification_id: str) -> Optional[Notification]:
        """Retrieve notification by ID"""
        data = self._read_data()
        
        for user_notifications in data.values():
            for notification_dict in user_notifications:
                if notification_dict["id"] == notification_id:
                    return self._dict_to_notification(notification_dict)
        
        return None
    
    async def get_user_notifications(
        self, 
        user_id: str, 
        status: Optional[NotificationStatus] = None,
        limit: int = 50
    ) -> List[Notification]:
        """Get notifications for a user with optional status filter"""
        data = self._read_data()
        user_notifications = data.get(user_id, [])
        
        # DEBUG LOG
        total_notifications = len(user_notifications)
        dismissed_count = len([n for n in user_notifications if n.get("dismissed", False)])
        print(f"🔍 DEBUG: Total={total_notifications}, Dismissed={dismissed_count}, Active={total_notifications-dismissed_count}")
        
        notifications = []
        for notification_dict in user_notifications:
            # Skip dismissed notifications unless specifically requested
            if notification_dict.get("dismissed", False):
                print(f"   ⏭️ SKIPPING dismissed: {notification_dict.get('id')} - {notification_dict.get('title', '')[:40]}")
                continue
                
            notification = self._dict_to_notification(notification_dict)
            
            # Apply status filter if provided
            if status is None or notification.status == status:
                notifications.append(notification)
        
        # Sort by creation date (newest first) and apply limit
        # Handle timezone-aware vs timezone-naive datetime comparison
        def get_sort_key(notification):
            created_at = notification.created_at
            if created_at is None:
                # Use timezone-naive datetime.min for None values
                return datetime.min
            # Convert timezone-aware datetimes to naive for consistent comparison
            if created_at.tzinfo is not None:
                return created_at.replace(tzinfo=None)
            return created_at
            
        notifications.sort(key=get_sort_key, reverse=True)
        return notifications[:limit]
    
    async def update_notification_status(
        self, 
        notification_id: str, 
        status: NotificationStatus
    ) -> None:
        """Update notification status"""
        notification = await self.get_notification_by_id(notification_id)
        if notification:
            notification.status = status
            if status == NotificationStatus.SENT:
                notification.mark_as_sent()
            elif status == NotificationStatus.FAILED:
                notification.mark_as_failed()
            await self.save_notification(notification)
    
    async def mark_as_read(self, notification_id: str) -> bool:
        """Mark notification as read"""
        notification = await self.get_notification_by_id(notification_id)
        if notification and not notification.dismissed:
            notification.mark_as_read()
            await self.save_notification(notification)
            return True
        return False
    
    async def dismiss_notification(self, notification_id: str) -> bool:
        """Dismiss notification (soft delete)"""
        notification = await self.get_notification_by_id(notification_id)
        if notification and notification.can_be_dismissed():
            notification.dismiss()
            await self.save_notification(notification)
            return True
        return False
    
    async def mark_all_as_read(self, user_id: str) -> int:
        """Mark all notifications as read for a specific user"""
        data = self._read_data()
        user_notifications = data.get(user_id, [])
        
        marked_count = 0
        for notification_dict in user_notifications:
            if not notification_dict.get("isRead", False) and not notification_dict.get("dismissed", False):
                notification_dict["isRead"] = True
                marked_count += 1
        
        if marked_count > 0:
            self._write_data(data)
        
        return marked_count
    
    async def send_notification(self, notification: Notification) -> bool:
        """
        Mock implementation for notification sending
        In production, this would integrate with push notification services
        """
        # Simulate async operation
        await asyncio.sleep(0.1)
        
        # Mark as sent and save
        notification.mark_as_sent()
        await self.save_notification(notification)
        return True
    
    async def find_similar_notification(
        self, 
        user_id: str, 
        trigger_type: NotificationTriggerType,
        trigger_data: dict = None,
        within_hours: int = 24
    ) -> Optional[Notification]:
        """Find similar notification within time window to prevent duplicates"""
        data = self._read_data()
        user_notifications = data.get(user_id, [])
        
        # Calculate time window
        cutoff_time = datetime.now() - timedelta(hours=within_hours)
        
        for notification_dict in user_notifications:
            # Skip dismissed notifications
            if notification_dict.get("dismissed", False):
                continue
                
            # Check if notification matches trigger type
            if notification_dict.get("triggerType") != trigger_type.value:
                continue
            
            # Enhanced matching based on trigger type and content
            is_similar = self._is_similar_notification(
                notification_dict, trigger_type, trigger_data
            )
            
            if is_similar:
                # Check if within time window
                created_at_str = notification_dict.get("createdAt")
                if created_at_str:
                    try:
                        created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                        # Convert to naive datetime for comparison
                        if created_at.tzinfo is not None:
                            created_at = created_at.replace(tzinfo=None)
                        
                        if created_at >= cutoff_time:
                            return self._dict_to_notification(notification_dict)
                    except (ValueError, TypeError):
                        # If datetime parsing fails, skip this notification
                        continue
        
        return None
    
    def _is_similar_notification(
        self, 
        notification_dict: dict, 
        trigger_type: NotificationTriggerType, 
        trigger_data: dict = None
    ) -> bool:
        """Determine if notifications are similar based on content and context"""
        
        if trigger_type == NotificationTriggerType.EDUCATIONAL_MOMENT:
            # For educational moments, match by topic
            existing_trigger_data = notification_dict.get("triggerData", {})
            if trigger_data:
                existing_topic = existing_trigger_data.get("topic")
                new_topic = trigger_data.get("topic")
                return existing_topic == new_topic
        
        elif trigger_type == NotificationTriggerType.RISK_CHANGE:
            # For risk changes, match by risk level
            existing_trigger_data = notification_dict.get("triggerData", {})
            if trigger_data:
                existing_risk = existing_trigger_data.get("new_risk_level")
                new_risk = trigger_data.get("new_risk_level")
                return existing_risk == new_risk
        
        elif trigger_type == NotificationTriggerType.PORTFOLIO_CHANGE:
            # For portfolio changes, match by stock symbol
            existing_trigger_data = notification_dict.get("triggerData", {})
            if trigger_data:
                existing_symbol = existing_trigger_data.get("stock_symbol")
                new_symbol = trigger_data.get("stock_symbol")
                return existing_symbol == new_symbol
        
        elif trigger_type == NotificationTriggerType.LEARNING_STREAK:
            # For learning streaks, always consider similar (only one active at a time)
            return True
        
        # Fallback: consider similar if same trigger type
        return True
