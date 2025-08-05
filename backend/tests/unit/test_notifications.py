"""
📁 FILE: tests/test_notifications.py

Unit and integration tests for notification system using pytest
"""
import pytest
import asyncio
from datetime import datetime
from unittest.mock import Mock

from app.core.entities.notification import (
    Notification, 
    NotificationTemplate,
    NotificationTriggerType, 
    NotificationStatus
)
from app.use_cases.generate_notification import GenerateNotificationUseCase, SendNotificationUseCase
from app.infrastructure.providers.mock_notification_repository import MockNotificationRepository


class TestNotificationEntity:
    """Test notification entity behavior"""
    
    def test_notification_creation(self):
        """Test basic notification creation"""
        notification = Notification(
            user_id="test_user",
            trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
            title="Test Title",
            message="Test Message", 
            deep_link="/test",
            trigger_data={"test": "data"}
        )
        
        assert notification.user_id == "test_user"
        assert notification.status == NotificationStatus.PENDING
        assert notification.id is not None
        assert notification.created_at is not None
        assert isinstance(notification.created_at, datetime)
    
    def test_notification_mark_as_sent(self):
        """Test marking notification as sent"""
        notification = Notification(
            user_id="test_user",
            trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
            title="Test",
            message="Test",
            deep_link="/test",
            trigger_data={}
        )
        
        notification.mark_as_sent()
        
        assert notification.status == NotificationStatus.SENT
        assert notification.sent_at is not None
    
    def test_notification_mark_as_failed(self):
        """Test marking notification as failed"""
        notification = Notification(
            user_id="test_user",
            trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
            title="Test",
            message="Test", 
            deep_link="/test",
            trigger_data={}
        )
        
        notification.mark_as_failed()
        
        assert notification.status == NotificationStatus.FAILED
        assert notification.sent_at is None
    
    def test_is_educational_trigger(self):
        """Test educational trigger identification"""
        educational_notification = Notification(
            user_id="test_user",
            trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
            title="Test",
            message="Test",
            deep_link="/test", 
            trigger_data={}
        )
        
        portfolio_notification = Notification(
            user_id="test_user",
            trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
            title="Test",
            message="Test",
            deep_link="/test",
            trigger_data={}
        )
        
        assert educational_notification.is_educational_trigger() == True
        assert portfolio_notification.is_educational_trigger() == False
    
    def test_is_portfolio_trigger(self):
        """Test portfolio trigger identification"""
        portfolio_notification = Notification(
            user_id="test_user",
            trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE, 
            title="Test",
            message="Test",
            deep_link="/test",
            trigger_data={}
        )
        
        educational_notification = Notification(
            user_id="test_user",
            trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
            title="Test",
            message="Test",
            deep_link="/test",
            trigger_data={}
        )
        
        assert portfolio_notification.is_portfolio_trigger() == True
        assert educational_notification.is_portfolio_trigger() == False


class TestNotificationTemplate:
    """Test notification template behavior"""
    
    def test_template_generation(self):
        """Test notification generation from template"""
        template = NotificationTemplate(
            trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
            title_template="Stock {symbol} moved {change}%",
            message_template="Your {symbol} position changed {change}%",
            deep_link_template="/learning/{symbol}",
            conditions={"min_change": 5.0}
        )
        
        trigger_data = {
            "symbol": "TSLA",
            "change": 8.5
        }
        
        notification = template.generate_notification("user123", trigger_data)
        
        assert notification.user_id == "user123"
        assert notification.title == "Stock TSLA moved 8.5%"
        assert notification.message == "Your TSLA position changed 8.5%"
        assert notification.deep_link == "/learning/TSLA"
        assert notification.trigger_data == trigger_data
    
    def test_template_safe_formatting(self):
        """Test template formatting with missing data"""
        template = NotificationTemplate(
            trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
            title_template="Stock {symbol} moved {missing_field}%",
            message_template="Test message",
            deep_link_template="/test",
            conditions={}
        )
        
        trigger_data = {"symbol": "TSLA"}  # missing_field not provided
        
        notification = template.generate_notification("user123", trigger_data)
        
        # Should fallback to original template without formatting
        assert notification.title == "Stock {symbol} moved {missing_field}%"
    
    def test_template_condition_matching(self):
        """Test template condition matching"""
        template = NotificationTemplate(
            trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
            title_template="Test",
            message_template="Test",
            deep_link_template="/test",
            conditions={
                "min_change": 5.0,
                "is_important": True
            }
        )
        
        # Should match - meets all conditions
        matching_data = {
            "min_change": 8.5,
            "is_important": True
        }
        assert template.matches_conditions(matching_data) == True
        
        # Should not match - below threshold
        non_matching_data = {
            "min_change": 3.0,
            "is_important": True
        }
        assert template.matches_conditions(non_matching_data) == False
        
        # Should not match - missing field
        incomplete_data = {
            "min_change": 8.5
        }
        assert template.matches_conditions(incomplete_data) == False


class TestMockNotificationRepository:
    """Test mock notification repository"""
    
    @pytest.mark.asyncio
    async def test_save_and_retrieve_notification(self):
        """Test saving and retrieving notifications"""
        repository = MockNotificationRepository()
        
        notification = Notification(
            user_id="test_user",
            trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
            title="Test Notification",
            message="Test Message",
            deep_link="/test",
            trigger_data={"test": "data"}
        )
        
        # Save notification
        await repository.save_notification(notification)
        
        # Retrieve by ID
        retrieved = await repository.get_notification_by_id(notification.id)
        
        assert retrieved is not None
        assert retrieved.id == notification.id
        assert retrieved.user_id == notification.user_id
        assert retrieved.title == notification.title
    
    @pytest.mark.asyncio
    async def test_get_user_notifications(self):
        """Test retrieving notifications by user"""
        repository = MockNotificationRepository()
        user_id = "test_user"
        
        # Create multiple notifications
        notifications = []
        for i in range(3):
            notification = Notification(
                user_id=user_id,
                trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
                title=f"Test {i}",
                message=f"Message {i}",
                deep_link=f"/test{i}",
                trigger_data={"index": i}
            )
            notifications.append(notification)
            await repository.save_notification(notification)
        
        # Retrieve user notifications
        user_notifications = await repository.get_user_notifications(user_id)
        
        assert len(user_notifications) == 3
        # Should be in reverse order (most recent first)
        assert user_notifications[0].title == "Test 2"
        assert user_notifications[1].title == "Test 1"
        assert user_notifications[2].title == "Test 0"
    
    @pytest.mark.asyncio
    async def test_update_notification_status(self):
        """Test updating notification status"""
        repository = MockNotificationRepository()
        
        notification = Notification(
            user_id="test_user",
            trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
            title="Test",
            message="Test",
            deep_link="/test",
            trigger_data={}
        )
        
        await repository.save_notification(notification)
        
        # Update status to sent
        await repository.update_notification_status(notification.id, NotificationStatus.SENT)
        
        # Verify status updated
        updated = await repository.get_notification_by_id(notification.id)
        assert updated.status == NotificationStatus.SENT
        assert updated.sent_at is not None


class TestGenerateNotificationUseCase:
    """Test notification generation use case"""
    
    @pytest.mark.asyncio
    async def test_execute_portfolio_change(self):
        """Test generating portfolio change notification"""
        repository = MockNotificationRepository()
        use_case = GenerateNotificationUseCase(repository)
        
        trigger_data = {
            "stock_symbol": "TSLA",
            "change_percent": 8.5,
            "min_abs_change_percent": 8.5,
            "content_slug": "volatility_basics"
        }
        
        notification = await use_case.execute(
            user_id="test_user",
            trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
            trigger_data=trigger_data
        )
        
        assert notification is not None
        assert "TSLA" in notification.title
        assert "8.5" in notification.title
        assert notification.user_id == "test_user"
        
        # Verify it was saved
        saved = await repository.get_notification_by_id(notification.id)
        assert saved is not None
    
    @pytest.mark.asyncio
    async def test_execute_no_matching_template(self):
        """Test when no template matches conditions"""
        repository = MockNotificationRepository()
        use_case = GenerateNotificationUseCase(repository)
        
        # Small change that doesn't meet threshold
        trigger_data = {
            "stock_symbol": "AAPL",
            "change_percent": 2.0,
            "min_abs_change_percent": 2.0  # Below 5.0 threshold
        }
        
        notification = await use_case.execute(
            user_id="test_user",
            trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
            trigger_data=trigger_data
        )
        
        assert notification is None


class TestSendNotificationUseCase:
    """Test notification sending use case"""
    
    @pytest.mark.asyncio
    async def test_send_notification_success(self):
        """Test successful notification sending"""
        repository = MockNotificationRepository()
        generate_use_case = GenerateNotificationUseCase(repository)
        send_use_case = SendNotificationUseCase(repository)
        
        # Generate notification
        notification = await generate_use_case.execute(
            user_id="test_user",
            trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
            trigger_data={
                "stock_symbol": "NVDA",
                "change_percent": 10.0,
                "min_abs_change_percent": 10.0,
                "content_slug": "volatility_basics"
            }
        )
        
        assert notification is not None
        
        # Send notification
        success = await send_use_case.execute(notification.id)
        
        assert success == True
        
        # Verify status updated
        updated = await repository.get_notification_by_id(notification.id)
        assert updated.status == NotificationStatus.SENT
        assert updated.sent_at is not None
    
    @pytest.mark.asyncio
    async def test_send_nonexistent_notification(self):
        """Test sending notification that doesn't exist"""
        repository = MockNotificationRepository()
        send_use_case = SendNotificationUseCase(repository)
        
        success = await send_use_case.execute("nonexistent_id")
        
        assert success == False


# Integration test runner
@pytest.mark.asyncio
async def test_full_notification_flow():
    """Integration test - full notification flow"""
    repository = MockNotificationRepository()
    generate_use_case = GenerateNotificationUseCase(repository)
    send_use_case = SendNotificationUseCase(repository)
    
    user_id = "integration_test_user"
    
    # 1. Generate portfolio change notification
    portfolio_notification = await generate_use_case.execute(
        user_id=user_id,
        trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
        trigger_data={
            "stock_symbol": "TSLA",
            "change_percent": 15.0,
            "min_abs_change_percent": 15.0,
            "content_slug": "volatility_advanced"
        }
    )
    
    # 2. Generate risk change notification
    risk_notification = await generate_use_case.execute(
        user_id=user_id,
        trigger_type=NotificationTriggerType.RISK_CHANGE,
        trigger_data={
            "new_risk_level": "HIGH",
            "risk_level_changed": True
        }
    )
    
    # 3. Send both notifications
    portfolio_sent = await send_use_case.execute(portfolio_notification.id)
    risk_sent = await send_use_case.execute(risk_notification.id)
    
    # 4. Verify results
    assert portfolio_sent == True
    assert risk_sent == True
    
    # 5. Check user notification history
    user_notifications = await repository.get_user_notifications(user_id)
    assert len(user_notifications) == 2
    
    # 6. Verify all notifications were sent
    sent_notifications = await repository.get_user_notifications(
        user_id, 
        status=NotificationStatus.SENT
    )
    assert len(sent_notifications) == 2