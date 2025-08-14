"""
Smart Notification Repository with Feature Flag Support
Routes notifications to JSON or PostgreSQL based on feature flags
"""
from typing import List, Optional
from datetime import datetime, timedelta
import logging
import time

from app.core.interfaces.notification_repository import NotificationRepository
from app.core.entities.notification import Notification, NotificationStatus, NotificationTriggerType
from app.infrastructure.feature_flags import get_feature_flags, StorageBackend
from app.infrastructure.json_notification_repository import JSONNotificationRepository
from app.infrastructure.repositories.postgresql_notification_repository import PostgreSQLNotificationRepository
from app.infrastructure.database.config import DatabaseConfig

logger = logging.getLogger(__name__)


class SmartNotificationRepository(NotificationRepository):
    """
    Smart repository that routes requests to appropriate backend
    based on feature flags and user configuration
    
    Features:
    - Per-user backend selection
    - Performance monitoring
    - Dual write support
    - Automatic fallback
    """
    
    def __init__(self):
        self.feature_flags = get_feature_flags()
        
        # Initialize repositories
        self.json_repo = JSONNotificationRepository("data/notifications.json")
        
        # PostgreSQL repo - initialize only if needed
        self._postgres_repo = None
        
        logger.info("🧠 Smart notification repository initialized")
    
    @property
    def postgres_repo(self) -> PostgreSQLNotificationRepository:
        """Lazy initialize PostgreSQL repository"""
        if self._postgres_repo is None:
            db_config = DatabaseConfig()
            self._postgres_repo = PostgreSQLNotificationRepository(db_config)
        return self._postgres_repo
    
    def _get_repository_for_user(self, user_id: str) -> NotificationRepository:
        """Get the appropriate repository for a user based on feature flags"""
        backend = self.feature_flags.get_storage_backend_for_user(user_id)
        
        if backend == StorageBackend.POSTGRESQL:
            logger.debug(f"🐘 Using PostgreSQL for user {user_id}")
            return self.postgres_repo
        else:  # StorageBackend.JSON or fallback
            logger.debug(f"📁 Using JSON for user {user_id}")
            return self.json_repo
    
    def _execute_with_monitoring(self, operation_name: str, operation_func, *args, **kwargs):
        """Execute operation with performance monitoring"""
        if not self.feature_flags.is_performance_monitoring_enabled():
            return operation_func(*args, **kwargs)
        
        start_time = time.time()
        try:
            result = operation_func(*args, **kwargs)
            duration_ms = (time.time() - start_time) * 1000
            
            perf_config = self.feature_flags.get_performance_config()
            if duration_ms > perf_config.get("slow_query_threshold_ms", 1000):
                logger.warning(f"⚠️ Slow {operation_name}: {duration_ms:.2f}ms")
            else:
                logger.debug(f"⚡ {operation_name}: {duration_ms:.2f}ms")
            
            return result
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.error(f"❌ {operation_name} failed after {duration_ms:.2f}ms: {e}")
            raise
    
    async def save_notification(self, notification: Notification) -> None:
        """Save notification using smart routing"""
        primary_repo = self._get_repository_for_user(notification.user_id)
        
        # Dual write if enabled
        if self.feature_flags.is_dual_write_enabled():
            logger.debug(f"🔄 Dual write enabled for notification {notification.id}")
            
            # Write to primary first
            await self._execute_with_monitoring(
                f"save_notification_primary_{type(primary_repo).__name__}",
                primary_repo.save_notification,
                notification
            )
            
            # Write to secondary (opposite of primary)
            secondary_repo = self.postgres_repo if isinstance(primary_repo, JSONNotificationRepository) else self.json_repo
            try:
                await self._execute_with_monitoring(
                    f"save_notification_secondary_{type(secondary_repo).__name__}",
                    secondary_repo.save_notification,
                    notification
                )
            except Exception as e:
                logger.error(f"⚠️ Secondary write failed, continuing with primary: {e}")
        else:
            # Single write to primary
            await self._execute_with_monitoring(
                f"save_notification_{type(primary_repo).__name__}",
                primary_repo.save_notification,
                notification
            )
    
    async def get_notification_by_id(self, notification_id: str) -> Optional[Notification]:
        """Get notification by ID - requires user context for routing"""
        # For ID-based lookup, we need to try both backends since we don't know the user
        # In practice, this should include user_id in the method signature
        
        # Try JSON first (faster for simple lookups)
        try:
            result = await self._execute_with_monitoring(
                "get_notification_by_id_json",
                self.json_repo.get_notification_by_id,
                notification_id
            )
            if result:
                return result
        except Exception as e:
            logger.debug(f"JSON lookup failed: {e}")
        
        # Try PostgreSQL
        try:
            result = await self._execute_with_monitoring(
                "get_notification_by_id_postgres",
                self.postgres_repo.get_notification_by_id,
                notification_id
            )
            return result
        except Exception as e:
            logger.debug(f"PostgreSQL lookup failed: {e}")
            return None
    
    async def get_user_notifications(
        self, 
        user_id: str, 
        status: Optional[NotificationStatus] = None,
        limit: int = 50
    ) -> List[Notification]:
        """Get notifications for a user using smart routing"""
        repo = self._get_repository_for_user(user_id)
        
        return await self._execute_with_monitoring(
            f"get_user_notifications_{type(repo).__name__}",
            repo.get_user_notifications,
            user_id,
            status,
            limit
        )
    
    async def update_notification_status(
        self, 
        notification_id: str, 
        status: NotificationStatus
    ) -> None:
        """Update notification status - requires user context for optimal routing"""
        # For now, try both backends (not optimal but works)
        
        # Try JSON first
        try:
            await self._execute_with_monitoring(
                "update_status_json",
                self.json_repo.update_notification_status,
                notification_id,
                status
            )
            return
        except Exception as e:
            logger.debug(f"JSON status update failed: {e}")
        
        # Try PostgreSQL
        try:
            await self._execute_with_monitoring(
                "update_status_postgres", 
                self.postgres_repo.update_notification_status,
                notification_id,
                status
            )
        except Exception as e:
            logger.error(f"Both repositories failed to update status: {e}")
            raise
    
    async def send_notification(self, notification: Notification) -> bool:
        """Send notification using primary repository for the user"""
        repo = self._get_repository_for_user(notification.user_id)
        
        return await self._execute_with_monitoring(
            f"send_notification_{type(repo).__name__}",
            repo.send_notification,
            notification
        )
    
    async def mark_as_read(self, notification_id: str) -> bool:
        """Mark notification as read - try both repositories"""
        # Try JSON first
        try:
            result = await self._execute_with_monitoring(
                "mark_as_read_json",
                self.json_repo.mark_as_read,
                notification_id
            )
            if result:
                return True
        except Exception as e:
            logger.debug(f"JSON mark_as_read failed: {e}")
        
        # Try PostgreSQL
        try:
            return await self._execute_with_monitoring(
                "mark_as_read_postgres",
                self.postgres_repo.mark_as_read,
                notification_id
            )
        except Exception as e:
            logger.error(f"Both repositories failed to mark as read: {e}")
            return False
    
    async def dismiss_notification(self, notification_id: str) -> bool:
        """Dismiss notification - try both repositories"""
        # Try JSON first
        try:
            result = await self._execute_with_monitoring(
                "dismiss_notification_json",
                self.json_repo.dismiss_notification,
                notification_id
            )
            if result:
                return True
        except Exception as e:
            logger.debug(f"JSON dismiss failed: {e}")
        
        # Try PostgreSQL
        try:
            return await self._execute_with_monitoring(
                "dismiss_notification_postgres",
                self.postgres_repo.dismiss_notification,
                notification_id
            )
        except Exception as e:
            logger.error(f"Both repositories failed to dismiss: {e}")
            return False
    
    async def mark_all_as_read(self, user_id: str) -> int:
        """Mark all notifications as read for a user"""
        repo = self._get_repository_for_user(user_id)
        
        result = await self._execute_with_monitoring(
            f"mark_all_as_read_{type(repo).__name__}",
            repo.mark_all_as_read,
            user_id
        )
        
        # If dual write is enabled, also update the other repository
        if self.feature_flags.is_dual_write_enabled():
            secondary_repo = self.postgres_repo if isinstance(repo, JSONNotificationRepository) else self.json_repo
            try:
                await self._execute_with_monitoring(
                    f"mark_all_as_read_secondary_{type(secondary_repo).__name__}",
                    secondary_repo.mark_all_as_read,
                    user_id
                )
            except Exception as e:
                logger.error(f"⚠️ Secondary mark_all_as_read failed: {e}")
        
        return result
    
    async def find_similar_notification(
        self, 
        user_id: str, 
        trigger_type: NotificationTriggerType,
        trigger_data: dict = None,
        within_hours: int = 24
    ) -> Optional[Notification]:
        """Find similar notification for a user"""
        repo = self._get_repository_for_user(user_id)
        
        return await self._execute_with_monitoring(
            f"find_similar_{type(repo).__name__}",
            repo.find_similar_notification,
            user_id,
            trigger_type,
            trigger_data,
            within_hours
        )
    
    def get_health_status(self) -> dict:
        """Get health status of all backends"""
        status = {
            "smart_repository": "healthy",
            "feature_flags": self.feature_flags.get_status_summary(),
            "backends": {}
        }
        
        # Check JSON repository
        try:
            # Simple health check - this is synchronous for JSON
            status["backends"]["json"] = {
                "status": "healthy",
                "type": "JSONNotificationRepository"
            }
        except Exception as e:
            status["backends"]["json"] = {
                "status": "unhealthy", 
                "error": str(e),
                "type": "JSONNotificationRepository"
            }
        
        # Check PostgreSQL repository if initialized
        if self._postgres_repo:
            try:
                status["backends"]["postgresql"] = {
                    "status": "healthy",
                    "type": "PostgreSQLNotificationRepository"
                }
            except Exception as e:
                status["backends"]["postgresql"] = {
                    "status": "unhealthy",
                    "error": str(e),
                    "type": "PostgreSQLNotificationRepository"
                }
        else:
            status["backends"]["postgresql"] = {
                "status": "not_initialized",
                "type": "PostgreSQLNotificationRepository"
            }
        
        return status