"""
JWT Token Management System
Handles token creation, validation, and refresh
"""
import os
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from dataclasses import dataclass


@dataclass
class TokenPair:
    """Token pair containing access and refresh tokens"""
    access_token: str
    refresh_token: str
    expires_in: int  # Access token expiration in seconds
    token_type: str = "Bearer"


@dataclass
class TokenPayload:
    """JWT token payload"""
    user_id: str
    email: str
    username: str
    provider: str
    exp: datetime
    iat: datetime
    token_type: str  # "access" or "refresh"


class JWTManager:
    """
    JWT Token Management System
    
    Handles creation, validation, and refresh of JWT tokens
    following security best practices.
    
    Features:
    - Separate access and refresh tokens
    - Configurable expiration times
    - Token type validation
    - Secure secret key management
    """
    
    def __init__(self):
        self.secret_key = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
        self.algorithm = "HS256"
        
        # Token expiration times
        self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
        self.refresh_token_expire_days = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
        
        # Validate configuration
        if self.secret_key == "dev-secret-key-change-in-production" and os.getenv("ENVIRONMENT") == "production":
            raise ValueError("JWT_SECRET_KEY must be set in production environment")
    
    def create_token_pair(self, user_id: str, email: str, username: str, provider: str) -> TokenPair:
        """
        Create access and refresh token pair for user.
        
        Args:
            user_id: User identifier
            email: User email
            username: Username
            provider: Authentication provider
            
        Returns:
            TokenPair with access and refresh tokens
        """
        now = datetime.now(timezone.utc)
        
        # Create access token (short-lived)
        access_token_data = {
            "user_id": user_id,
            "email": email,
            "username": username,
            "provider": provider,
            "token_type": "access",
            "iat": now,
            "exp": now + timedelta(minutes=self.access_token_expire_minutes)
        }
        
        # Create refresh token (long-lived)
        refresh_token_data = {
            "user_id": user_id,
            "email": email,
            "username": username,
            "provider": provider,
            "token_type": "refresh",
            "iat": now,
            "exp": now + timedelta(days=self.refresh_token_expire_days)
        }
        
        access_token = jwt.encode(access_token_data, self.secret_key, algorithm=self.algorithm)
        refresh_token = jwt.encode(refresh_token_data, self.secret_key, algorithm=self.algorithm)
        
        return TokenPair(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=self.access_token_expire_minutes * 60,
            token_type="Bearer"
        )
    
    def verify_token(self, token: str, expected_type: str = "access") -> Optional[TokenPayload]:
        """
        Verify and decode JWT token.
        
        Args:
            token: JWT token string
            expected_type: Expected token type ("access" or "refresh")
            
        Returns:
            TokenPayload if valid, None if invalid
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Validate token type
            if payload.get("token_type") != expected_type:
                return None
            
            # Create TokenPayload
            return TokenPayload(
                user_id=payload["user_id"],
                email=payload["email"],
                username=payload["username"],
                provider=payload["provider"],
                exp=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
                iat=datetime.fromtimestamp(payload["iat"], tz=timezone.utc),
                token_type=payload["token_type"]
            )
            
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
        except KeyError:
            # Missing required fields
            return None
    
    def refresh_access_token(self, refresh_token: str) -> Optional[str]:
        """
        Create new access token from valid refresh token.
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            New access token if refresh token valid, None otherwise
        """
        # Verify refresh token
        payload = self.verify_token(refresh_token, "refresh")
        if not payload:
            return None
        
        # Create new access token
        now = datetime.now(timezone.utc)
        access_token_data = {
            "user_id": payload.user_id,
            "email": payload.email,
            "username": payload.username,
            "provider": payload.provider,
            "token_type": "access",
            "iat": now,
            "exp": now + timedelta(minutes=self.access_token_expire_minutes)
        }
        
        return jwt.encode(access_token_data, self.secret_key, algorithm=self.algorithm)
    
    def is_token_expired(self, token: str) -> bool:
        """
        Check if token is expired without validating signature.
        
        Args:
            token: JWT token string
            
        Returns:
            True if expired, False if valid or invalid format
        """
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
            return datetime.now(timezone.utc) > exp
        except (jwt.InvalidTokenError, KeyError):
            return True
    
    def decode_token_unsafe(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Decode token without signature verification (for debugging).
        
        Args:
            token: JWT token string
            
        Returns:
            Token payload if decodable, None otherwise
        """
        try:
            return jwt.decode(token, options={"verify_signature": False})
        except jwt.InvalidTokenError:
            return None
    
    def get_token_expiration(self, token: str) -> Optional[datetime]:
        """
        Get token expiration time.
        
        Args:
            token: JWT token string
            
        Returns:
            Expiration datetime if valid token, None otherwise
        """
        payload = self.decode_token_unsafe(token)
        if not payload or "exp" not in payload:
            return None
        
        return datetime.fromtimestamp(payload["exp"], tz=timezone.utc)


# Global JWT manager instance
jwt_manager = JWTManager()