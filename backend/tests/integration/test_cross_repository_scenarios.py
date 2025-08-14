"""
Integration Tests for Cross-Repository Scenarios

@description Tests Smart Repository routing, feature flag integration, and cross-database compatibility
@layer Integration Testing  
@pattern Cross-repository validation with feature flags
@coverage Smart repository routing, data format compatibility, feature flag scenarios

@author Capital Craft Team
@created 2025-01-15
"""
import pytest
import asyncio
import tempfile
import os
import json
from unittest.mock import patch, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone

from app.infrastructure.repositories.smart_notification_repository import SmartNotificationRepository
from app.infrastructure.repositories.postgresql_notification_repository import PostgreSQLNotificationRepository
from app.infrastructure.json_notification_repository import JSONNotificationRepository
from app.infrastructure.database.config import DatabaseConfig
from app.infrastructure.database.models import Base
from app.infrastructure.feature_flags import NotificationStorageFeatureFlags, StorageBackend
from app.core.entities.notification import Notification, NotificationTriggerType, NotificationStatus


class TestCrossRepositoryScenarios:
    """Integration tests for cross-repository scenarios and Smart Repository routing"""
    
    @pytest.fixture
    async def in_memory_db_config(self):
        """Create in-memory PostgreSQL-like database config"""
        engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        db_config = MagicMock()
        db_config.async_session = async_session
        
        yield db_config
        await engine.dispose()
    
    @pytest.fixture
    def temp_json_file(self):
        """Create temporary JSON file for JSON repository"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump({}, f)
            temp_path = f.name
        
        yield temp_path
        
        if os.path.exists(temp_path):
            os.unlink(temp_path)
        backup_path = temp_path + '.backup'
        if os.path.exists(backup_path):
            os.unlink(backup_path)
    
    @pytest.fixture
    async def postgresql_repository(self, in_memory_db_config):
        """Create PostgreSQL repository with in-memory database"""
        return PostgreSQLNotificationRepository(in_memory_db_config)
    
    @pytest.fixture
    def json_repository(self, temp_json_file):
        """Create JSON repository with temporary file"""
        return JSONNotificationRepository(temp_json_file)
    
    @pytest.fixture
    def mock_feature_flags(self):
        """Create mock feature flags for testing different scenarios"""
        feature_flags = MagicMock(spec=NotificationStorageFeatureFlags)
        
        # Configure realistic return values for performance monitoring
        feature_flags.is_performance_monitoring_enabled.return_value = True
        feature_flags.get_performance_config.return_value = {
            "enabled": True,
            "log_slow_queries": True,
            "slow_query_threshold_ms": 1000,
            "compare_backends": False
        }
        
        # Configure dual write as disabled by default
        feature_flags.is_dual_write_enabled.return_value = False
        
        return feature_flags
    
    @pytest.fixture
    async def smart_repository(self, postgresql_repository, json_repository, mock_feature_flags):
        """Create Smart Repository with mocked backends"""
        smart_repo = SmartNotificationRepository()
        
        # Replace internal repositories with test versions
        smart_repo.json_repo = json_repository
        smart_repo._postgres_repo = postgresql_repository
        smart_repo.feature_flags = mock_feature_flags
        
        return smart_repo
    
    @pytest.fixture
    def sample_notification(self):
        """Create sample notification for testing"""
        return Notification(
            user_id="cross-test-user",
            trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
            title="Cross Repository Test",
            message="Testing cross-repository functionality",
            deep_link="/cross-test",
            trigger_data={"test": "cross_repo_data", "compatibility": True},
            priority="high",
            notification_type="education"
        )
    
    @pytest.mark.asyncio
    async def test_smart_repository_routes_to_json_by_default(self, smart_repository, mock_feature_flags, sample_notification):
        """Test that Smart Repository routes to JSON by default"""
        # Arrange
        mock_feature_flags.get_storage_backend_for_user.return_value = StorageBackend.JSON
        
        # Act
        await smart_repository.save_notification(sample_notification)
        
        # Assert
        mock_feature_flags.get_storage_backend_for_user.assert_called_once_with("cross-test-user")
        
        # Verify it was saved to JSON repository (can retrieve it)
        retrieved = await smart_repository.get_notification_by_id(sample_notification.id)
        assert retrieved is not None
        assert retrieved.user_id == sample_notification.user_id
    
    @pytest.mark.asyncio
    async def test_smart_repository_routes_to_postgresql_when_flagged(self, smart_repository, mock_feature_flags, sample_notification):
        """Test that Smart Repository routes to PostgreSQL when feature flag is enabled"""
        # Arrange
        mock_feature_flags.get_storage_backend_for_user.return_value = StorageBackend.POSTGRESQL
        
        # Act
        await smart_repository.save_notification(sample_notification)
        
        # Assert
        mock_feature_flags.get_storage_backend_for_user.assert_called_once_with("cross-test-user")
        
        # Verify it was saved to PostgreSQL repository
        retrieved = await smart_repository.get_notification_by_id(sample_notification.id)
        assert retrieved is not None
        assert retrieved.user_id == sample_notification.user_id
    
    @pytest.mark.asyncio
    async def test_cross_repository_data_format_compatibility(self, postgresql_repository, json_repository):
        """Test that data formats are compatible between repositories"""
        # Create notification with complex trigger_data
        notification = Notification(
            user_id="format-test-user",
            trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
            title="Format Compatibility Test",
            message="Testing data format compatibility",
            deep_link="/format-test",
            trigger_data={
                "portfolio_value": 15000.50,
                "change_percentage": -2.3,
                "symbols": ["AAPL", "GOOGL", "MSFT"],
                "risk_level": "moderate",
                "nested": {
                    "metrics": {"volatility": 0.15, "sharpe_ratio": 1.2},
                    "flags": {"is_diversified": True, "has_growth_stocks": True}
                }
            },
            priority="medium",
            notification_type="portfolio"
        )
        
        # Save to PostgreSQL
        await postgresql_repository.save_notification(notification)
        pg_retrieved = await postgresql_repository.get_notification_by_id(notification.id)
        
        # Save to JSON
        await json_repository.save_notification(notification)
        json_retrieved = await json_repository.get_notification_by_id(notification.id)
        
        # Assert both repositories preserve data structure
        assert pg_retrieved.trigger_data == notification.trigger_data
        assert json_retrieved.trigger_data == notification.trigger_data
        assert pg_retrieved.trigger_data == json_retrieved.trigger_data
        
        # Assert complex nested data is preserved
        assert pg_retrieved.trigger_data["nested"]["metrics"]["volatility"] == 0.15
        assert json_retrieved.trigger_data["nested"]["flags"]["is_diversified"] == True
        assert pg_retrieved.trigger_data["symbols"] == ["AAPL", "GOOGL", "MSFT"]
    
    @pytest.mark.asyncio
    async def test_user_specific_backend_selection(self, smart_repository, mock_feature_flags):
        """Test user-specific backend selection via feature flags"""
        # Create notifications for different users
        user1_notification = Notification(
            user_id="json-user",
            trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
            title="JSON User Notification",
            message="This user uses JSON storage",
            deep_link="/json-user",
            trigger_data={"backend": "json"}
        )
        
        user2_notification = Notification(
            user_id="postgres-user", 
            trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
            title="PostgreSQL User Notification",
            message="This user uses PostgreSQL storage",
            deep_link="/postgres-user",
            trigger_data={"backend": "postgresql"}
        )
        
        # Configure feature flags for different users
        def mock_backend_selection(user_id):
            if user_id == "json-user":
                return StorageBackend.JSON
            elif user_id == "postgres-user":
                return StorageBackend.POSTGRESQL
            return StorageBackend.JSON
        
        mock_feature_flags.get_storage_backend_for_user.side_effect = mock_backend_selection
        
        # Act
        await smart_repository.save_notification(user1_notification)
        await smart_repository.save_notification(user2_notification)
        
        # Assert correct backend selection calls
        assert mock_feature_flags.get_storage_backend_for_user.call_count == 2
        mock_feature_flags.get_storage_backend_for_user.assert_any_call("json-user")
        mock_feature_flags.get_storage_backend_for_user.assert_any_call("postgres-user")
        
        # Verify both notifications can be retrieved
        retrieved_user1 = await smart_repository.get_notification_by_id(user1_notification.id)
        retrieved_user2 = await smart_repository.get_notification_by_id(user2_notification.id)
        
        assert retrieved_user1 is not None
        assert retrieved_user2 is not None
        assert retrieved_user1.user_id == "json-user"
        assert retrieved_user2.user_id == "postgres-user"
    
    @pytest.mark.asyncio
    async def test_notification_status_updates_across_backends(self, smart_repository, mock_feature_flags, sample_notification):
        """Test that notification status updates work across different backends"""
        # Test with PostgreSQL backend
        mock_feature_flags.get_storage_backend_for_user.return_value = StorageBackend.POSTGRESQL
        
        # Save and mark as read
        await smart_repository.save_notification(sample_notification)
        success = await smart_repository.mark_as_read(sample_notification.id)
        
        assert success == True
        
        # Verify status update
        retrieved = await smart_repository.get_notification_by_id(sample_notification.id)
        assert retrieved.is_read == True
        assert retrieved.updated_at is not None
        
        # Test dismissal
        dismiss_success = await smart_repository.dismiss_notification(sample_notification.id)
        assert dismiss_success == True
        
        # Verify dismissal
        retrieved_after_dismiss = await smart_repository.get_notification_by_id(sample_notification.id)
        assert retrieved_after_dismiss.dismissed == True
    
    @pytest.mark.asyncio 
    async def test_bulk_operations_across_backends(self, smart_repository, mock_feature_flags):
        """Test bulk operations (mark all as read) work across backends"""
        user_id = "bulk-test-user"
        
        # Configure to use PostgreSQL
        mock_feature_flags.get_storage_backend_for_user.return_value = StorageBackend.POSTGRESQL
        
        # Create multiple notifications
        notifications = []
        for i in range(3):
            notification = Notification(
                user_id=user_id,
                trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
                title=f"Bulk Test Notification {i}",
                message=f"Message {i}",
                deep_link=f"/bulk-test/{i}",
                trigger_data={"index": i}
            )
            notifications.append(notification)
            await smart_repository.save_notification(notification)
        
        # Act
        marked_count = await smart_repository.mark_all_as_read(user_id)
        
        # Assert
        assert marked_count == 3
        
        # Verify all are marked as read
        user_notifications = await smart_repository.get_user_notifications(user_id)
        for notification in user_notifications:
            assert notification.is_read == True
    
    @pytest.mark.asyncio
    async def test_similar_notification_detection_across_backends(self, smart_repository, mock_feature_flags):
        """Test similar notification detection works across different backends"""
        # Use JSON backend for this test (PostgreSQL JSONB operators don't work with SQLite)
        mock_feature_flags.get_storage_backend_for_user.return_value = StorageBackend.JSON
        
        # Create initial notification
        initial_notification = Notification(
            user_id="similarity-test-user",
            trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
            title="Portfolio Alert",
            message="Your portfolio has changed",
            deep_link="/portfolio",
            trigger_data={"symbol": "AAPL", "action": "buy", "amount": 100}
        )
        
        await smart_repository.save_notification(initial_notification)
        
        # Try to find similar notification
        similar = await smart_repository.find_similar_notification(
            "similarity-test-user",
            NotificationTriggerType.PORTFOLIO_CHANGE,
            {"symbol": "AAPL", "action": "buy"},
            within_hours=24
        )
        
        # Assert similar notification was found
        assert similar is not None
        assert similar.id == initial_notification.id
        assert similar.user_id == "similarity-test-user"
        assert similar.trigger_data["symbol"] == "AAPL"
    
    @pytest.mark.asyncio
    async def test_feature_flag_consistency_across_operations(self, smart_repository, mock_feature_flags, sample_notification):
        """Test that feature flag decisions are consistent across all repository operations for a user"""
        user_id = "consistency-test-user"
        sample_notification.user_id = user_id
        
        # Configure feature flags to always return PostgreSQL for this user
        mock_feature_flags.get_storage_backend_for_user.return_value = StorageBackend.POSTGRESQL
        
        # Perform multiple operations
        await smart_repository.save_notification(sample_notification)
        await smart_repository.mark_as_read(sample_notification.id)
        retrieved = await smart_repository.get_notification_by_id(sample_notification.id)
        user_notifications = await smart_repository.get_user_notifications(user_id)
        await smart_repository.dismiss_notification(sample_notification.id)
        
        # Assert feature flag was called for user-specific operations
        # get_storage_backend_for_user should be called for operations that need to route to specific backend
        assert mock_feature_flags.get_storage_backend_for_user.call_count >= 1
        
        # Verify all operations worked correctly
        assert retrieved is not None
        assert retrieved.is_read == True
        assert len(user_notifications) >= 1
    
    @pytest.mark.asyncio
    async def test_error_handling_cross_repository_fallback(self, smart_repository, mock_feature_flags, sample_notification):
        """Test error handling when one repository fails (simulate fallback scenarios)"""
        # Configure to use PostgreSQL
        mock_feature_flags.get_storage_backend_for_user.return_value = StorageBackend.POSTGRESQL
        
        # Mock PostgreSQL repository to fail
        with patch.object(smart_repository.postgres_repo, 'save_notification', side_effect=Exception("PostgreSQL unavailable")):
            # This should handle the error gracefully
            with pytest.raises(Exception) as exc_info:
                await smart_repository.save_notification(sample_notification)
            
            assert "PostgreSQL unavailable" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_datetime_handling_consistency(self, postgresql_repository, json_repository):
        """Test that datetime handling is consistent between repositories"""
        # Create notification with specific datetime
        test_time = datetime.now(timezone.utc)
        notification = Notification(
            user_id="datetime-test-user",
            trigger_type=NotificationTriggerType.RISK_CHANGE,
            title="DateTime Test",
            message="Testing datetime consistency",
            deep_link="/datetime-test",
            trigger_data={"timestamp": test_time.isoformat()}
        )
        notification.created_at = test_time
        notification.updated_at = test_time
        
        # Save to both repositories
        await postgresql_repository.save_notification(notification)
        await json_repository.save_notification(notification)
        
        # Retrieve from both
        pg_retrieved = await postgresql_repository.get_notification_by_id(notification.id)
        json_retrieved = await json_repository.get_notification_by_id(notification.id)
        
        # Ensure both datetimes are timezone-aware for comparison
        pg_created = pg_retrieved.created_at
        json_created = json_retrieved.created_at
        
        # If one is naive, make both naive for comparison
        if pg_created.tzinfo is None and json_created.tzinfo is not None:
            json_created = json_created.replace(tzinfo=None)
        elif pg_created.tzinfo is not None and json_created.tzinfo is None:
            pg_created = pg_created.replace(tzinfo=None)
        
        # Assert datetime consistency (within reasonable tolerance)
        assert abs((pg_created - json_created).total_seconds()) < 1
        
        # Test datetime operations
        await postgresql_repository.mark_as_read(notification.id)
        await json_repository.mark_as_read(notification.id)
        
        pg_after_read = await postgresql_repository.get_notification_by_id(notification.id)
        json_after_read = await json_repository.get_notification_by_id(notification.id)
        
        assert pg_after_read.is_read == True
        assert json_after_read.is_read == True
        assert pg_after_read.updated_at is not None
        assert json_after_read.updated_at is not None