"""
Simple API Integration Tests for Authentication Endpoints
Testing complete HTTP request/response cycle without real database
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from main import app
from app.core.entities.user import AuthProvider
from app.infrastructure.auth.jwt_manager import jwt_manager


class TestAuthAPISimple:
    """Test authentication API endpoints with mocked dependencies"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    def sample_user_data(self):
        """Sample user data for testing"""
        return {
            "email": "apitest@example.com",
            "username": "apitestuser",
            "password": "testpassword123"
        }
    
    def test_register_endpoint_success(self, client, sample_user_data):
        """Test successful user registration"""
        with patch('app.api.auth.get_create_user_use_case') as mock_use_case_dep:
            # Mock the use case
            mock_use_case = AsyncMock()
            mock_use_case_dep.return_value = mock_use_case
            
            # Mock successful user creation
            from app.core.entities.user import create_local_user
            mock_user = create_local_user(
                email=sample_user_data["email"],
                username=sample_user_data["username"],
                password_hash="mocked_hash"
            )
            mock_user.id = "test-user-id-123"
            mock_use_case.execute_local_user.return_value = mock_user
            
            response = client.post("/auth/register", json=sample_user_data)
            
            assert response.status_code == 200
            data = response.json()
            
            assert "access_token" in data
            assert "refresh_token" in data
            assert "expires_in" in data
            assert data["token_type"] == "Bearer"
            assert data["user"]["email"] == sample_user_data["email"]
            assert data["user"]["username"] == sample_user_data["username"]
    
    def test_register_endpoint_duplicate_email(self, client, sample_user_data):
        """Test registration with duplicate email"""
        with patch('app.api.auth.get_create_user_use_case') as mock_use_case_dep:
            mock_use_case = AsyncMock()
            mock_use_case_dep.return_value = mock_use_case
            
            # Mock duplicate email error
            mock_use_case.execute_local_user.side_effect = ValueError("User already exists with email: apitest@example.com")
            
            response = client.post("/auth/register", json=sample_user_data)
            
            assert response.status_code == 400
            assert "User already exists with email" in response.json()["detail"]
    
    def test_register_endpoint_invalid_email(self, client):
        """Test registration with invalid email format"""
        invalid_data = {
            "email": "invalid-email",
            "username": "testuser",
            "password": "testpass123"
        }
        
        response = client.post("/auth/register", json=invalid_data)
        assert response.status_code == 422  # Pydantic validation error
    
    def test_login_endpoint_success(self, client):
        """Test successful user login"""
        login_data = {
            "email": "test@example.com",
            "password": "testpassword"
        }
        
        with patch('app.api.auth.get_authenticate_user_use_case') as mock_use_case_dep:
            mock_use_case = AsyncMock()
            mock_use_case_dep.return_value = mock_use_case
            
            # Mock successful authentication
            from app.core.entities.user import create_local_user
            mock_user = create_local_user(
                email=login_data["email"],
                username="testuser",
                password_hash="hashed_password"
            )
            mock_user.id = "test-user-id-123"
            mock_use_case.authenticate_local_user.return_value = mock_user
            
            response = client.post("/auth/login", json=login_data)
            
            assert response.status_code == 200
            data = response.json()
            
            assert "access_token" in data
            assert "refresh_token" in data
            assert data["user"]["email"] == login_data["email"]
    
    def test_login_endpoint_invalid_credentials(self, client):
        """Test login with invalid credentials"""
        login_data = {
            "email": "test@example.com",
            "password": "wrongpassword"
        }
        
        with patch('app.api.auth.get_authenticate_user_use_case') as mock_use_case_dep:
            mock_use_case = AsyncMock()
            mock_use_case_dep.return_value = mock_use_case
            
            # Mock authentication failure
            mock_use_case.authenticate_local_user.return_value = None
            
            response = client.post("/auth/login", json=login_data)
            
            assert response.status_code == 401
            assert "Invalid email or password" in response.json()["detail"]
    
    def test_refresh_token_endpoint_success(self, client):
        """Test successful token refresh"""
        # Create a valid refresh token
        token_pair = jwt_manager.create_token_pair(
            user_id="test-user-123",
            email="test@example.com",
            username="testuser",
            provider="local"
        )
        
        refresh_data = {
            "refresh_token": token_pair.refresh_token
        }
        
        response = client.post("/auth/refresh", json=refresh_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert data["token_type"] == "Bearer"
    
    def test_refresh_token_endpoint_invalid_token(self, client):
        """Test token refresh with invalid refresh token"""
        refresh_data = {
            "refresh_token": "invalid.refresh.token"
        }
        
        response = client.post("/auth/refresh", json=refresh_data)
        
        assert response.status_code == 401
        assert "Invalid or expired refresh token" in response.json()["detail"]
    
    def test_me_endpoint_success(self, client):
        """Test getting current user information"""
        # Create a valid access token
        token_pair = jwt_manager.create_token_pair(
            user_id="test-user-123",
            email="test@example.com",
            username="testuser",
            provider="local"
        )
        
        headers = {
            "Authorization": f"Bearer {token_pair.access_token}"
        }
        
        with patch('app.api.auth.get_authenticate_user_use_case') as mock_use_case_dep:
            mock_use_case = AsyncMock()
            mock_use_case_dep.return_value = mock_use_case
            
            # Mock user retrieval
            from app.core.entities.user import create_local_user
            mock_user = create_local_user(
                email="test@example.com",
                username="testuser",
                password_hash="hash123"
            )
            mock_user.id = "test-user-123"
            mock_use_case.get_user_by_id.return_value = mock_user
            
            response = client.get("/auth/me", headers=headers)
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["id"] == "test-user-123"
            assert data["email"] == "test@example.com"
            assert data["username"] == "testuser"
            assert data["provider"] == "local"
            assert data["is_active"] is True
    
    def test_me_endpoint_missing_token(self, client):
        """Test getting current user without authorization token"""
        response = client.get("/auth/me")
        
        assert response.status_code == 401
        assert "Missing or invalid authorization header" in response.json()["detail"]
    
    def test_me_endpoint_invalid_token(self, client):
        """Test getting current user with invalid token"""
        headers = {
            "Authorization": "Bearer invalid.token.here"
        }
        
        response = client.get("/auth/me", headers=headers)
        
        assert response.status_code == 401
        assert "Invalid or expired token" in response.json()["detail"]
    
    def test_logout_endpoint(self, client):
        """Test user logout endpoint"""
        response = client.post("/auth/logout")
        
        assert response.status_code == 200
        assert "Logged out successfully" in response.json()["message"]