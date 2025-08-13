"""
Unit Tests for JWT Manager
Testing token creation, validation, and refresh logic
"""
import pytest
import jwt
import os
from datetime import datetime, timedelta, timezone
from unittest.mock import patch
from app.infrastructure.auth.jwt_manager import JWTManager, TokenPair, TokenPayload


class TestJWTManager:
    """Test JWT token management functionality"""
    
    @pytest.fixture
    def jwt_manager(self):
        """Create JWT manager with test configuration"""
        with patch.dict(os.environ, {
            'JWT_SECRET_KEY': 'test-secret-key-for-testing',
            'ACCESS_TOKEN_EXPIRE_MINUTES': '5',
            'REFRESH_TOKEN_EXPIRE_DAYS': '1'
        }):
            return JWTManager()
    
    def test_jwt_manager_initialization(self, jwt_manager):
        """Test JWT manager initializes with correct configuration"""
        assert jwt_manager.secret_key == 'test-secret-key-for-testing'
        assert jwt_manager.algorithm == 'HS256'
        assert jwt_manager.access_token_expire_minutes == 5
        assert jwt_manager.refresh_token_expire_days == 1
    
    def test_create_token_pair_success(self, jwt_manager):
        """Test successful token pair creation"""
        token_pair = jwt_manager.create_token_pair(
            user_id="test-user-123",
            email="test@example.com",
            username="testuser",
            provider="local"
        )
        
        assert isinstance(token_pair, TokenPair)
        assert token_pair.access_token is not None
        assert token_pair.refresh_token is not None
        assert token_pair.expires_in == 5 * 60  # 5 minutes in seconds
        assert token_pair.token_type == "Bearer"
    
    def test_verify_valid_access_token(self, jwt_manager):
        """Test verification of valid access token"""
        token_pair = jwt_manager.create_token_pair(
            user_id="test-user-123",
            email="test@example.com",
            username="testuser",
            provider="local"
        )
        
        payload = jwt_manager.verify_token(token_pair.access_token, "access")
        
        assert payload is not None
        assert payload.user_id == "test-user-123"
        assert payload.email == "test@example.com"
        assert payload.username == "testuser"
        assert payload.provider == "local"
        assert payload.token_type == "access"
    
    def test_verify_valid_refresh_token(self, jwt_manager):
        """Test verification of valid refresh token"""
        token_pair = jwt_manager.create_token_pair(
            user_id="test-user-123",
            email="test@example.com",
            username="testuser",
            provider="google"
        )
        
        payload = jwt_manager.verify_token(token_pair.refresh_token, "refresh")
        
        assert payload is not None
        assert payload.user_id == "test-user-123"
        assert payload.token_type == "refresh"
    
    def test_verify_token_wrong_type(self, jwt_manager):
        """Test token verification fails with wrong expected type"""
        token_pair = jwt_manager.create_token_pair(
            user_id="test-user-123",
            email="test@example.com",
            username="testuser",
            provider="local"
        )
        
        # Try to verify access token as refresh token
        payload = jwt_manager.verify_token(token_pair.access_token, "refresh")
        assert payload is None
        
        # Try to verify refresh token as access token
        payload = jwt_manager.verify_token(token_pair.refresh_token, "access")
        assert payload is None
    
    def test_verify_invalid_token(self, jwt_manager):
        """Test verification of invalid token"""
        invalid_token = "invalid.token.here"
        payload = jwt_manager.verify_token(invalid_token, "access")
        assert payload is None
    
    def test_verify_expired_token(self, jwt_manager):
        """Test verification of expired token"""
        # Create token with very short expiration
        with patch.dict(os.environ, {'ACCESS_TOKEN_EXPIRE_MINUTES': '0'}):
            short_jwt_manager = JWTManager()
            token_pair = short_jwt_manager.create_token_pair(
                user_id="test-user-123",
                email="test@example.com",
                username="testuser",
                provider="local"
            )
        
        # Token should be expired immediately
        import time
        time.sleep(0.1)
        
        payload = jwt_manager.verify_token(token_pair.access_token, "access")
        assert payload is None
    
    def test_refresh_access_token_success(self, jwt_manager):
        """Test successful access token refresh"""
        token_pair = jwt_manager.create_token_pair(
            user_id="test-user-123",
            email="test@example.com",
            username="testuser",
            provider="local"
        )
        
        new_access_token = jwt_manager.refresh_access_token(token_pair.refresh_token)
        
        assert new_access_token is not None
        
        # Verify new token works
        payload = jwt_manager.verify_token(new_access_token, "access")
        assert payload is not None
        assert payload.user_id == "test-user-123"
        assert payload.token_type == "access"
    
    def test_refresh_access_token_invalid_refresh_token(self, jwt_manager):
        """Test access token refresh with invalid refresh token"""
        invalid_refresh_token = "invalid.refresh.token"
        new_access_token = jwt_manager.refresh_access_token(invalid_refresh_token)
        assert new_access_token is None
    
    def test_refresh_access_token_wrong_token_type(self, jwt_manager):
        """Test access token refresh with access token instead of refresh token"""
        token_pair = jwt_manager.create_token_pair(
            user_id="test-user-123",
            email="test@example.com",
            username="testuser",
            provider="local"
        )
        
        # Try to refresh with access token instead of refresh token
        new_access_token = jwt_manager.refresh_access_token(token_pair.access_token)
        assert new_access_token is None
    
    def test_is_token_expired(self, jwt_manager):
        """Test token expiration check"""
        token_pair = jwt_manager.create_token_pair(
            user_id="test-user-123",
            email="test@example.com",
            username="testuser",
            provider="local"
        )
        
        # Valid token should not be expired
        assert jwt_manager.is_token_expired(token_pair.access_token) is False
        
        # Invalid token should be considered expired
        assert jwt_manager.is_token_expired("invalid.token") is True
    
    def test_decode_token_unsafe(self, jwt_manager):
        """Test unsafe token decoding for debugging"""
        token_pair = jwt_manager.create_token_pair(
            user_id="test-user-123",
            email="test@example.com",
            username="testuser",
            provider="local"
        )
        
        payload = jwt_manager.decode_token_unsafe(token_pair.access_token)
        
        assert payload is not None
        assert payload["user_id"] == "test-user-123"
        assert payload["email"] == "test@example.com"
        assert payload["token_type"] == "access"
    
    def test_get_token_expiration(self, jwt_manager):
        """Test token expiration time extraction"""
        token_pair = jwt_manager.create_token_pair(
            user_id="test-user-123",
            email="test@example.com",
            username="testuser",
            provider="local"
        )
        
        expiration = jwt_manager.get_token_expiration(token_pair.access_token)
        
        assert expiration is not None
        assert isinstance(expiration, datetime)
        assert expiration > datetime.now(timezone.utc)
    
    def test_production_secret_key_validation(self):
        """Test that production environment requires proper secret key"""
        with patch.dict(os.environ, {
            'ENVIRONMENT': 'production',
            'JWT_SECRET_KEY': 'dev-secret-key-change-in-production'
        }):
            with pytest.raises(ValueError, match="JWT_SECRET_KEY must be set in production environment"):
                JWTManager()
    
    def test_token_contains_correct_timestamps(self, jwt_manager):
        """Test that tokens contain correct issued at and expiration timestamps"""
        before_creation = datetime.now(timezone.utc)
        
        token_pair = jwt_manager.create_token_pair(
            user_id="test-user-123",
            email="test@example.com",
            username="testuser",
            provider="local"
        )
        
        after_creation = datetime.now(timezone.utc)
        
        access_payload = jwt_manager.verify_token(token_pair.access_token, "access")
        refresh_payload = jwt_manager.verify_token(token_pair.refresh_token, "refresh")
        
        # Check issued at timestamps - allow small tolerance for microsecond precision
        assert abs((access_payload.iat - before_creation).total_seconds()) < 1
        assert abs((refresh_payload.iat - before_creation).total_seconds()) < 1
        
        # Check expiration timestamps
        expected_access_exp = access_payload.iat + timedelta(minutes=5)
        expected_refresh_exp = refresh_payload.iat + timedelta(days=1)
        
        # Allow small tolerance for timing differences
        assert abs((access_payload.exp - expected_access_exp).total_seconds()) < 1
        assert abs((refresh_payload.exp - expected_refresh_exp).total_seconds()) < 1