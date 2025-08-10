"""
Unit Tests for Notification Use Cases

@description Comprehensive test suite for notification use cases following Clean Architecture
@layer Testing
@pattern Unit Testing with pytest and mocks
@coverage >90% target coverage

@author Capital Craft Team
@created 2025-01-15
"""
import pytest
from unittest.mock import AsyncMock, Mock

from app.use_cases.mark_notification_as_read import (
    MarkNotificationAsReadUseCase,
    NotificationNotFoundError,
    NotificationAlreadyDismissedError
)
from app.use_cases.dismiss_notification import DismissNotificationUseCase
from app.use_cases.mark_all_notifications_as_read import MarkAllNotificationsAsReadUseCase
from app.core.entities.notification import (
    Notification,
    NotificationTriggerType,
    NotificationStatus
)


class TestMarkNotificationAsReadUseCase:
    """Test suite for MarkNotificationAsReadUseCase"""
    
    @pytest.fixture
    def mock_repository(self):
        """Create mock notification repository"""
        return AsyncMock()
    
    @pytest.fixture
    def use_case(self, mock_repository):
        """Create use case instance with mock repository"""
        return MarkNotificationAsReadUseCase(mock_repository)
    
    @pytest.fixture
    def sample_notification(self):
        """Create sample notification for testing"""
        return Notification(
            id="test-id",
            user_id="demo",
            trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
            title="Test Notification",
            message="This is a test notification",
            deep_link="/test",
            trigger_data={"test": "data"}
        )
    
    @pytest.mark.asyncio
    async def test_execute_success(self, use_case, mock_repository, sample_notification):
        """Test successful mark as read execution"""
        # Arrange
        mock_repository.get_notification_by_id.return_value = sample_notification
        mock_repository.save_notification.return_value = None
        
        # Act
        result = await use_case.execute("test-id")
        
        # Assert
        assert result.is_read == True
        mock_repository.get_notification_by_id.assert_called_once_with("test-id")
        mock_repository.save_notification.assert_called_once_with(sample_notification)
    
    @pytest.mark.asyncio
    async def test_execute_notification_not_found(self, use_case, mock_repository):
        """Test execution with non-existent notification"""
        # Arrange
        mock_repository.get_notification_by_id.return_value = None
        
        # Act & Assert
        with pytest.raises(NotificationNotFoundError) as exc_info:
            await use_case.execute("non-existent-id")
        
        assert "Notification with ID non-existent-id not found" in str(exc_info.value)
        mock_repository.save_notification.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_execute_dismissed_notification(self, use_case, mock_repository, sample_notification):
        """Test execution with dismissed notification"""
        # Arrange
        sample_notification.dismiss()
        mock_repository.get_notification_by_id.return_value = sample_notification
        
        # Act & Assert
        with pytest.raises(NotificationAlreadyDismissedError) as exc_info:
            await use_case.execute("test-id")
        
        assert "Cannot modify dismissed notification test-id" in str(exc_info.value)
        mock_repository.save_notification.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_execute_repository_error(self, use_case, mock_repository):
        """Test execution with repository error"""
        # Arrange
        mock_repository.get_notification_by_id.side_effect = Exception("Database error")
        
        # Act & Assert
        with pytest.raises(Exception) as exc_info:
            await use_case.execute("test-id")
        
        assert "Database error" in str(exc_info.value)


class TestDismissNotificationUseCase:
    """Test suite for DismissNotificationUseCase"""
    
    @pytest.fixture
    def mock_repository(self):
        """Create mock notification repository"""
        return AsyncMock()
    
    @pytest.fixture
    def use_case(self, mock_repository):
        """Create use case instance with mock repository"""
        return DismissNotificationUseCase(mock_repository)
    
    @pytest.fixture
    def sample_notification(self):
        """Create sample notification for testing"""
        return Notification(
            id="test-id",
            user_id="demo",
            trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
            title="Test Notification",
            message="This is a test notification",
            deep_link="/test",
            trigger_data={"test": "data"}
        )
    
    @pytest.mark.asyncio
    async def test_execute_success(self, use_case, mock_repository, sample_notification):
        """Test successful dismiss execution"""
        # Arrange
        mock_repository.get_notification_by_id.return_value = sample_notification
        mock_repository.save_notification.return_value = None
        
        # Act
        result = await use_case.execute("test-id")
        
        # Assert
        assert result.dismissed == True
        mock_repository.get_notification_by_id.assert_called_once_with("test-id")
        mock_repository.save_notification.assert_called_once_with(sample_notification)
    
    @pytest.mark.asyncio
    async def test_execute_notification_not_found(self, use_case, mock_repository):
        """Test execution with non-existent notification"""
        # Arrange
        mock_repository.get_notification_by_id.return_value = None
        
        # Act & Assert
        with pytest.raises(NotificationNotFoundError) as exc_info:
            await use_case.execute("non-existent-id")
        
        assert "Notification with ID non-existent-id not found" in str(exc_info.value)
        mock_repository.save_notification.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_execute_already_dismissed(self, use_case, mock_repository, sample_notification):
        """Test execution with already dismissed notification"""
        # Arrange
        sample_notification.dismiss()
        mock_repository.get_notification_by_id.return_value = sample_notification
        
        # Act & Assert
        with pytest.raises(NotificationAlreadyDismissedError) as exc_info:
            await use_case.execute("test-id")
        
        assert "Notification test-id is already dismissed" in str(exc_info.value)
        mock_repository.save_notification.assert_not_called()


class TestMarkAllNotificationsAsReadUseCase:
    """Test suite for MarkAllNotificationsAsReadUseCase"""
    
    @pytest.fixture
    def mock_repository(self):
        """Create mock notification repository"""
        return AsyncMock()
    
    @pytest.fixture
    def use_case(self, mock_repository):
        """Create use case instance with mock repository"""
        return MarkAllNotificationsAsReadUseCase(mock_repository)
    
    @pytest.mark.asyncio
    async def test_execute_success(self, use_case, mock_repository):
        """Test successful mark all as read execution"""
        # Arrange
        mock_repository.mark_all_as_read.return_value = 5
        
        # Act
        result = await use_case.execute("demo")
        
        # Assert
        assert result == 5
        mock_repository.mark_all_as_read.assert_called_once_with("demo")
    
    @pytest.mark.asyncio
    async def test_execute_no_notifications(self, use_case, mock_repository):
        """Test execution with no notifications to mark"""
        # Arrange
        mock_repository.mark_all_as_read.return_value = 0
        
        # Act
        result = await use_case.execute("demo")
        
        # Assert
        assert result == 0
        mock_repository.mark_all_as_read.assert_called_once_with("demo")
    
    @pytest.mark.asyncio
    async def test_execute_repository_error(self, use_case, mock_repository):
        """Test execution with repository error"""
        # Arrange
        mock_repository.mark_all_as_read.side_effect = Exception("Database error")
        
        # Act & Assert
        with pytest.raises(Exception) as exc_info:
            await use_case.execute("demo")
        
        assert "Database error" in str(exc_info.value)
