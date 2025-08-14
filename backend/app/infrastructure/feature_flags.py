"""
Feature Flags System for Notification Storage
Allows gradual migration from JSON to PostgreSQL with safe rollback
"""
import os
from enum import Enum
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class StorageBackend(Enum):
    """Available storage backends"""
    JSON = "json"
    POSTGRESQL = "postgresql" 
    DUAL = "dual"  # Write to both, read from primary


@dataclass 
class FeatureFlag:
    """Individual feature flag configuration"""
    name: str
    enabled: bool
    config: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


class NotificationStorageFeatureFlags:
    """
    Feature flags for notification storage migration
    
    Features:
    - Per-user storage selection
    - Gradual rollout percentages
    - A/B testing support
    - Safe rollback capabilities
    - Performance monitoring
    """
    
    def __init__(self):
        self.flags = self._load_flags()
        logger.info(f"🚩 Feature flags loaded: {list(self.flags.keys())}")
    
    def _load_flags(self) -> Dict[str, FeatureFlag]:
        """Load feature flags from environment and config"""
        flags = {}
        
        # Storage backend selection
        flags["notification_storage_backend"] = FeatureFlag(
            name="notification_storage_backend", 
            enabled=True,
            config={
                "backend": os.getenv("NOTIFICATION_STORAGE", "json").lower(),
                "fallback_backend": "json",
                "dual_write_enabled": os.getenv("NOTIFICATION_DUAL_WRITE", "false").lower() == "true"
            },
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        # Gradual rollout for PostgreSQL
        flags["postgresql_rollout"] = FeatureFlag(
            name="postgresql_rollout",
            enabled=os.getenv("POSTGRESQL_ROLLOUT_ENABLED", "false").lower() == "true",
            config={
                "rollout_percentage": int(os.getenv("POSTGRESQL_ROLLOUT_PERCENTAGE", "0")),
                "user_allowlist": os.getenv("POSTGRESQL_USER_ALLOWLIST", "").split(",") if os.getenv("POSTGRESQL_USER_ALLOWLIST") else [],
                "user_blocklist": os.getenv("POSTGRESQL_USER_BLOCKLIST", "").split(",") if os.getenv("POSTGRESQL_USER_BLOCKLIST") else []
            },
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        # Data migration flags
        flags["data_migration"] = FeatureFlag(
            name="data_migration",
            enabled=os.getenv("DATA_MIGRATION_ENABLED", "false").lower() == "true",
            config={
                "auto_migrate_on_read": os.getenv("AUTO_MIGRATE_ON_READ", "false").lower() == "true",
                "migration_batch_size": int(os.getenv("MIGRATION_BATCH_SIZE", "100")),
                "dry_run": os.getenv("MIGRATION_DRY_RUN", "true").lower() == "true"
            },
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        # Performance monitoring
        flags["performance_monitoring"] = FeatureFlag(
            name="performance_monitoring",
            enabled=os.getenv("PERF_MONITORING_ENABLED", "true").lower() == "true",
            config={
                "log_slow_queries": os.getenv("LOG_SLOW_QUERIES", "true").lower() == "true",
                "slow_query_threshold_ms": int(os.getenv("SLOW_QUERY_THRESHOLD_MS", "1000")),
                "compare_backends": os.getenv("COMPARE_BACKENDS", "false").lower() == "true"
            },
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        return flags
    
    def get_storage_backend_for_user(self, user_id: str) -> StorageBackend:
        """
        Determine which storage backend to use for a specific user
        Supports gradual rollout and A/B testing
        """
        
        # Check if PostgreSQL rollout is enabled
        rollout_flag = self.flags.get("postgresql_rollout")
        if not rollout_flag or not rollout_flag.enabled:
            # Default to configured backend
            backend_flag = self.flags["notification_storage_backend"]
            backend_str = backend_flag.config["backend"]
            return StorageBackend(backend_str)
        
        # Check user allowlist first
        user_allowlist = rollout_flag.config.get("user_allowlist", [])
        if user_allowlist and user_id in user_allowlist:
            logger.debug(f"🎯 User {user_id} in PostgreSQL allowlist")
            return StorageBackend.POSTGRESQL
        
        # Check user blocklist
        user_blocklist = rollout_flag.config.get("user_blocklist", [])
        if user_blocklist and user_id in user_blocklist:
            logger.debug(f"🚫 User {user_id} in PostgreSQL blocklist")
            return StorageBackend.JSON
        
        # Use rollout percentage for gradual migration
        rollout_percentage = rollout_flag.config.get("rollout_percentage", 0)
        if rollout_percentage > 0:
            # Simple hash-based percentage rollout
            user_hash = hash(user_id) % 100
            if user_hash < rollout_percentage:
                logger.debug(f"🎲 User {user_id} selected for PostgreSQL rollout ({user_hash}% < {rollout_percentage}%)")
                return StorageBackend.POSTGRESQL
        
        # Default to JSON
        logger.debug(f"📁 User {user_id} using JSON storage (default)")
        return StorageBackend.JSON
    
    def is_dual_write_enabled(self) -> bool:
        """Check if dual write (write to both backends) is enabled"""
        backend_flag = self.flags.get("notification_storage_backend")
        if not backend_flag:
            return False
        return backend_flag.config.get("dual_write_enabled", False)
    
    def is_auto_migration_enabled(self) -> bool:
        """Check if automatic migration on read is enabled"""
        migration_flag = self.flags.get("data_migration")
        if not migration_flag or not migration_flag.enabled:
            return False
        return migration_flag.config.get("auto_migrate_on_read", False)
    
    def get_migration_config(self) -> Dict[str, Any]:
        """Get data migration configuration"""
        migration_flag = self.flags.get("data_migration")
        if not migration_flag:
            return {"enabled": False}
        
        return {
            "enabled": migration_flag.enabled,
            "batch_size": migration_flag.config.get("migration_batch_size", 100),
            "dry_run": migration_flag.config.get("dry_run", True)
        }
    
    def is_performance_monitoring_enabled(self) -> bool:
        """Check if performance monitoring is enabled"""
        perf_flag = self.flags.get("performance_monitoring")
        if not perf_flag:
            return False
        return perf_flag.enabled
    
    def get_performance_config(self) -> Dict[str, Any]:
        """Get performance monitoring configuration"""
        perf_flag = self.flags.get("performance_monitoring")
        if not perf_flag:
            return {"enabled": False}
        
        return {
            "enabled": perf_flag.enabled,
            "log_slow_queries": perf_flag.config.get("log_slow_queries", True),
            "slow_query_threshold_ms": perf_flag.config.get("slow_query_threshold_ms", 1000),
            "compare_backends": perf_flag.config.get("compare_backends", False)
        }
    
    def update_flag(self, flag_name: str, enabled: bool, config: Optional[Dict[str, Any]] = None):
        """Update a feature flag dynamically (for admin endpoints)"""
        if flag_name not in self.flags:
            raise ValueError(f"Unknown feature flag: {flag_name}")
        
        flag = self.flags[flag_name]
        flag.enabled = enabled
        if config:
            flag.config.update(config)
        flag.updated_at = datetime.now(timezone.utc)
        
        logger.info(f"🔄 Updated feature flag {flag_name}: enabled={enabled}, config={config}")
    
    def get_status_summary(self) -> Dict[str, Any]:
        """Get summary of all feature flags for health checks"""
        return {
            "flags_loaded": len(self.flags),
            "flags": {
                name: {
                    "enabled": flag.enabled,
                    "config": flag.config,
                    "updated_at": flag.updated_at.isoformat()
                }
                for name, flag in self.flags.items()
            },
            "current_backend": os.getenv("NOTIFICATION_STORAGE", "json"),
            "postgresql_rollout_active": self.flags.get("postgresql_rollout", FeatureFlag("", False, {}, datetime.now(timezone.utc), datetime.now(timezone.utc))).enabled
        }


# Global instance
_feature_flags = NotificationStorageFeatureFlags()


def get_feature_flags() -> NotificationStorageFeatureFlags:
    """Get global feature flags instance"""
    return _feature_flags


def reload_feature_flags():
    """Reload feature flags (for testing or config changes)"""
    global _feature_flags
    _feature_flags = NotificationStorageFeatureFlags()
    return _feature_flags