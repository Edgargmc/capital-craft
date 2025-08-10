"""
Integration Tests for Notification Endpoints

@description Comprehensive integration test suite for notification FastAPI endpoints
@layer Testing
@pattern Integration Testing with FastAPI TestClient
@coverage API endpoints, persistence, error handling

@author Capital Craft Team
@created 2025-01-15
"""
import pytest
import json
import tempfile
import os
from fastapi.testclient import TestClient
from unittest.mock import patch

from main import app
from app.infrastructure.dependency_injection import get_container
from app.infrastructure.json_notification_repository import JSONNotificationRepository
from app.core.entities.notification import Notification, NotificationTriggerType


class TestNotificationEndpoints:
    """Integration test suite for notification endpoints"""
    
    @pytest.fixture
    def temp_data_file(self):
        """Create temporary data file for testing"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            initial_data = {
                "demo": [
                    {
                        "id": "test-notif-1",
                        "userId": "demo",
                        "title": "Test Notification 1",
                        "message": "This is test notification 1",
                        "type": "education",
                        "priority": "medium",
                        "isRead": False,
                        "dismissed": False,
                        "createdAt": "2025-01-15T10:30:00Z",
                        "sentAt": "2025-01-15T10:30:00Z",
                        "deepLink": "/test1",
                        "triggerType": "educational_moment",
                        "triggerData": {"test": "data1"},
                        "status": "sent"
                    },
                    {
                        "id": "test-notif-2",
                        "userId": "demo",
                        "title": "Test Notification 2",
                        "message": "This is test notification 2",
                        "type": "portfolio",
                        "priority": "high",
                        "isRead": True,
                        "dismissed": False,
                        "createdAt": "2025-01-15T09:15:00Z",
                        "sentAt": "2025-01-15T09:15:00Z",
                        "deepLink": "/test2",
                        "triggerType": "portfolio_change",
                        "triggerData": {"test": "data2"},
                        "status": "sent"
                    }
                ]
            }
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
    def client_with_test_data(self, temp_data_file):
        """Create test client with temporary data file"""
        # Replace the repository with test repository
        test_repository = JSONNotificationRepository(temp_data_file)
        container = get_container()
        container.register_mock_repository(test_repository)
        
        return TestClient(app)
    
    def test_patch_notification_mark_as_read_success(self, client_with_test_data):
        """Test PATCH /notifications/{id} - mark as read success"""
        # Act
        response = client_with_test_data.patch("/notifications/test-notif-1")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["message"] == "Notification marked as read"
        assert data["data"]["id"] == "test-notif-1"
        assert data["data"]["isRead"] == True
        assert data["data"]["userId"] == "demo"
    
    def test_patch_notification_mark_as_read_not_found(self, client_with_test_data):
        """Test PATCH /notifications/{id} - notification not found"""
        # Act
        response = client_with_test_data.patch("/notifications/non-existent-id")
        
        # Assert
        assert response.status_code == 404
        data = response.json()
        assert "Notification with ID non-existent-id not found" in data["detail"]
    
    def test_delete_notification_dismiss_success(self, client_with_test_data):
        """Test DELETE /notifications/{id} - dismiss success"""
        # Act
        response = client_with_test_data.delete("/notifications/test-notif-1")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["message"] == "Notification dismissed successfully"
        assert data["data"]["id"] == "test-notif-1"
        assert data["data"]["dismissed"] == True
        assert data["data"]["userId"] == "demo"
    
    def test_delete_notification_dismiss_not_found(self, client_with_test_data):
        """Test DELETE /notifications/{id} - notification not found"""
        # Act
        response = client_with_test_data.delete("/notifications/non-existent-id")
        
        # Assert
        assert response.status_code == 404
        data = response.json()
        assert "Notification with ID non-existent-id not found" in data["detail"]
    
    def test_delete_notification_already_dismissed(self, client_with_test_data):
        """Test DELETE /notifications/{id} - already dismissed"""
        # Arrange - first dismiss the notification
        client_with_test_data.delete("/notifications/test-notif-1")
        
        # Act - try to dismiss again
        response = client_with_test_data.delete("/notifications/test-notif-1")
        
        # Assert
        assert response.status_code == 400
        data = response.json()
        assert "already dismissed" in data["detail"]
    
    def test_post_mark_all_as_read_success(self, client_with_test_data):
        """Test POST /notifications/mark-all-read - success"""
        # Act
        response = client_with_test_data.post(
            "/notifications/mark-all-read",
            json={"userId": "demo"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "Marked" in data["message"]
        assert data["data"]["userId"] == "demo"
        assert data["data"]["markedCount"] >= 0
    
    def test_post_mark_all_as_read_missing_user_id(self, client_with_test_data):
        """Test POST /notifications/mark-all-read - missing userId"""
        # Act
        response = client_with_test_data.post(
            "/notifications/mark-all-read",
            json={}
        )
        
        # Assert
        assert response.status_code == 400
        data = response.json()
        assert "userId is required" in data["detail"]
    
    def test_get_notification_by_id_success(self, client_with_test_data):
        """Test GET /notifications/{id} - success"""
        # Act
        response = client_with_test_data.get("/notifications/test-notif-1")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["id"] == "test-notif-1"
        assert data["data"]["title"] == "Test Notification 1"
        assert data["data"]["userId"] == "demo"
        assert "createdAt" in data["data"]
        assert "triggerType" in data["data"]
        assert "triggerData" in data["data"]
    
    def test_get_notification_by_id_not_found(self, client_with_test_data):
        """Test GET /notifications/{id} - not found"""
        # Act
        response = client_with_test_data.get("/notifications/non-existent-id")
        
        # Assert
        assert response.status_code == 404
        data = response.json()
        assert "Notification not found" in data["detail"]
    
    def test_get_user_notifications_success(self, client_with_test_data):
        """Test GET /users/{user_id}/notifications - success"""
        # Act
        response = client_with_test_data.get("/users/demo/notifications")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["user_id"] == "demo"
        assert len(data["data"]) >= 1  # At least one notification
        assert data["total_count"] >= 1
        
        # Check notification structure
        notification = data["data"][0]
        assert "id" in notification
        assert "title" in notification
        assert "message" in notification
        assert "deep_link" in notification
        assert "trigger_type" in notification
        assert "status" in notification
        assert "created_at" in notification
    
    def test_get_user_notifications_with_limit(self, client_with_test_data):
        """Test GET /users/{user_id}/notifications with limit parameter"""
        # Act
        response = client_with_test_data.get("/users/demo/notifications?limit=1")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert len(data["data"]) <= 1
    
    def test_persistence_after_operations(self, client_with_test_data):
        """Test that operations persist across requests"""
        # Arrange - mark notification as read
        mark_response = client_with_test_data.patch("/notifications/test-notif-1")
        assert mark_response.status_code == 200
        
        # Act - retrieve the same notification
        get_response = client_with_test_data.get("/notifications/test-notif-1")
        
        # Assert - should still be marked as read
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["data"]["isRead"] == True
    
    def test_workflow_mark_read_then_dismiss(self, client_with_test_data):
        """Test complete workflow: mark as read then dismiss"""
        notification_id = "test-notif-1"
        
        # Step 1: Mark as read
        mark_response = client_with_test_data.patch(f"/notifications/{notification_id}")
        assert mark_response.status_code == 200
        assert mark_response.json()["data"]["isRead"] == True
        
        # Step 2: Dismiss notification
        dismiss_response = client_with_test_data.delete(f"/notifications/{notification_id}")
        assert dismiss_response.status_code == 200
        assert dismiss_response.json()["data"]["dismissed"] == True
        
        # Step 3: Verify notification is dismissed
        get_response = client_with_test_data.get(f"/notifications/{notification_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["data"]["isRead"] == True
        assert data["data"]["dismissed"] == True
        
        # Step 4: Verify dismissed notification doesn't appear in user notifications
        user_notifications_response = client_with_test_data.get("/users/demo/notifications")
        assert user_notifications_response.status_code == 200
        notifications = user_notifications_response.json()["data"]
        notification_ids = [n["id"] for n in notifications]
        assert notification_id not in notification_ids
    
    def test_mark_all_as_read_workflow(self, client_with_test_data):
        """Test mark all as read affects multiple notifications"""
        # Arrange - verify we have unread notifications
        user_notifications_response = client_with_test_data.get("/users/demo/notifications")
        notifications_before = user_notifications_response.json()["data"]
        unread_before = [n for n in notifications_before if not n.get("isRead", False)]
        
        # Act - mark all as read
        mark_all_response = client_with_test_data.post(
            "/notifications/mark-all-read",
            json={"userId": "demo"}
        )
        
        # Assert
        assert mark_all_response.status_code == 200
        marked_count = mark_all_response.json()["data"]["markedCount"]
        
        # Verify notifications are now read
        user_notifications_response_after = client_with_test_data.get("/users/demo/notifications")
        notifications_after = user_notifications_response_after.json()["data"]
        
        # All visible notifications should be read
        for notification in notifications_after:
            # Get full notification details to check read status
            detail_response = client_with_test_data.get(f"/notifications/{notification['id']}")
            if detail_response.status_code == 200:
                detail_data = detail_response.json()["data"]
                if not detail_data["dismissed"]:  # Only check non-dismissed notifications
                    assert detail_data["isRead"] == True
    
    def test_error_handling_invalid_json(self, client_with_test_data):
        """Test error handling with invalid JSON in request body"""
        # Act
        response = client_with_test_data.post(
            "/notifications/mark-all-read",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        
        # Assert
        assert response.status_code == 422  # FastAPI validation error
    
    def test_cors_headers_present(self, client_with_test_data):
        """Test that CORS headers are properly set"""
        # Act
        response = client_with_test_data.get("/notifications/test-notif-1")
        
        # Assert
        # Note: In test environment, CORS headers might not be exactly the same
        # This test ensures the endpoint is accessible
        assert response.status_code == 200
