"""
PostgreSQL Notification Repository Implementation
Implements NotificationRepository interface with PostgreSQL backend
"""
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, or_, func
from sqlalchemy.exc import SQLAlchemyError
import logging

from app.core.interfaces.notification_repository import NotificationRepository
from app.core.entities.notification import Notification, NotificationStatus, NotificationTriggerType
from app.infrastructure.database.models import NotificationModel
from app.infrastructure.database.config import DatabaseConfig


logger = logging.getLogger(__name__)


class PostgreSQLNotificationRepository(NotificationRepository):
    """
    PostgreSQL implementation of NotificationRepository
    Uses async SQLAlchemy for database operations
    """
    
    def __init__(self, db_config: DatabaseConfig):
        self.db_config = db_config
    
    async def save_notification(self, notification: Notification) -> None:
        """Save notification to PostgreSQL database"""
        try:
            async with self.db_config.async_session() as session:
                # Convert domain entity to database model
                db_notification = self._to_model(notification)
                
                session.add(db_notification)
                await session.commit()
                
                # Update domain entity with generated ID if needed
                if not notification.id:
                    notification.id = str(db_notification.id)
                    
                logger.debug(f"💾 Saved notification {notification.id} for user {notification.user_id}")
                
        except SQLAlchemyError as e:
            logger.error(f"❌ Failed to save notification: {e}")
            raise Exception(f"Database error saving notification: {e}")
    
    async def get_notification_by_id(self, notification_id: str) -> Optional[Notification]:
        """Retrieve notification by ID"""
        try:
            async with self.db_config.async_session() as session:
                stmt = select(NotificationModel).where(NotificationModel.id == notification_id)
                result = await session.execute(stmt)
                db_notification = result.scalar_one_or_none()
                
                if db_notification:
                    return self._to_entity(db_notification)
                return None
                
        except SQLAlchemyError as e:
            logger.error(f"❌ Failed to get notification {notification_id}: {e}")
            raise Exception(f"Database error retrieving notification: {e}")
    
    async def get_user_notifications(
        self, 
        user_id: str, 
        status: Optional[NotificationStatus] = None,
        limit: int = 50
    ) -> List[Notification]:
        """Get notifications for a user with optional status filter"""
        try:
            async with self.db_config.async_session() as session:
                # Base query
                stmt = select(NotificationModel).where(NotificationModel.user_id == user_id)
                
                # Add status filter if provided
                if status:
                    if status == NotificationStatus.UNREAD:
                        stmt = stmt.where(and_(
                            NotificationModel.is_read == False,
                            NotificationModel.dismissed == False
                        ))
                    elif status == NotificationStatus.READ:
                        stmt = stmt.where(and_(
                            NotificationModel.is_read == True,
                            NotificationModel.dismissed == False
                        ))
                    elif status == NotificationStatus.DISMISSED:
                        stmt = stmt.where(NotificationModel.dismissed == True)
                
                # Order by creation date (newest first) and limit
                stmt = stmt.order_by(NotificationModel.created_at.desc()).limit(limit)
                
                result = await session.execute(stmt)
                db_notifications = result.scalars().all()
                
                return [self._to_entity(db_notif) for db_notif in db_notifications]
                
        except SQLAlchemyError as e:
            logger.error(f"❌ Failed to get notifications for user {user_id}: {e}")
            raise Exception(f"Database error retrieving user notifications: {e}")
    
    async def update_notification_status(
        self, 
        notification_id: str, 
        status: NotificationStatus
    ) -> None:
        """Update notification status"""
        try:
            async with self.db_config.async_session() as session:
                # Prepare update values based on status
                update_values = {"updated_at": datetime.now(timezone.utc)}
                
                if status == NotificationStatus.READ:
                    update_values["is_read"] = True
                elif status == NotificationStatus.DISMISSED:
                    update_values["dismissed"] = True
                elif status == NotificationStatus.UNREAD:
                    update_values["is_read"] = False
                    update_values["dismissed"] = False
                
                stmt = update(NotificationModel).where(
                    NotificationModel.id == notification_id
                ).values(**update_values)
                
                result = await session.execute(stmt)
                await session.commit()
                
                if result.rowcount == 0:
                    logger.warning(f"⚠️ Notification {notification_id} not found for status update")
                else:
                    logger.debug(f"✅ Updated notification {notification_id} status to {status}")
                    
        except SQLAlchemyError as e:
            logger.error(f"❌ Failed to update notification {notification_id} status: {e}")
            raise Exception(f"Database error updating notification status: {e}")
    
    async def send_notification(self, notification: Notification) -> bool:
        """
        Send notification via delivery mechanism
        For now, just marks as sent - delivery providers handled elsewhere
        """
        try:
            async with self.db_config.async_session() as session:
                stmt = update(NotificationModel).where(
                    NotificationModel.id == notification.id
                ).values(
                    status="sent",
                    sent_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                
                result = await session.execute(stmt)
                await session.commit()
                
                success = result.rowcount > 0
                if success:
                    logger.debug(f"📤 Marked notification {notification.id} as sent")
                else:
                    logger.warning(f"⚠️ Notification {notification.id} not found for sending")
                
                return success
                
        except SQLAlchemyError as e:
            logger.error(f"❌ Failed to send notification {notification.id}: {e}")
            return False
    
    async def mark_as_read(self, notification_id: str) -> bool:
        """Mark notification as read"""
        try:
            async with self.db_config.async_session() as session:
                stmt = update(NotificationModel).where(
                    NotificationModel.id == notification_id
                ).values(
                    is_read=True,
                    updated_at=datetime.now(timezone.utc)
                )
                
                result = await session.execute(stmt)
                await session.commit()
                
                success = result.rowcount > 0
                if success:
                    logger.debug(f"✅ Marked notification {notification_id} as read")
                else:
                    logger.warning(f"⚠️ Notification {notification_id} not found for marking as read")
                
                return success
                
        except SQLAlchemyError as e:
            logger.error(f"❌ Failed to mark notification {notification_id} as read: {e}")
            return False
    
    async def dismiss_notification(self, notification_id: str) -> bool:
        """Dismiss notification (soft delete)"""
        try:
            async with self.db_config.async_session() as session:
                stmt = update(NotificationModel).where(
                    NotificationModel.id == notification_id
                ).values(
                    dismissed=True,
                    updated_at=datetime.now(timezone.utc)
                )
                
                result = await session.execute(stmt)
                await session.commit()
                
                success = result.rowcount > 0
                if success:
                    logger.debug(f"✅ Dismissed notification {notification_id}")
                else:
                    logger.warning(f"⚠️ Notification {notification_id} not found for dismissing")
                
                return success
                
        except SQLAlchemyError as e:
            logger.error(f"❌ Failed to dismiss notification {notification_id}: {e}")
            return False
    
    async def mark_all_as_read(self, user_id: str) -> int:
        """Mark all notifications as read for a specific user"""
        try:
            async with self.db_config.async_session() as session:
                stmt = update(NotificationModel).where(
                    and_(
                        NotificationModel.user_id == user_id,
                        NotificationModel.is_read == False,
                        NotificationModel.dismissed == False
                    )
                ).values(
                    is_read=True,
                    updated_at=datetime.now(timezone.utc)
                )
                
                result = await session.execute(stmt)
                await session.commit()
                
                count = result.rowcount
                logger.debug(f"✅ Marked {count} notifications as read for user {user_id}")
                
                return count
                
        except SQLAlchemyError as e:
            logger.error(f"❌ Failed to mark all notifications as read for user {user_id}: {e}")
            return 0
    
    async def find_similar_notification(
        self, 
        user_id: str, 
        trigger_type: NotificationTriggerType,
        trigger_data: dict = None,
        within_hours: int = 24
    ) -> Optional[Notification]:
        """Find similar notification within time window to prevent duplicates"""
        try:
            async with self.db_config.async_session() as session:
                # Calculate time window
                cutoff_time = datetime.now(timezone.utc) - timedelta(hours=within_hours)
                
                # Base query for similar notifications
                stmt = select(NotificationModel).where(
                    and_(
                        NotificationModel.user_id == user_id,
                        NotificationModel.trigger_type == trigger_type.value,
                        NotificationModel.created_at >= cutoff_time,
                        NotificationModel.dismissed == False
                    )
                )
                
                # Add trigger_data filter if provided
                if trigger_data:
                    # For PostgreSQL JSONB, we can use containment operators
                    # This checks if trigger_data is contained within the stored trigger_data
                    stmt = stmt.where(NotificationModel.trigger_data.op('@>')({k: v for k, v in trigger_data.items() if v is not None}))
                
                # Order by creation date (newest first) and get the first match
                stmt = stmt.order_by(NotificationModel.created_at.desc()).limit(1)
                
                result = await session.execute(stmt)
                db_notification = result.scalar_one_or_none()
                
                if db_notification:
                    logger.debug(f"🔍 Found similar notification {db_notification.id} for user {user_id}")
                    return self._to_entity(db_notification)
                
                return None
                
        except SQLAlchemyError as e:
            logger.error(f"❌ Failed to find similar notification for user {user_id}: {e}")
            return None
    
    def _to_model(self, notification: Notification) -> NotificationModel:
        """Convert domain entity to database model"""
        return NotificationModel(
            id=notification.id if notification.id else None,  # Let DB generate if None
            user_id=notification.user_id,
            title=notification.title,
            message=notification.message,
            notification_type=notification.notification_type,
            priority=notification.priority,
            deep_link=notification.deep_link,
            trigger_type=notification.trigger_type.value,
            trigger_data=notification.trigger_data,
            is_read=notification.is_read,
            dismissed=notification.dismissed,
            status=notification.status.value,
            created_at=notification.created_at,
            updated_at=notification.updated_at,
            sent_at=notification.sent_at
        )
    
    def _to_entity(self, db_notification: NotificationModel) -> Notification:
        """Convert database model to domain entity"""
        return Notification(
            id=str(db_notification.id),
            user_id=db_notification.user_id,
            title=db_notification.title,
            message=db_notification.message,
            notification_type=db_notification.notification_type,
            priority=db_notification.priority,
            deep_link=db_notification.deep_link,
            trigger_type=NotificationTriggerType(db_notification.trigger_type),
            trigger_data=db_notification.trigger_data or {},
            is_read=db_notification.is_read,
            dismissed=db_notification.dismissed,
            status=NotificationStatus(db_notification.status),
            created_at=db_notification.created_at,
            updated_at=db_notification.updated_at,
            sent_at=db_notification.sent_at
        )