"""
📁 FILE: core/entities/notification.py

Notification Entity - Core domain object
Follows same pattern as stock.py and portfolio.py
"""
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any
import uuid


class NotificationTriggerType(Enum):
    PORTFOLIO_CHANGE = "portfolio_change"
    LEARNING_STREAK = "learning_streak"
    EDUCATIONAL_MOMENT = "educational_moment"
    RISK_CHANGE = "risk_change"


class NotificationStatus(Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


@dataclass
class Notification:
    """
    Core notification entity - follows same pattern as Stock and Portfolio
    Extended with persistence fields for read/dismiss functionality
    """
    user_id: str
    trigger_type: NotificationTriggerType
    title: str
    message: str
    deep_link: str
    trigger_data: Dict[str, Any]
    id: Optional[str] = None
    status: NotificationStatus = NotificationStatus.PENDING
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    is_read: bool = False
    dismissed: bool = False
    priority: str = "medium"  # low, medium, high, urgent
    notification_type: str = "education"  # education, portfolio, system
    
    def __post_init__(self):
        if self.id is None:
            self.id = str(uuid.uuid4())
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.updated_at is None:
            self.updated_at = datetime.now()
    
    def mark_as_sent(self) -> None:
        """Mark notification as successfully sent"""
        self.status = NotificationStatus.SENT
        self.sent_at = datetime.now()
        self.updated_at = datetime.now()
    
    def mark_as_failed(self) -> None:
        """Mark notification as failed to send"""
        self.status = NotificationStatus.FAILED
        self.updated_at = datetime.now()
    
    def mark_as_read(self) -> None:
        """Mark notification as read by user"""
        self.is_read = True
        self.updated_at = datetime.now()
    
    def mark_as_unread(self) -> None:
        """Mark notification as unread"""
        self.is_read = False
        self.updated_at = datetime.now()
    
    def dismiss(self) -> None:
        """Dismiss notification (soft delete)"""
        self.dismissed = True
        self.updated_at = datetime.now()
    
    def can_be_dismissed(self) -> bool:
        """Check if notification can be dismissed"""
        return not self.dismissed
    
    def is_urgent(self) -> bool:
        """Check if notification is urgent priority"""
        return self.priority == "urgent"
    
    def is_educational_trigger(self) -> bool:
        """Check if notification is education-focused"""
        return self.trigger_type in [
            NotificationTriggerType.EDUCATIONAL_MOMENT,
            NotificationTriggerType.LEARNING_STREAK
        ]
    
    def is_portfolio_trigger(self) -> bool:
        """Check if notification is portfolio-based"""
        return self.trigger_type in [
            NotificationTriggerType.PORTFOLIO_CHANGE,
            NotificationTriggerType.RISK_CHANGE
        ]


@dataclass
class NotificationTemplate:
    """
    Template for generating contextual notifications
    Similar to LearningContent structure
    """
    trigger_type: NotificationTriggerType
    title_template: str
    message_template: str
    deep_link_template: str
    conditions: Dict[str, Any]
    
    def generate_notification(
        self, 
        user_id: str, 
        trigger_data: Dict[str, Any]
    ) -> Notification:
        """Generate notification from template with context data"""
        return Notification(
            user_id=user_id,
            trigger_type=self.trigger_type,
            title=self._format_template(self.title_template, trigger_data),
            message=self._format_template(self.message_template, trigger_data),
            deep_link=self._format_template(self.deep_link_template, trigger_data),
            trigger_data=trigger_data
        )
    
    def _format_template(self, template: str, data: Dict[str, Any]) -> str:
        """Safe template formatting with fallback"""
        try:
            return template.format(**data)
        except (KeyError, ValueError):
            return template
    
    def matches_conditions(self, trigger_data: Dict[str, Any]) -> bool:
        """Check if trigger data meets template conditions"""
        for key, expected_value in self.conditions.items():
            if key not in trigger_data:
                return False
            
            actual_value = trigger_data[key]
            
            # Handle different condition types
            if isinstance(expected_value, (int, float)):
                try:
                    if not (float(actual_value) >= expected_value):
                        return False
                except (ValueError, TypeError):
                    return False
            elif isinstance(expected_value, bool):
                if not (bool(actual_value) == expected_value):
                    return False
            else:
                if not (actual_value == expected_value):
                    return False
        
        return True