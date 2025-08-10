"""
Unit Tests for JSON Notification Repository

@description Comprehensive test suite for JSON-based notification persistence
@layer Testing
@pattern Unit Testing with pytest
@coverage >90% target coverage

@author Capital Craft Team
@created 2025-01-15
"""
import pytest
import json
import tempfile
import os
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

from app.infrastructure.json_notification_repository import JSONNotificationRepository
from app.core.entities.notification import (
    Notification, 
    NotificationStatus, 
    NotificationTriggerType
)


class TestJSONNotificationRepository:
    """Test suite for JSONNotificationRepository"""
    
    @pytest.fixture
    def temp_data_file(self):
        """Create temporary data file for testing"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            initial_data = {"demo": []}
            json.dump(initial_data, f)
            temp_path = f.name
        
        yield temp_path
        
        # Cleanup
        if os.path.exists(temp_path):
            os.unlink(temp_path)
        backup_path = temp_path + '.backup'
        if os.path.exists(backup_path):
            os.unlink(backup_path)
    
    @pytest.fixture
    def repository(self, temp_data_file):
        """Create repository instance with temporary file"""
        return JSONNotificationRepository(temp_data_file)
    
    @pytest.fixture
    def sample_notification(self):
        """Create sample notification for testing"""
        return Notification(
            user_id="demo",
            trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
            title="Test Notification",
            message="This is a test notification",
            deep_link="/test",
            trigger_data={"test": "data"},
            notification_type="education",
            priority="medium"
        )
    
    @pytest.mark.asyncio
    async def test_save_notification_success(self, repository, sample_notification):
        """Test successful notification saving"""
        # Act
        await repository.save_notification(sample_notification)
        
        # Assert
        saved_notification = await repository.get_notification_by_id(sample_notification.id)
        assert saved_notification is not None
        assert saved_notification.title == "Test Notification"
        assert saved_notification.user_id == "demo"
        assert saved_notification.is_read == False
        assert saved_notification.dismissed == False
    
    @pytest.mark.asyncio
    async def test_save_notification_update_existing(self, repository, sample_notification):
        """Test updating existing notification"""
        # Arrange
        await repository.save_notification(sample_notification)
        
        # Act - modify and save again
        sample_notification.mark_as_read()
        await repository.save_notification(sample_notification)
        
        # Assert
        updated_notification = await repository.get_notification_by_id(sample_notification.id)
        assert updated_notification.is_read == True
    
    @pytest.mark.asyncio
    async def test_get_notification_by_id_success(self, repository, sample_notification):
        """Test successful notification retrieval by ID"""
        # Arrange
        await repository.save_notification(sample_notification)
        
        # Act
        result = await repository.get_notification_by_id(sample_notification.id)
        
        # Assert
        assert result is not None
        assert result.id == sample_notification.id
        assert result.title == sample_notification.title
    
    @pytest.mark.asyncio
    async def test_get_notification_by_id_not_found(self, repository):
        """Test notification retrieval with non-existent ID"""
        # Act
        result = await repository.get_notification_by_id("non-existent-id")
        
        # Assert
        assert result is None
    
    @pytest.mark.asyncio
    async def test_get_user_notifications_success(self, repository, sample_notification):
        """Test successful user notifications retrieval"""
        # Arrange
        await repository.save_notification(sample_notification)
        
        # Create second notification
        second_notification = Notification(
            user_id="demo",
            trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
            title="Second Notification",
            message="Second test notification",
            deep_link="/test2",
            trigger_data={"test": "data2"}
        )
        await repository.save_notification(second_notification)
        
        # Act
        notifications = await repository.get_user_notifications("demo")
        
        # Assert
        assert len(notifications) == 2
        assert notifications[0].created_at >= notifications[1].created_at  # Sorted by date desc
    
    @pytest.mark.asyncio
    async def test_get_user_notifications_excludes_dismissed(self, repository, sample_notification):
        """Test that dismissed notifications are excluded from user notifications"""
        # Arrange
        sample_notification.dismiss()
        await repository.save_notification(sample_notification)
        
        # Act
        notifications = await repository.get_user_notifications("demo")
        
        # Assert
        assert len(notifications) == 0
    
    @pytest.mark.asyncio
    async def test_get_user_notifications_with_limit(self, repository):
        """Test user notifications retrieval with limit"""
        # Arrange - create 5 notifications
        for i in range(5):
            notification = Notification(
                user_id="demo",
                trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
                title=f"Notification {i}",
                message=f"Test notification {i}",
                deep_link=f"/test{i}",
                trigger_data={"index": i}
            )
            await repository.save_notification(notification)
        
        # Act
        notifications = await repository.get_user_notifications("demo", limit=3)
        
        # Assert
        assert len(notifications) == 3
    
    @pytest.mark.asyncio
    async def test_mark_as_read_success(self, repository, sample_notification):
        """Test successful notification mark as read"""
        # Arrange
        await repository.save_notification(sample_notification)
        assert sample_notification.is_read == False
        
        # Act
        result = await repository.mark_as_read(sample_notification.id)
        
        # Assert
        assert result == True
        updated_notification = await repository.get_notification_by_id(sample_notification.id)
        assert updated_notification.is_read == True
    
    @pytest.mark.asyncio
    async def test_mark_as_read_not_found(self, repository):
        """Test mark as read with non-existent notification"""
        # Act
        result = await repository.mark_as_read("non-existent-id")
        
        # Assert
        assert result == False
    
    @pytest.mark.asyncio
    async def test_mark_as_read_dismissed_notification(self, repository, sample_notification):
        """Test mark as read fails for dismissed notification"""
        # Arrange
        sample_notification.dismiss()
        await repository.save_notification(sample_notification)
        
        # Act
        result = await repository.mark_as_read(sample_notification.id)
        
        # Assert
        assert result == False
    
    @pytest.mark.asyncio
    async def test_dismiss_notification_success(self, repository, sample_notification):
        """Test successful notification dismissal"""
        # Arrange
        await repository.save_notification(sample_notification)
        
        # Act
        result = await repository.dismiss_notification(sample_notification.id)
        
        # Assert
        assert result == True
        updated_notification = await repository.get_notification_by_id(sample_notification.id)
        assert updated_notification.dismissed == True
    
    @pytest.mark.asyncio
    async def test_dismiss_notification_not_found(self, repository):
        """Test dismiss notification with non-existent ID"""
        # Act
        result = await repository.dismiss_notification("non-existent-id")
        
        # Assert
        assert result == False
    
    @pytest.mark.asyncio
    async def test_dismiss_notification_already_dismissed(self, repository, sample_notification):
        """Test dismiss notification that's already dismissed"""
        # Arrange
        sample_notification.dismiss()
        await repository.save_notification(sample_notification)
        
        # Act
        result = await repository.dismiss_notification(sample_notification.id)
        
        # Assert
        assert result == False
    
    @pytest.mark.asyncio
    async def test_mark_all_as_read_success(self, repository):
        """Test successful mark all as read operation"""
        # Arrange - create 3 unread notifications
        for i in range(3):
            notification = Notification(
                user_id="demo",
                trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
                title=f"Notification {i}",
                message=f"Test notification {i}",
                deep_link=f"/test{i}",
                trigger_data={"index": i}
            )
            await repository.save_notification(notification)
        
        # Act
        marked_count = await repository.mark_all_as_read("demo")
        
        # Assert
        assert marked_count == 3
        notifications = await repository.get_user_notifications("demo")
        assert all(n.is_read for n in notifications)
    
    @pytest.mark.asyncio
    async def test_mark_all_as_read_excludes_dismissed(self, repository):
        """Test mark all as read excludes dismissed notifications"""
        # Arrange
        notification1 = Notification(
            user_id="demo",
            trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
            title="Notification 1",
            message="Test notification 1",
            deep_link="/test1",
            trigger_data={"index": 1}
        )
        await repository.save_notification(notification1)
        
        notification2 = Notification(
            user_id="demo",
            trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
            title="Notification 2",
            message="Test notification 2",
            deep_link="/test2",
            trigger_data={"index": 2}
        )
        notification2.dismiss()
        await repository.save_notification(notification2)
        
        # Act
        marked_count = await repository.mark_all_as_read("demo")
        
        # Assert
        assert marked_count == 1  # Only non-dismissed notification
    
    @pytest.mark.asyncio
    async def test_mark_all_as_read_no_notifications(self, repository):
        """Test mark all as read with no notifications"""
        # Act
        marked_count = await repository.mark_all_as_read("nonexistent-user")
        
        # Assert
        assert marked_count == 0
    
    @pytest.mark.asyncio
    async def test_persistence_across_repository_instances(self, temp_data_file, sample_notification):
        """Test data persistence across different repository instances"""
        # Arrange
        repo1 = JSONNotificationRepository(temp_data_file)
        await repo1.save_notification(sample_notification)
        
        # Act - create new repository instance
        repo2 = JSONNotificationRepository(temp_data_file)
        retrieved_notification = await repo2.get_notification_by_id(sample_notification.id)
        
        # Assert
        assert retrieved_notification is not None
        assert retrieved_notification.title == sample_notification.title
    
    def test_file_backup_creation(self, temp_data_file):
        """Test that backup files are created during writes"""
        # Arrange
        repository = JSONNotificationRepository(temp_data_file)
        
        # Create initial data
        with open(temp_data_file, 'w') as f:
            json.dump({"demo": [{"test": "data"}]}, f)
        
        # Act - trigger a write operation
        data = {"demo": [{"test": "updated_data"}]}
        repository._write_data(data)
        
        # Assert
        backup_path = Path(temp_data_file).with_suffix('.json.backup')
        assert backup_path.exists()
    
    def test_corrupted_file_recovery(self, temp_data_file):
        """Test recovery from corrupted JSON file"""
        # Arrange - corrupt the file
        with open(temp_data_file, 'w') as f:
            f.write("invalid json content")
        
        # Act
        repository = JSONNotificationRepository(temp_data_file)
        data = repository._read_data()
        
        # Assert - should return default structure
        assert data == {"demo": []}
    
    @pytest.mark.asyncio
    async def test_send_notification_mock_implementation(self, repository, sample_notification):
        """Test mock send notification implementation"""
        # Act
        result = await repository.send_notification(sample_notification)
        
        # Assert
        assert result == True
        assert sample_notification.status == NotificationStatus.SENT
        assert sample_notification.sent_at is not None
