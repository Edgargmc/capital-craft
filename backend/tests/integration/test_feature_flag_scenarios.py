"""
Feature Flag Testing for Notification Storage Migration

@description Comprehensive tests for all feature flag scenarios and rollout configurations
@layer Integration Testing
@pattern Feature flag validation with environment mocking
@coverage Feature flag rollouts, user-specific routing, environment configurations

@author Capital Craft Team  
@created 2025-01-15
"""
import pytest
import os
from unittest.mock import patch, MagicMock
from typing import Dict, Any

from app.infrastructure.feature_flags import (
    NotificationStorageFeatureFlags, 
    StorageBackend,
    FeatureFlag,
    get_feature_flags,
    reload_feature_flags
)
from datetime import datetime, timezone


class TestFeatureFlagScenarios:
    """Comprehensive feature flag testing scenarios"""
    
    def setup_method(self):
        """Reset environment variables before each test"""
        # Store original values to restore later
        self.original_env = {}
        env_vars = [
            'NOTIFICATION_STORAGE',
            'NOTIFICATION_DUAL_WRITE',
            'POSTGRESQL_ROLLOUT_ENABLED',
            'POSTGRESQL_ROLLOUT_PERCENTAGE',
            'POSTGRESQL_USER_ALLOWLIST',
            'POSTGRESQL_USER_BLOCKLIST',
            'DATA_MIGRATION_ENABLED',
            'AUTO_MIGRATE_ON_READ',
            'MIGRATION_BATCH_SIZE',
            'MIGRATION_DRY_RUN',
            'PERF_MONITORING_ENABLED',
            'LOG_SLOW_QUERIES',
            'SLOW_QUERY_THRESHOLD_MS',
            'COMPARE_BACKENDS'
        ]
        
        for var in env_vars:
            self.original_env[var] = os.environ.get(var)
            if var in os.environ:
                del os.environ[var]
    
    def teardown_method(self):
        """Restore original environment variables after each test"""
        for var, value in self.original_env.items():
            if value is not None:
                os.environ[var] = value
            elif var in os.environ:
                del os.environ[var]
    
    def set_env_vars(self, env_dict: Dict[str, str]):
        """Helper to set multiple environment variables"""
        for key, value in env_dict.items():
            os.environ[key] = value
    
    def test_default_feature_flags_configuration(self):
        """Test default feature flag configuration with no environment variables"""
        flags = NotificationStorageFeatureFlags()
        
        # Test default storage backend
        assert flags.get_storage_backend_for_user("any-user") == StorageBackend.JSON
        
        # Test default dual write is disabled
        assert flags.is_dual_write_enabled() == False
        
        # Test default migration settings
        assert flags.is_auto_migration_enabled() == False
        migration_config = flags.get_migration_config()
        assert migration_config["enabled"] == False
        
        # Test default performance monitoring
        assert flags.is_performance_monitoring_enabled() == True
        perf_config = flags.get_performance_config()
        assert perf_config["enabled"] == True
        assert perf_config["slow_query_threshold_ms"] == 1000
    
    def test_json_storage_backend_configuration(self):
        """Test JSON storage backend configuration"""
        self.set_env_vars({
            'NOTIFICATION_STORAGE': 'json'
        })
        
        flags = NotificationStorageFeatureFlags()
        
        # All users should get JSON backend
        test_users = ['user1', 'user2', 'test-user', 'demo']
        for user in test_users:
            assert flags.get_storage_backend_for_user(user) == StorageBackend.JSON
    
    def test_postgresql_storage_backend_configuration(self):
        """Test PostgreSQL storage backend configuration"""
        self.set_env_vars({
            'NOTIFICATION_STORAGE': 'postgresql'
        })
        
        flags = NotificationStorageFeatureFlags()
        
        # All users should get PostgreSQL backend when rollout is disabled
        test_users = ['user1', 'user2', 'test-user', 'demo']
        for user in test_users:
            assert flags.get_storage_backend_for_user(user) == StorageBackend.POSTGRESQL
    
    def test_dual_write_enabled_configuration(self):
        """Test dual write enabled configuration"""
        self.set_env_vars({
            'NOTIFICATION_DUAL_WRITE': 'true'
        })
        
        flags = NotificationStorageFeatureFlags()
        
        assert flags.is_dual_write_enabled() == True
        
        # Test with false
        self.set_env_vars({
            'NOTIFICATION_DUAL_WRITE': 'false'
        })
        flags = NotificationStorageFeatureFlags()
        assert flags.is_dual_write_enabled() == False
    
    def test_postgresql_rollout_percentage_configuration(self):
        """Test PostgreSQL rollout with different percentages"""
        test_cases = [
            (0, []),     # 0% - no users should get PostgreSQL
            (25, []),    # 25% - some users should get PostgreSQL
            (50, []),    # 50% - about half should get PostgreSQL 
            (75, []),    # 75% - most users should get PostgreSQL
            (100, [])    # 100% - all users should get PostgreSQL
        ]
        
        for percentage, _ in test_cases:
            self.set_env_vars({
                'POSTGRESQL_ROLLOUT_ENABLED': 'true',
                'POSTGRESQL_ROLLOUT_PERCENTAGE': str(percentage)
            })
            
            flags = NotificationStorageFeatureFlags()
            
            # Test consistent hash-based rollout
            test_users = [f'user{i}' for i in range(100)]
            postgresql_users = []
            json_users = []
            
            for user in test_users:
                backend = flags.get_storage_backend_for_user(user)
                if backend == StorageBackend.POSTGRESQL:
                    postgresql_users.append(user)
                else:
                    json_users.append(user)
            
            postgresql_percentage = len(postgresql_users) / len(test_users) * 100
            
            # Assert percentage is within reasonable range (±10% for hash-based rollout)
            if percentage == 0:
                assert len(postgresql_users) == 0
            elif percentage == 100:
                assert len(postgresql_users) == 100
            else:
                assert abs(postgresql_percentage - percentage) <= 10, \
                    f"Expected ~{percentage}%, got {postgresql_percentage}%"
            
            # Test consistency - same user should always get same backend
            for user in test_users[:10]:  # Test first 10 users
                backend1 = flags.get_storage_backend_for_user(user)
                backend2 = flags.get_storage_backend_for_user(user)
                assert backend1 == backend2, f"User {user} got inconsistent backends"
    
    def test_user_allowlist_configuration(self):
        """Test user allowlist takes precedence over rollout percentage"""
        allowlisted_users = ['vip-user', 'premium-user', 'admin-user']
        
        self.set_env_vars({
            'POSTGRESQL_ROLLOUT_ENABLED': 'true',
            'POSTGRESQL_ROLLOUT_PERCENTAGE': '0',  # 0% rollout
            'POSTGRESQL_USER_ALLOWLIST': ','.join(allowlisted_users)
        })
        
        flags = NotificationStorageFeatureFlags()
        
        # Allowlisted users should get PostgreSQL despite 0% rollout
        for user in allowlisted_users:
            assert flags.get_storage_backend_for_user(user) == StorageBackend.POSTGRESQL
        
        # Non-allowlisted users should get JSON
        regular_users = ['regular-user1', 'regular-user2', 'test-user']
        for user in regular_users:
            assert flags.get_storage_backend_for_user(user) == StorageBackend.JSON
    
    def test_user_blocklist_configuration(self):
        """Test user blocklist prevents PostgreSQL even with 100% rollout"""
        blocklisted_users = ['problematic-user', 'legacy-user', 'blocked-user']
        
        self.set_env_vars({
            'POSTGRESQL_ROLLOUT_ENABLED': 'true',
            'POSTGRESQL_ROLLOUT_PERCENTAGE': '100',  # 100% rollout
            'POSTGRESQL_USER_BLOCKLIST': ','.join(blocklisted_users)
        })
        
        flags = NotificationStorageFeatureFlags()
        
        # Blocklisted users should get JSON despite 100% rollout
        for user in blocklisted_users:
            assert flags.get_storage_backend_for_user(user) == StorageBackend.JSON
        
        # Non-blocklisted users should get PostgreSQL
        regular_users = ['regular-user1', 'regular-user2', 'test-user']
        for user in regular_users:
            assert flags.get_storage_backend_for_user(user) == StorageBackend.POSTGRESQL
    
    def test_allowlist_overrides_blocklist(self):
        """Test that allowlist takes precedence over blocklist"""
        test_user = 'conflict-user'
        
        self.set_env_vars({
            'POSTGRESQL_ROLLOUT_ENABLED': 'true',
            'POSTGRESQL_ROLLOUT_PERCENTAGE': '0',
            'POSTGRESQL_USER_ALLOWLIST': test_user,
            'POSTGRESQL_USER_BLOCKLIST': test_user
        })
        
        flags = NotificationStorageFeatureFlags()
        
        # Allowlist should override blocklist
        assert flags.get_storage_backend_for_user(test_user) == StorageBackend.POSTGRESQL
    
    def test_data_migration_configuration(self):
        """Test data migration feature flag configuration"""
        test_cases = [
            {
                'DATA_MIGRATION_ENABLED': 'true',
                'AUTO_MIGRATE_ON_READ': 'true',
                'MIGRATION_BATCH_SIZE': '200',
                'MIGRATION_DRY_RUN': 'false'
            },
            {
                'DATA_MIGRATION_ENABLED': 'false',
                'AUTO_MIGRATE_ON_READ': 'false',
                'MIGRATION_BATCH_SIZE': '50',
                'MIGRATION_DRY_RUN': 'true'
            }
        ]
        
        for env_config in test_cases:
            self.set_env_vars(env_config)
            flags = NotificationStorageFeatureFlags()
            
            expected_enabled = env_config['DATA_MIGRATION_ENABLED'] == 'true'
            expected_auto_migrate = env_config['AUTO_MIGRATE_ON_READ'] == 'true'
            expected_batch_size = int(env_config['MIGRATION_BATCH_SIZE'])
            expected_dry_run = env_config['MIGRATION_DRY_RUN'] == 'true'
            
            assert flags.is_auto_migration_enabled() == (expected_enabled and expected_auto_migrate)
            
            migration_config = flags.get_migration_config()
            assert migration_config['enabled'] == expected_enabled
            assert migration_config['batch_size'] == expected_batch_size
            assert migration_config['dry_run'] == expected_dry_run
    
    def test_performance_monitoring_configuration(self):
        """Test performance monitoring feature flag configuration"""
        test_cases = [
            {
                'PERF_MONITORING_ENABLED': 'true',
                'LOG_SLOW_QUERIES': 'true',
                'SLOW_QUERY_THRESHOLD_MS': '500',
                'COMPARE_BACKENDS': 'true'
            },
            {
                'PERF_MONITORING_ENABLED': 'false',
                'LOG_SLOW_QUERIES': 'false',
                'SLOW_QUERY_THRESHOLD_MS': '2000',
                'COMPARE_BACKENDS': 'false'
            }
        ]
        
        for env_config in test_cases:
            self.set_env_vars(env_config)
            flags = NotificationStorageFeatureFlags()
            
            expected_enabled = env_config['PERF_MONITORING_ENABLED'] == 'true'
            expected_log_slow = env_config['LOG_SLOW_QUERIES'] == 'true'
            expected_threshold = int(env_config['SLOW_QUERY_THRESHOLD_MS'])
            expected_compare = env_config['COMPARE_BACKENDS'] == 'true'
            
            assert flags.is_performance_monitoring_enabled() == expected_enabled
            
            perf_config = flags.get_performance_config()
            assert perf_config['enabled'] == expected_enabled
            assert perf_config['log_slow_queries'] == expected_log_slow
            assert perf_config['slow_query_threshold_ms'] == expected_threshold
            assert perf_config['compare_backends'] == expected_compare
    
    def test_dynamic_flag_updates(self):
        """Test dynamic feature flag updates"""
        flags = NotificationStorageFeatureFlags()
        
        # Test updating PostgreSQL rollout flag
        original_enabled = flags.flags['postgresql_rollout'].enabled
        flags.update_flag('postgresql_rollout', not original_enabled, {'rollout_percentage': 75})
        
        updated_flag = flags.flags['postgresql_rollout']
        assert updated_flag.enabled == (not original_enabled)
        assert updated_flag.config['rollout_percentage'] == 75
        assert updated_flag.updated_at > updated_flag.created_at
        
        # Test updating performance monitoring
        flags.update_flag('performance_monitoring', False, {
            'slow_query_threshold_ms': 3000,
            'compare_backends': True
        })
        
        perf_flag = flags.flags['performance_monitoring']
        assert perf_flag.enabled == False
        assert perf_flag.config['slow_query_threshold_ms'] == 3000
        assert perf_flag.config['compare_backends'] == True
    
    def test_invalid_flag_update_raises_error(self):
        """Test that updating non-existent flag raises error"""
        flags = NotificationStorageFeatureFlags()
        
        with pytest.raises(ValueError, match="Unknown feature flag"):
            flags.update_flag('non_existent_flag', True)
    
    def test_status_summary_report(self):
        """Test feature flag status summary for health checks"""
        self.set_env_vars({
            'NOTIFICATION_STORAGE': 'postgresql',
            'POSTGRESQL_ROLLOUT_ENABLED': 'true',
            'POSTGRESQL_ROLLOUT_PERCENTAGE': '50',
            'NOTIFICATION_DUAL_WRITE': 'true'
        })
        
        flags = NotificationStorageFeatureFlags()
        status = flags.get_status_summary()
        
        # Verify status structure
        assert 'flags_loaded' in status
        assert 'flags' in status
        assert 'current_backend' in status
        assert 'postgresql_rollout_active' in status
        
        # Verify flag details
        assert status['flags_loaded'] > 0
        assert 'postgresql_rollout' in status['flags']
        assert 'notification_storage_backend' in status['flags']
        assert status['current_backend'] == 'postgresql'
        assert status['postgresql_rollout_active'] == True
        
        # Verify individual flag structure
        pg_rollout_status = status['flags']['postgresql_rollout']
        assert 'enabled' in pg_rollout_status
        assert 'config' in pg_rollout_status
        assert 'updated_at' in pg_rollout_status
    
    def test_complex_rollout_scenario(self):
        """Test complex rollout scenario with multiple feature flags"""
        # Scenario: Gradual rollout with allowlist, blocklist, and dual write
        self.set_env_vars({
            'POSTGRESQL_ROLLOUT_ENABLED': 'true',
            'POSTGRESQL_ROLLOUT_PERCENTAGE': '30',
            'POSTGRESQL_USER_ALLOWLIST': 'vip-user1,vip-user2',
            'POSTGRESQL_USER_BLOCKLIST': 'problem-user1,problem-user2',
            'NOTIFICATION_DUAL_WRITE': 'true',
            'DATA_MIGRATION_ENABLED': 'true',
            'AUTO_MIGRATE_ON_READ': 'true'
        })
        
        flags = NotificationStorageFeatureFlags()
        
        # Test allowlisted users get PostgreSQL
        assert flags.get_storage_backend_for_user('vip-user1') == StorageBackend.POSTGRESQL
        assert flags.get_storage_backend_for_user('vip-user2') == StorageBackend.POSTGRESQL
        
        # Test blocklisted users get JSON
        assert flags.get_storage_backend_for_user('problem-user1') == StorageBackend.JSON
        assert flags.get_storage_backend_for_user('problem-user2') == StorageBackend.JSON
        
        # Test other flags are configured correctly
        assert flags.is_dual_write_enabled() == True
        assert flags.is_auto_migration_enabled() == True
        
        # Test percentage rollout for regular users
        regular_users = [f'regular-user-{i}' for i in range(100)]
        postgresql_count = sum(1 for user in regular_users 
                             if flags.get_storage_backend_for_user(user) == StorageBackend.POSTGRESQL)
        
        # Should be approximately 30% (±10% for hash-based rollout)
        percentage = postgresql_count / len(regular_users) * 100
        assert 20 <= percentage <= 40, f"Expected ~30%, got {percentage}%"
    
    def test_feature_flag_reload(self):
        """Test feature flag reloading functionality"""
        # Set initial environment
        self.set_env_vars({
            'POSTGRESQL_ROLLOUT_PERCENTAGE': '25'
        })
        
        flags = NotificationStorageFeatureFlags()
        original_percentage = flags.flags['postgresql_rollout'].config['rollout_percentage']
        assert original_percentage == 25
        
        # Change environment and reload
        self.set_env_vars({
            'POSTGRESQL_ROLLOUT_PERCENTAGE': '75'
        })
        
        new_flags = reload_feature_flags()
        new_percentage = new_flags.flags['postgresql_rollout'].config['rollout_percentage']
        assert new_percentage == 75
    
    def test_edge_case_empty_user_lists(self):
        """Test edge cases with empty user allowlist/blocklist"""
        # Test empty allowlist (should not affect rollout)
        self.set_env_vars({
            'POSTGRESQL_ROLLOUT_ENABLED': 'true',
            'POSTGRESQL_ROLLOUT_PERCENTAGE': '50',
            'POSTGRESQL_USER_ALLOWLIST': '',  # Empty
            'POSTGRESQL_USER_BLOCKLIST': ''   # Empty
        })
        
        flags = NotificationStorageFeatureFlags()
        
        # Should work normally with percentage-based rollout
        test_users = [f'user{i}' for i in range(20)]
        backends = [flags.get_storage_backend_for_user(user) for user in test_users]
        
        # Should have some mix of backends (not all JSON, not all PostgreSQL)
        postgresql_count = backends.count(StorageBackend.POSTGRESQL)
        assert 0 < postgresql_count < len(test_users), "Should have mixed backends with 50% rollout"
    
    def test_case_insensitive_environment_variables(self):
        """Test that environment variables handle different cases correctly"""
        test_cases = [
            ('true', True),
            ('TRUE', True),
            ('True', True),
            ('false', False),
            ('FALSE', False),
            ('False', False),
            ('invalid', False)  # Invalid values should default to False
        ]
        
        for env_value, expected_result in test_cases:
            self.set_env_vars({
                'POSTGRESQL_ROLLOUT_ENABLED': env_value
            })
            
            flags = NotificationStorageFeatureFlags()
            actual_result = flags.flags['postgresql_rollout'].enabled
            
            assert actual_result == expected_result, \
                f"Environment value '{env_value}' should result in {expected_result}, got {actual_result}"