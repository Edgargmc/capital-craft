"""Safe migration - enhance notifications table with defaults

Revision ID: bc433f913ad5
Revises: 01e28daf1322
Create Date: 2025-08-14 00:22:48.819403

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'bc433f913ad5'
down_revision: Union[str, None] = '01e28daf1322'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Safe migration that handles existing notification data
    Adds new columns with defaults, then removes defaults for new records
    """
    
    # Step 1: Add new columns with default values (nullable first)
    print("🔄 Adding new notification columns with defaults...")
    
    # Add nullable columns first
    op.add_column('notifications', sa.Column('notification_type', sa.String(length=50), nullable=True))
    op.add_column('notifications', sa.Column('priority', sa.String(length=20), nullable=True))
    op.add_column('notifications', sa.Column('deep_link', sa.String(length=500), nullable=True))
    op.add_column('notifications', sa.Column('trigger_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('notifications', sa.Column('dismissed', sa.Boolean(), nullable=True))
    op.add_column('notifications', sa.Column('status', sa.String(length=20), nullable=True))
    op.add_column('notifications', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('notifications', sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True))
    
    # Step 2: Update existing records with default values
    print("🔄 Updating existing records with default values...")
    connection = op.get_bind()
    
    # Update existing records
    connection.execute(sa.text("""
        UPDATE notifications 
        SET 
            notification_type = 'education',
            priority = 'medium',
            dismissed = is_dismissed,
            status = 'sent',
            updated_at = created_at,
            sent_at = created_at
        WHERE notification_type IS NULL
    """))
    
    # Step 3: Make required columns NOT NULL
    print("🔄 Making required columns NOT NULL...")
    op.alter_column('notifications', 'notification_type', nullable=False)
    op.alter_column('notifications', 'priority', nullable=False)
    op.alter_column('notifications', 'dismissed', nullable=False)
    op.alter_column('notifications', 'status', nullable=False)
    op.alter_column('notifications', 'updated_at', nullable=False)
    
    # Step 4: Remove foreign key BEFORE changing column type
    print("🔄 Removing foreign key constraint...")
    
    # Drop old foreign key if it exists
    try:
        op.drop_constraint('notifications_user_id_fkey', 'notifications', type_='foreignkey')
    except:
        pass  # Constraint might not exist
    
    # Step 5: Handle column changes and drops
    print("🔄 Updating column types and removing old columns...")
    
    # Change user_id from UUID to String for flexibility (demo users)
    op.alter_column('notifications', 'user_id', type_=sa.String(255))
    
    # Expand trigger_type length
    op.alter_column('notifications', 'trigger_type', type_=sa.String(100))
    
    # Drop old columns
    op.drop_column('notifications', 'is_dismissed')
    op.drop_column('notifications', 'read_at')
    op.drop_column('notifications', 'dismissed_at')
    
    # Step 6: Add performance indexes
    print("🔄 Adding performance indexes...")
    
    # Add new indexes for performance
    op.create_index('idx_notifications_user_unread', 'notifications', ['user_id', 'is_read'])
    op.create_index('idx_notifications_user_created', 'notifications', ['user_id', 'created_at'])
    op.create_index('idx_notifications_user_status', 'notifications', ['user_id', 'dismissed', 'is_read'])
    op.create_index('idx_notifications_trigger_type', 'notifications', ['trigger_type'])
    
    # Update existing indexes
    op.create_index('ix_notifications_created_at', 'notifications', ['created_at'])
    op.create_index('ix_notifications_dismissed', 'notifications', ['dismissed'])
    
    print("✅ Notification table enhancement completed")


def downgrade() -> None:
    """
    Revert the notification table enhancements
    """
    print("🔄 Reverting notification table changes...")
    
    # Drop new indexes
    op.drop_index('idx_notifications_trigger_type', 'notifications')
    op.drop_index('idx_notifications_user_status', 'notifications')
    op.drop_index('idx_notifications_user_created', 'notifications')
    op.drop_index('idx_notifications_user_unread', 'notifications')
    op.drop_index('ix_notifications_dismissed', 'notifications')
    op.drop_index('ix_notifications_created_at', 'notifications')
    
    # Add back old columns
    op.add_column('notifications', sa.Column('read_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('notifications', sa.Column('dismissed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('notifications', sa.Column('is_dismissed', sa.Boolean(), nullable=False, server_default='false'))
    
    # Migrate data back
    connection = op.get_bind()
    connection.execute(sa.text("""
        UPDATE notifications 
        SET is_dismissed = dismissed
        WHERE is_dismissed IS NULL
    """))
    
    # Change column types back
    op.alter_column('notifications', 'trigger_type', type_=sa.String(50))
    op.alter_column('notifications', 'user_id', type_=postgresql.UUID())
    
    # Drop new columns
    op.drop_column('notifications', 'sent_at')
    op.drop_column('notifications', 'updated_at')
    op.drop_column('notifications', 'status')
    op.drop_column('notifications', 'dismissed')
    op.drop_column('notifications', 'trigger_data')
    op.drop_column('notifications', 'deep_link')
    op.drop_column('notifications', 'priority')
    op.drop_column('notifications', 'notification_type')
    
    print("✅ Downgrade completed")