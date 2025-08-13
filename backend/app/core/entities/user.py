"""
User Entity - Domain Layer
Following Clean Architecture and Domain-Driven Design principles
"""
from datetime import datetime
from typing import Optional
from dataclasses import dataclass
from enum import Enum


class AuthProvider(Enum):
    """Authentication provider types"""
    LOCAL = "local"
    GOOGLE = "google"
    GITHUB = "github"


@dataclass
class User:
    """
    User Domain Entity
    
    Represents a user in the Capital Craft system with support for multiple
    authentication providers (local, OAuth).
    
    Following Domain-Driven Design:
    - Rich domain model with business logic
    - Immutable by design (dataclass with frozen=True would be ideal for prod)
    - No infrastructure concerns (no database-specific annotations)
    """
    
    # Identity
    id: Optional[str] = None  # UUID will be assigned by repository
    email: str = ""
    username: str = ""
    
    # Authentication
    provider: AuthProvider = AuthProvider.LOCAL
    provider_id: Optional[str] = None  # OAuth provider user ID
    password_hash: Optional[str] = None  # Only for local auth
    
    # Profile
    avatar_url: Optional[str] = None
    
    # Metadata
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_active: bool = True
    
    def __post_init__(self):
        """Validate user data after initialization"""
        if not self.email:
            raise ValueError("Email is required")
        
        if not self.username:
            raise ValueError("Username is required")
        
        if self.provider == AuthProvider.LOCAL and not self.password_hash:
            raise ValueError("Password hash is required for local authentication")
        
        if self.provider != AuthProvider.LOCAL and not self.provider_id:
            raise ValueError(f"Provider ID is required for {self.provider.value} authentication")
    
    def is_oauth_user(self) -> bool:
        """Check if user uses OAuth authentication"""
        return self.provider != AuthProvider.LOCAL
    
    def can_login_with_password(self) -> bool:
        """Check if user can login with password"""
        return self.provider == AuthProvider.LOCAL and self.password_hash is not None
    
    def get_display_name(self) -> str:
        """Get user's display name"""
        return self.username or self.email.split('@')[0]
    
    def update_last_login(self) -> 'User':
        """Update last login timestamp (immutable pattern)"""
        # In a fully immutable design, this would return a new User instance
        # For now, we'll use this pattern to prepare for immutability
        self.updated_at = datetime.utcnow()
        return self
    
    def deactivate(self) -> 'User':
        """Deactivate user account"""
        self.is_active = False
        self.updated_at = datetime.utcnow()
        return self
    
    def activate(self) -> 'User':
        """Activate user account"""
        self.is_active = True
        self.updated_at = datetime.utcnow()
        return self
    
    def update_profile(self, username: Optional[str] = None, avatar_url: Optional[str] = None) -> 'User':
        """Update user profile information"""
        if username:
            self.username = username
        if avatar_url is not None:
            self.avatar_url = avatar_url
        
        self.updated_at = datetime.utcnow()
        return self


def create_oauth_user(email: str, username: str, provider: AuthProvider, provider_id: str, avatar_url: Optional[str] = None) -> User:
    """
    Factory function to create OAuth user
    
    Args:
        email: User email
        username: Username
        provider: OAuth provider
        provider_id: Provider-specific user ID
        avatar_url: Optional avatar URL
        
    Returns:
        User: New OAuth user instance
    """
    return User(
        email=email,
        username=username,
        provider=provider,
        provider_id=provider_id,
        avatar_url=avatar_url,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


def create_local_user(email: str, username: str, password_hash: str) -> User:
    """
    Factory function to create local user
    
    Args:
        email: User email
        username: Username  
        password_hash: Hashed password
        
    Returns:
        User: New local user instance
    """
    return User(
        email=email,
        username=username,
        provider=AuthProvider.LOCAL,
        password_hash=password_hash,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )