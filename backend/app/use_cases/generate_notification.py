"""
Generate Notification Use Case
Follows same pattern as existing use cases (buy_stock.py, analyze_portfolio_risk.py)
"""
from typing import Dict, Any, List, Optional
from ..core.entities.notification import (
    Notification, 
    NotificationTemplate, 
    NotificationTriggerType
)
from ..core.interfaces.notification_repository import NotificationRepository


class GenerateNotificationUseCase:
    """
    Business logic for generating contextual notifications
    Follows Clean Architecture - Use Case layer
    """
    
    def __init__(self, notification_repository: NotificationRepository):
        self.notification_repository = notification_repository
        self._templates = self._load_notification_templates()
    
    async def execute(
        self, 
        user_id: str, 
        trigger_type: NotificationTriggerType,
        trigger_data: Dict[str, Any],
        deduplication_hours: int = 24
    ) -> Optional[Notification]:
        """
        Generate and save contextual notification based on trigger with deduplication
        
        Args:
            user_id: User identifier
            trigger_type: Type of trigger that initiated notification
            trigger_data: Context data for notification generation
            deduplication_hours: Hours to check for duplicate notifications (default 24)
            
        Returns:
            Generated notification or None if no template matched or duplicate exists
        """
        
        # Find matching template
        template = self._find_matching_template(trigger_type, trigger_data)
        if not template:
            return None
        
        # Generate notification from template
        notification = template.generate_notification(user_id, trigger_data)
        
        # Check for duplicate notifications within time window
        existing_notification = await self.notification_repository.find_similar_notification(
            user_id=user_id,
            trigger_type=trigger_type,
            trigger_data=trigger_data,
            within_hours=deduplication_hours
        )
        
        if existing_notification:
            # Return existing notification instead of creating duplicate
            return existing_notification
        
        # Save new notification
        await self.notification_repository.save_notification(notification)
        
        return notification
    
    async def execute_batch(
        self,
        user_id: str,
        triggers: List[Dict[str, Any]],
        deduplication_hours: int = 24
    ) -> List[Notification]:
        """
        Generate multiple notifications for a user with deduplication
        Useful for portfolio analysis that triggers multiple learnings
        """
        notifications = []
        
        for trigger in triggers:
            trigger_type = trigger.get('trigger_type')
            trigger_data = trigger.get('trigger_data', {})
            
            if trigger_type:
                notification = await self.execute(user_id, trigger_type, trigger_data, deduplication_hours)
                if notification:
                    notifications.append(notification)
        
        return notifications
    
    def _find_matching_template(
        self, 
        trigger_type: NotificationTriggerType, 
        trigger_data: Dict[str, Any]
    ) -> Optional[NotificationTemplate]:
        """Find template that matches trigger type and conditions"""
        
        templates = self._templates.get(trigger_type, [])
        
        for template in templates:
            if template.matches_conditions(trigger_data):
                return template
        
        return None
    
    def _load_notification_templates(self) -> Dict[NotificationTriggerType, List[NotificationTemplate]]:
        """
        Load notification templates
        Similar to how learning content templates are loaded
        """
        return {
            NotificationTriggerType.PORTFOLIO_CHANGE: [
                NotificationTemplate(
                    trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
                    title_template="📈 {stock_symbol} moved {change_percent:+.1f}%",
                    message_template="Your {stock_symbol} position changed {change_percent:+.1f}% today. Learn why this happened!",
                    deep_link_template="/learning/content/{content_slug}?symbol={stock_symbol}",
                    conditions={"min_abs_change_percent": 5.0}
                ),
                NotificationTemplate(
                    trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
                    title_template="🚨 {stock_symbol} significant move: {change_percent:+.1f}%",
                    message_template="Major movement in {stock_symbol}! Understanding volatility is key to smart investing.",
                    deep_link_template="/learning/content/volatility_advanced?symbol={stock_symbol}",
                    conditions={"min_abs_change_percent": 10.0}
                )
            ],
            
            NotificationTriggerType.RISK_CHANGE: [
                NotificationTemplate(
                    trigger_type=NotificationTriggerType.RISK_CHANGE,
                    title_template="⚖️ Portfolio Risk: {new_risk_level}",
                    message_template="Your portfolio risk changed to {new_risk_level}. Discover what this means for your strategy.",
                    deep_link_template="/learning/content/risk_management?level={new_risk_level}",
                    conditions={"risk_level_changed": True}
                )
            ],
            
            NotificationTriggerType.EDUCATIONAL_MOMENT: [
                NotificationTemplate(
                    trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
                    title_template="💡 Perfect time to learn about {topic}",
                    message_template="Based on your portfolio, now is a great time to understand {topic_description}.",
                    deep_link_template="/learning/content/{content_slug}",
                    conditions={"relevance_score": 0.7}
                )
            ],
            
            NotificationTriggerType.LEARNING_STREAK: [
                NotificationTemplate(
                    trigger_type=NotificationTriggerType.LEARNING_STREAK,
                    title_template="🔥 {streak_days}-day learning streak!",
                    message_template="Keep your momentum! Complete today's lesson to reach {next_milestone} days.",
                    deep_link_template="/learning/daily?streak={streak_days}",
                    conditions={"min_streak_days": 2}
                )
            ]
        }


class SendNotificationUseCase:
    """
    Use case for sending notifications via delivery providers
    Separates generation from delivery (Single Responsibility)
    """
    
    def __init__(self, notification_repository: NotificationRepository):
        self.notification_repository = notification_repository
    
    async def execute(self, notification_id: str) -> bool:
        """
        Send notification by ID
        
        Returns:
            True if sent successfully, False otherwise
        """
        notification = await self.notification_repository.get_notification_by_id(notification_id)
        
        if not notification:
            return False
        
        # Send via repository (which handles delivery providers)
        success = await self.notification_repository.send_notification(notification)
        
        # Update status based on result
        if success:
            notification.mark_as_sent()
        else:
            notification.mark_as_failed()
        
        await self.notification_repository.update_notification_status(
            notification.id, 
            notification.status
        )
        
        return success