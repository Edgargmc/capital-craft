"""
📁 FILE: tests/integration/test_notification_integration.py

Integration test for notification system - Fixed for pytest
"""
import pytest
import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.entities.notification import NotificationTriggerType
from app.use_cases.generate_notification import GenerateNotificationUseCase, SendNotificationUseCase  
from app.infrastructure.providers.mock_notification_repository import MockNotificationRepository


@pytest.mark.asyncio
async def test_portfolio_change_notification():
    """Test portfolio change trigger notification"""
    print("🧪 Testing Portfolio Change Notification...")
    
    # Setup
    repository = MockNotificationRepository()
    generate_use_case = GenerateNotificationUseCase(repository)
    send_use_case = SendNotificationUseCase(repository)
    
    # Test data - simulate TSLA stock movement
    trigger_data = {
        "stock_symbol": "TSLA",
        "change_percent": 8.5,
        "min_abs_change_percent": 8.5,  # Meets condition
        "content_slug": "volatility_basics"
    }
    
    # Generate notification
    notification = await generate_use_case.execute(
        user_id="test_user_123",
        trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
        trigger_data=trigger_data
    )
    
    assert notification is not None, "Notification should be generated"
    assert "TSLA" in notification.title
    assert "8.5" in notification.title
    
    # Send notification
    success = await send_use_case.execute(notification.id)
    assert success, "Notification should be sent successfully"


@pytest.mark.asyncio
async def test_risk_change_notification():
    """Test risk change trigger notification"""
    print("\n🧪 Testing Risk Change Notification...")
    
    # Setup
    repository = MockNotificationRepository()
    generate_use_case = GenerateNotificationUseCase(repository)
    send_use_case = SendNotificationUseCase(repository)
    
    # Test data - simulate risk level change
    trigger_data = {
        "new_risk_level": "HIGH",
        "old_risk_level": "MEDIUM", 
        "risk_level_changed": True
    }
    
    # Generate notification
    notification = await generate_use_case.execute(
        user_id="test_user_123",
        trigger_type=NotificationTriggerType.RISK_CHANGE,
        trigger_data=trigger_data
    )
    
    assert notification is not None, "Risk change notification should be generated"
    assert "HIGH" in notification.title
    
    # Send notification
    success = await send_use_case.execute(notification.id)
    assert success, "Risk notification should be sent successfully"


@pytest.mark.asyncio
async def test_educational_moment_notification():
    """Test educational moment trigger"""
    print("\n🧪 Testing Educational Moment Notification...")
    
    # Setup
    repository = MockNotificationRepository()
    generate_use_case = GenerateNotificationUseCase(repository)
    
    # Test data - simulate educational trigger
    trigger_data = {
        "topic": "Dividend Investing",
        "topic_description": "how dividend stocks can provide steady income",
        "relevance_score": 0.8,  # Meets condition (>= 0.7)
        "content_slug": "dividend_basics"
    }
    
    # Generate notification
    notification = await generate_use_case.execute(
        user_id="test_user_123",
        trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
        trigger_data=trigger_data
    )
    
    assert notification is not None, "Educational notification should be generated"
    assert "Dividend Investing" in notification.title


@pytest.mark.asyncio
async def test_condition_not_met():
    """Test that notification is NOT generated when conditions not met"""
    print("\n🧪 Testing Condition Not Met (should NOT generate)...")
    
    # Setup
    repository = MockNotificationRepository()
    generate_use_case = GenerateNotificationUseCase(repository)
    
    # Test data - stock change too small to trigger notification
    trigger_data = {
        "stock_symbol": "AAPL",
        "change_percent": 2.0,  # Below 5.0 threshold
        "min_abs_change_percent": 2.0,
        "content_slug": "volatility_basics"
    }
    
    # Try to generate notification
    notification = await generate_use_case.execute(
        user_id="test_user_123",
        trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
        trigger_data=trigger_data
    )
    
    assert notification is None, "Notification should NOT be generated"


@pytest.mark.asyncio
async def test_user_notification_history():
    """Test retrieving user notification history"""
    print("\n🧪 Testing User Notification History...")
    
    # Setup
    repository = MockNotificationRepository()
    generate_use_case = GenerateNotificationUseCase(repository)
    
    user_id = "test_user_history"
    
    # Generate multiple notifications
    notifications = []
    
    # Portfolio change
    notification1 = await generate_use_case.execute(
        user_id=user_id,
        trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
        trigger_data={
            "stock_symbol": "NVDA",
            "change_percent": 12.0,
            "min_abs_change_percent": 12.0,
            "content_slug": "volatility_advanced"
        }
    )
    notifications.append(notification1)
    
    # Risk change
    notification2 = await generate_use_case.execute(
        user_id=user_id,
        trigger_type=NotificationTriggerType.RISK_CHANGE,
        trigger_data={
            "new_risk_level": "LOW",
            "risk_level_changed": True
        }
    )
    notifications.append(notification2)
    
    # Get user notification history
    user_notifications = await repository.get_user_notifications(user_id)
    
    assert len(user_notifications) == 2, "Should have 2 notifications"


# Integration test - full flow
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