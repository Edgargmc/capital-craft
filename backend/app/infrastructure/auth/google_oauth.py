"""
Google OAuth 2.0 Integration
Handles Google OAuth authentication flow
"""
import os
import httpx
from typing import Optional, Dict, Any
from dataclasses import dataclass
from urllib.parse import urlencode


@dataclass
class GoogleUserInfo:
    """Google user information from OAuth"""
    id: str
    email: str
    name: str
    given_name: str
    family_name: str
    picture: Optional[str] = None
    verified_email: bool = False


class GoogleOAuthConfig:
    """Google OAuth 2.0 configuration"""
    
    def __init__(self):
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        self.redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
        
        # Google OAuth URLs
        self.auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
        self.token_url = "https://oauth2.googleapis.com/token"
        self.userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        
        # Scopes
        self.scopes = ["openid", "email", "profile"]
        
        # Validate configuration
        if not self.client_id or not self.client_secret:
            # In development, we can work without OAuth
            environment = os.getenv("ENVIRONMENT", "development")
            if environment == "production":
                raise ValueError("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in production")


class GoogleOAuthClient:
    """
    Google OAuth 2.0 client for authentication
    
    Handles the complete OAuth flow:
    1. Generate authorization URL
    2. Exchange code for tokens
    3. Retrieve user information
    """
    
    def __init__(self):
        self.config = GoogleOAuthConfig()
    
    def get_authorization_url(self, state: Optional[str] = None) -> str:
        """
        Generate Google OAuth authorization URL.
        
        Args:
            state: Optional state parameter for CSRF protection
            
        Returns:
            Authorization URL for redirecting user to Google
        """
        params = {
            "client_id": self.config.client_id,
            "redirect_uri": self.config.redirect_uri,
            "scope": " ".join(self.config.scopes),
            "response_type": "code",
            "access_type": "offline",  # For refresh tokens
            "prompt": "consent"  # Force consent screen for refresh token
        }
        
        if state:
            params["state"] = state
        
        return f"{self.config.auth_url}?{urlencode(params)}"
    
    async def exchange_code_for_tokens(self, code: str) -> Optional[Dict[str, Any]]:
        """
        Exchange authorization code for access tokens.
        
        Args:
            code: Authorization code from Google OAuth callback
            
        Returns:
            Token response from Google if successful, None otherwise
        """
        if not self.config.client_id:
            # Mock response for development
            return {
                "access_token": "mock_access_token",
                "refresh_token": "mock_refresh_token",
                "expires_in": 3600,
                "token_type": "Bearer"
            }
        
        data = {
            "client_id": self.config.client_id,
            "client_secret": self.config.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": self.config.redirect_uri
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(self.config.token_url, data=data)
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return None
                    
        except Exception:
            return None
    
    async def get_user_info(self, access_token: str) -> Optional[GoogleUserInfo]:
        """
        Retrieve user information from Google using access token.
        
        Args:
            access_token: Google access token
            
        Returns:
            GoogleUserInfo if successful, None otherwise
        """
        if access_token == "mock_access_token":
            # Mock user info for development
            return GoogleUserInfo(
                id="mock_google_user_123",
                email="demo@example.com",
                name="Demo User",
                given_name="Demo",
                family_name="User",
                picture="https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
                verified_email=True
            )
        
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.config.userinfo_url, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    return GoogleUserInfo(
                        id=data["id"],
                        email=data["email"],
                        name=data["name"],
                        given_name=data.get("given_name", ""),
                        family_name=data.get("family_name", ""),
                        picture=data.get("picture"),
                        verified_email=data.get("verified_email", False)
                    )
                else:
                    return None
                    
        except Exception:
            return None
    
    def is_configured(self) -> bool:
        """Check if Google OAuth is properly configured."""
        return bool(self.config.client_id and self.config.client_secret)


# Global Google OAuth client instance
google_oauth_client = GoogleOAuthClient()