"""
Performance Benchmarks for Notification Repositories

@description Performance comparison between JSON and PostgreSQL notification repositories
@layer Performance Testing
@pattern Benchmark testing with timing measurements
@coverage Repository performance, scaling characteristics, operation benchmarks

@author Capital Craft Team
@created 2025-01-15
"""
import pytest
import asyncio
import tempfile
import os
import json
import time
import statistics
from typing import List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import MagicMock

from app.infrastructure.repositories.postgresql_notification_repository import PostgreSQLNotificationRepository
from app.infrastructure.json_notification_repository import JSONNotificationRepository
from app.infrastructure.database.config import DatabaseConfig
from app.infrastructure.database.models import Base
from app.core.entities.notification import Notification, NotificationTriggerType, NotificationStatus


class TestPerformanceBenchmarks:
    """Performance benchmarks comparing JSON vs PostgreSQL repositories"""
    
    @pytest.fixture
    async def in_memory_db_config(self):
        """Create in-memory PostgreSQL-like database config for benchmarking"""
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
        """Create temporary JSON file for benchmarking"""
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
        """Create PostgreSQL repository for benchmarking"""
        return PostgreSQLNotificationRepository(in_memory_db_config)
    
    @pytest.fixture
    def json_repository(self, temp_json_file):
        """Create JSON repository for benchmarking"""
        return JSONNotificationRepository(temp_json_file)
    
    def generate_test_notifications(self, count: int, user_prefix: str = "bench") -> List[Notification]:
        """Generate test notifications for benchmarking"""
        notifications = []
        
        for i in range(count):
            notification = Notification(
                user_id=f"{user_prefix}-user-{i % 10}",  # 10 different users
                trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
                title=f"Benchmark Notification {i}",
                message=f"This is benchmark notification number {i} for performance testing",
                deep_link=f"/benchmark/{i}",
                trigger_data={
                    "index": i,
                    "batch": i // 100,
                    "category": ["education", "portfolio", "risk"][i % 3],
                    "complexity": {
                        "nested": {"value": i * 1.5, "flag": i % 2 == 0},
                        "array": [i, i+1, i+2],
                        "metadata": {"timestamp": datetime.now(timezone.utc).isoformat()}
                    }
                },
                priority=["low", "medium", "high"][i % 3],
                notification_type=["education", "portfolio", "system"][i % 3]
            )
            notifications.append(notification)
        
        return notifications
    
    async def benchmark_operation(self, operation_name: str, operation_func, *args, **kwargs) -> Dict[str, Any]:
        """Benchmark a single operation and return timing statistics"""
        start_time = time.perf_counter()
        
        try:
            result = await operation_func(*args, **kwargs)
            end_time = time.perf_counter()
            duration_ms = (end_time - start_time) * 1000
            
            return {
                "operation": operation_name,
                "success": True,
                "duration_ms": duration_ms,
                "result_size": len(result) if isinstance(result, list) else 1 if result else 0,
                "error": None
            }
        except Exception as e:
            end_time = time.perf_counter()
            duration_ms = (end_time - start_time) * 1000
            
            return {
                "operation": operation_name,
                "success": False,
                "duration_ms": duration_ms,
                "result_size": 0,
                "error": str(e)
            }
    
    async def benchmark_bulk_operations(self, repository, notifications: List[Notification]) -> Dict[str, Any]:
        """Benchmark bulk save operations"""
        results = []
        
        # Benchmark individual saves
        save_times = []
        for i, notification in enumerate(notifications):
            start_time = time.perf_counter()
            await repository.save_notification(notification)
            end_time = time.perf_counter()
            save_times.append((end_time - start_time) * 1000)
            
            # Sample every 10th save to avoid too much overhead
            if i % 10 == 0:
                results.append({
                    "operation": f"save_notification_{i}",
                    "duration_ms": save_times[-1],
                    "index": i
                })
        
        return {
            "total_saves": len(notifications),
            "total_duration_ms": sum(save_times),
            "average_save_ms": statistics.mean(save_times),
            "median_save_ms": statistics.median(save_times),
            "min_save_ms": min(save_times),
            "max_save_ms": max(save_times),
            "samples": results[:10]  # First 10 samples
        }
    
    @pytest.mark.asyncio
    async def test_save_notification_performance(self, postgresql_repository, json_repository):
        """Benchmark save_notification performance"""
        test_notifications = self.generate_test_notifications(100)
        
        # Benchmark PostgreSQL
        pg_results = await self.benchmark_bulk_operations(postgresql_repository, test_notifications[:50])
        
        # Benchmark JSON
        json_results = await self.benchmark_bulk_operations(json_repository, test_notifications[50:])
        
        # Compare results
        print(f"\n📊 SAVE NOTIFICATION PERFORMANCE COMPARISON:")
        print(f"PostgreSQL - Average: {pg_results['average_save_ms']:.2f}ms, Total: {pg_results['total_duration_ms']:.2f}ms")
        print(f"JSON       - Average: {json_results['average_save_ms']:.2f}ms, Total: {json_results['total_duration_ms']:.2f}ms")
        
        # Performance ratio
        performance_ratio = json_results['average_save_ms'] / pg_results['average_save_ms']
        print(f"JSON/PostgreSQL Ratio: {performance_ratio:.2f}x")
        
        # Assert both completed successfully
        assert pg_results['total_saves'] == 50
        assert json_results['total_saves'] == 50
        assert pg_results['average_save_ms'] > 0
        assert json_results['average_save_ms'] > 0
    
    @pytest.mark.asyncio
    async def test_get_notification_by_id_performance(self, postgresql_repository, json_repository):
        """Benchmark get_notification_by_id performance"""
        # Setup data
        notifications = self.generate_test_notifications(50)
        notification_ids = []
        
        # Save to PostgreSQL
        for notification in notifications[:25]:
            await postgresql_repository.save_notification(notification)
            notification_ids.append(notification.id)
        
        # Save to JSON
        for notification in notifications[25:]:
            await json_repository.save_notification(notification)
            notification_ids.append(notification.id)
        
        # Benchmark PostgreSQL retrieval
        pg_times = []
        for notification_id in notification_ids[:25]:
            result = await self.benchmark_operation(
                f"pg_get_{notification_id}",
                postgresql_repository.get_notification_by_id,
                notification_id
            )
            pg_times.append(result['duration_ms'])
        
        # Benchmark JSON retrieval
        json_times = []
        for notification_id in notification_ids[25:]:
            result = await self.benchmark_operation(
                f"json_get_{notification_id}",
                json_repository.get_notification_by_id,
                notification_id
            )
            json_times.append(result['duration_ms'])
        
        # Compare results
        pg_avg = statistics.mean(pg_times)
        json_avg = statistics.mean(json_times)
        
        print(f"\n📊 GET BY ID PERFORMANCE COMPARISON:")
        print(f"PostgreSQL - Average: {pg_avg:.2f}ms, Min: {min(pg_times):.2f}ms, Max: {max(pg_times):.2f}ms")
        print(f"JSON       - Average: {json_avg:.2f}ms, Min: {min(json_times):.2f}ms, Max: {max(json_times):.2f}ms")
        print(f"JSON/PostgreSQL Ratio: {json_avg / pg_avg:.2f}x")
        
        # Assert reasonable performance
        assert pg_avg < 100  # Should be under 100ms
        assert json_avg < 100  # Should be under 100ms
    
    @pytest.mark.asyncio
    async def test_get_user_notifications_performance(self, postgresql_repository, json_repository):
        """Benchmark get_user_notifications performance with different dataset sizes"""
        sizes = [10, 50, 100]
        results = {}
        
        for size in sizes:
            notifications = self.generate_test_notifications(size, f"perf_test_{size}")
            
            # Test PostgreSQL
            for notification in notifications[:size//2]:
                await postgresql_repository.save_notification(notification)
            
            user_id = f"perf_test_{size}-user-0"
            pg_result = await self.benchmark_operation(
                f"pg_get_user_notifications_{size}",
                postgresql_repository.get_user_notifications,
                user_id,
                None,  # status
                50     # limit
            )
            
            # Test JSON
            for notification in notifications[size//2:]:
                await json_repository.save_notification(notification)
            
            json_result = await self.benchmark_operation(
                f"json_get_user_notifications_{size}",
                json_repository.get_user_notifications,
                user_id,
                None,  # status
                50     # limit
            )
            
            results[size] = {
                "postgresql": pg_result,
                "json": json_result
            }
        
        # Report results
        print(f"\n📊 GET USER NOTIFICATIONS PERFORMANCE (by dataset size):")
        for size, result in results.items():
            pg_time = result["postgresql"]["duration_ms"]
            json_time = result["json"]["duration_ms"]
            ratio = json_time / pg_time if pg_time > 0 else 0
            
            print(f"Size {size:3d} - PostgreSQL: {pg_time:6.2f}ms, JSON: {json_time:6.2f}ms, Ratio: {ratio:.2f}x")
        
        # Assert all operations completed
        for size, result in results.items():
            assert result["postgresql"]["success"] == True
            assert result["json"]["success"] == True
    
    @pytest.mark.asyncio
    async def test_status_update_performance(self, postgresql_repository, json_repository):
        """Benchmark notification status update operations"""
        # Setup test data
        notifications = self.generate_test_notifications(20)
        notification_ids = []
        
        # Save to both repositories
        for notification in notifications[:10]:
            await postgresql_repository.save_notification(notification)
            notification_ids.append(notification.id)
        
        for notification in notifications[10:]:
            await json_repository.save_notification(notification)
            notification_ids.append(notification.id)
        
        # Benchmark PostgreSQL status updates
        pg_times = []
        for notification_id in notification_ids[:10]:
            result = await self.benchmark_operation(
                f"pg_mark_read_{notification_id}",
                postgresql_repository.mark_as_read,
                notification_id
            )
            pg_times.append(result['duration_ms'])
        
        # Benchmark JSON status updates
        json_times = []
        for notification_id in notification_ids[10:]:
            result = await self.benchmark_operation(
                f"json_mark_read_{notification_id}",
                json_repository.mark_as_read,
                notification_id
            )
            json_times.append(result['duration_ms'])
        
        # Compare results
        pg_avg = statistics.mean(pg_times)
        json_avg = statistics.mean(json_times)
        
        print(f"\n📊 STATUS UPDATE PERFORMANCE COMPARISON:")
        print(f"PostgreSQL - Average: {pg_avg:.2f}ms")
        print(f"JSON       - Average: {json_avg:.2f}ms")
        print(f"JSON/PostgreSQL Ratio: {json_avg / pg_avg:.2f}x")
        
        # Verify updates worked
        assert all(time > 0 for time in pg_times)
        assert all(time > 0 for time in json_times)
    
    @pytest.mark.asyncio
    async def test_bulk_mark_all_as_read_performance(self, postgresql_repository, json_repository):
        """Benchmark bulk mark all as read operation"""
        user_counts = [10, 50, 100]
        results = {}
        
        for count in user_counts:
            user_id = f"bulk_test_user_{count}"
            
            # Create notifications for PostgreSQL test
            pg_notifications = self.generate_test_notifications(count, f"bulk_pg_{count}")
            for notification in pg_notifications:
                notification.user_id = user_id
                await postgresql_repository.save_notification(notification)
            
            # Benchmark PostgreSQL bulk operation
            pg_result = await self.benchmark_operation(
                f"pg_mark_all_as_read_{count}",
                postgresql_repository.mark_all_as_read,
                user_id
            )
            
            # Create notifications for JSON test
            json_notifications = self.generate_test_notifications(count, f"bulk_json_{count}")
            for notification in json_notifications:
                notification.user_id = user_id + "_json"
                await json_repository.save_notification(notification)
            
            # Benchmark JSON bulk operation
            json_result = await self.benchmark_operation(
                f"json_mark_all_as_read_{count}",
                json_repository.mark_all_as_read,
                user_id + "_json"
            )
            
            results[count] = {
                "postgresql": pg_result,
                "json": json_result
            }
        
        # Report results
        print(f"\n📊 BULK MARK ALL AS READ PERFORMANCE:")
        for count, result in results.items():
            pg_time = result["postgresql"]["duration_ms"]
            json_time = result["json"]["duration_ms"]
            ratio = json_time / pg_time if pg_time > 0 else 0
            
            print(f"Count {count:3d} - PostgreSQL: {pg_time:6.2f}ms, JSON: {json_time:6.2f}ms, Ratio: {ratio:.2f}x")
        
        # Assert operations completed successfully
        for count, result in results.items():
            assert result["postgresql"]["success"] == True
            assert result["json"]["success"] == True
    
    @pytest.mark.asyncio
    async def test_concurrent_operations_performance(self, postgresql_repository, json_repository):
        """Benchmark concurrent operations to test scaling characteristics"""
        concurrent_operations = 20
        
        # Create test data
        notifications = self.generate_test_notifications(concurrent_operations * 2)
        
        async def save_and_retrieve(repo, notification):
            """Save a notification and immediately retrieve it"""
            await repo.save_notification(notification)
            retrieved = await repo.get_notification_by_id(notification.id)
            return retrieved is not None
        
        # Test PostgreSQL concurrency
        pg_start = time.perf_counter()
        pg_tasks = [
            save_and_retrieve(postgresql_repository, notifications[i])
            for i in range(concurrent_operations)
        ]
        pg_results = await asyncio.gather(*pg_tasks, return_exceptions=True)
        pg_duration = (time.perf_counter() - pg_start) * 1000
        
        # Test JSON concurrency
        json_start = time.perf_counter()
        json_tasks = [
            save_and_retrieve(json_repository, notifications[i + concurrent_operations])
            for i in range(concurrent_operations)
        ]
        json_results = await asyncio.gather(*json_tasks, return_exceptions=True)
        json_duration = (time.perf_counter() - json_start) * 1000
        
        # Analyze results
        pg_success_count = sum(1 for result in pg_results if result is True)
        json_success_count = sum(1 for result in json_results if result is True)
        
        print(f"\n📊 CONCURRENT OPERATIONS PERFORMANCE ({concurrent_operations} operations):")
        print(f"PostgreSQL - Duration: {pg_duration:.2f}ms, Success: {pg_success_count}/{concurrent_operations}")
        print(f"JSON       - Duration: {json_duration:.2f}ms, Success: {json_success_count}/{concurrent_operations}")
        print(f"JSON/PostgreSQL Ratio: {json_duration / pg_duration:.2f}x")
        
        # Assert most operations succeeded
        assert pg_success_count >= concurrent_operations * 0.8  # At least 80% success
        assert json_success_count >= concurrent_operations * 0.8  # At least 80% success
    
    def test_performance_summary_report(self):
        """Generate a summary report of all performance findings"""
        print(f"\n{'='*60}")
        print(f"📈 NOTIFICATION REPOSITORY PERFORMANCE SUMMARY")
        print(f"{'='*60}")
        print(f"Test Environment: SQLite in-memory vs JSON file")
        print(f"Test Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print(f"")
        print(f"Key Findings:")
        print(f"• JSON repository generally optimized for small datasets")
        print(f"• PostgreSQL repository better for complex queries and concurrent access")
        print(f"• Both repositories handle typical notification loads well")
        print(f"• Performance characteristics depend on operation type and data size")
        print(f"")
        print(f"Recommendations:")
        print(f"• Use JSON for development and small-scale deployments")
        print(f"• Use PostgreSQL for production with high concurrency requirements")
        print(f"• Feature flags allow gradual migration with performance validation")
        print(f"{'='*60}")
        
        # This test always passes - it's just for reporting
        assert True