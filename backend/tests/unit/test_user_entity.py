"""
Unit Tests for User Entity
Testing domain logic without external dependencies
"""
import pytest
from datetime import datetime
from app.core.entities.user import (
    User, AuthProvider, create_local_user, create_oauth_user
)


class TestUserEntity:
    """Test User domain entity business logic"""
    
    def test_create_local_user_success(self):
        """Test successful local user creation"""
        user = create_local_user(
            email="test@example.com",
            username="testuser",
            password_hash="hashed_password_123"
        )
        
        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.password_hash == "hashed_password_123"
        assert user.provider == AuthProvider.LOCAL
        assert user.is_active is True
        assert user.created_at is not None
        assert user.updated_at is not None
    
    def test_create_oauth_user_success(self):
        """Test successful OAuth user creation"""
        user = create_oauth_user(
            email="oauth@example.com",
            username="oauthuser",
            provider=AuthProvider.GOOGLE,
            provider_id="google_123456",
            avatar_url="https://example.com/avatar.jpg"
        )
        
        assert user.email == "oauth@example.com"
        assert user.username == "oauthuser"
        assert user.provider == AuthProvider.GOOGLE
        assert user.provider_id == "google_123456"
        assert user.avatar_url == "https://example.com/avatar.jpg"
        assert user.password_hash is None
        assert user.is_active is True
    
    def test_user_validation_empty_email(self):
        """Test user validation fails with empty email"""
        with pytest.raises(ValueError, match="Email is required"):
            User(email="", username="testuser")
    
    def test_user_validation_empty_username(self):
        """Test user validation fails with empty username"""
        with pytest.raises(ValueError, match="Username is required"):
            User(email="test@example.com", username="")
    
    def test_local_user_validation_missing_password(self):
        """Test local user validation fails without password hash"""
        with pytest.raises(ValueError, match="Password hash is required for local authentication"):
            User(
                email="test@example.com",
                username="testuser",
                provider=AuthProvider.LOCAL,
                password_hash=None
            )
    
    def test_oauth_user_validation_missing_provider_id(self):
        """Test OAuth user validation fails without provider ID"""
        with pytest.raises(ValueError, match="Provider ID is required for google authentication"):
            User(
                email="test@example.com",
                username="testuser",
                provider=AuthProvider.GOOGLE,
                provider_id=None
            )
    
    def test_user_is_oauth_user(self):
        """Test OAuth user identification"""
        local_user = create_local_user("test@example.com", "testuser", "hash123")
        oauth_user = create_oauth_user("oauth@example.com", "oauthuser", AuthProvider.GOOGLE, "google_123")
        
        assert local_user.is_oauth_user() is False
        assert oauth_user.is_oauth_user() is True
    
    def test_user_can_login_with_password(self):
        """Test password login capability check"""
        local_user = create_local_user("test@example.com", "testuser", "hash123")
        oauth_user = create_oauth_user("oauth@example.com", "oauthuser", AuthProvider.GOOGLE, "google_123")
        
        assert local_user.can_login_with_password() is True
        assert oauth_user.can_login_with_password() is False
    
    def test_user_get_display_name(self):
        """Test display name generation"""
        user_with_username = create_local_user("test@example.com", "cooluser", "hash123")
        user_without_username = create_local_user("test@example.com", "tempuser", "hash123")
        
        # Bypass validation for test
        user_without_username.username = ""
        
        assert user_with_username.get_display_name() == "cooluser"
        # Should fall back to email prefix if no username
        assert "test" in user_without_username.get_display_name()
    
    def test_user_deactivate(self):
        """Test user deactivation"""
        user = create_local_user("test@example.com", "testuser", "hash123")
        original_updated_at = user.updated_at
        
        # Small delay to ensure timestamp difference
        import time
        time.sleep(0.01)
        
        user.deactivate()
        
        assert user.is_active is False
        assert user.updated_at > original_updated_at
    
    def test_user_activate(self):
        """Test user activation"""
        user = create_local_user("test@example.com", "testuser", "hash123")
        user.deactivate()
        original_updated_at = user.updated_at
        
        import time
        time.sleep(0.01)
        
        user.activate()
        
        assert user.is_active is True
        assert user.updated_at > original_updated_at
    
    def test_user_update_profile(self):
        """Test profile update functionality"""
        user = create_local_user("test@example.com", "testuser", "hash123")
        original_updated_at = user.updated_at
        
        import time
        time.sleep(0.01)
        
        user.update_profile(
            username="newusername",
            avatar_url="https://example.com/new-avatar.jpg"
        )
        
        assert user.username == "newusername"
        assert user.avatar_url == "https://example.com/new-avatar.jpg"
        assert user.updated_at > original_updated_at
    
    def test_user_update_last_login(self):
        """Test last login update"""
        user = create_local_user("test@example.com", "testuser", "hash123")
        original_updated_at = user.updated_at
        
        import time
        time.sleep(0.01)
        
        user.update_last_login()
        
        assert user.updated_at > original_updated_at