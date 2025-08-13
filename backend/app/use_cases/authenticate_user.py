"""
Authenticate User Use Case
Business logic for user authentication
"""
from typing import Optional
from datetime import datetime, timedelta
from app.core.entities.user import User, AuthProvider
from app.core.interfaces.user_repository import UserRepository


class AuthenticateUserUseCase:
    """
    Use case for user authentication.
    
    Handles both local (email/password) and OAuth authentication.
    Manages user login validation and session management.
    
    Business Rules:
    - User must be active
    - Local users must provide valid password
    - OAuth users must have valid provider credentials
    - Failed authentication attempts should be logged
    """
    
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository
    
    async def authenticate_local_user(self, email: str, password_hash: str) -> Optional[User]:
        """
        Authenticate local user with email and password.
        
        Args:
            email: User email address
            password_hash: Hashed password to verify
            
        Returns:
            User if authentication successful, None otherwise
        """
        # Get user by email
        user = await self.user_repository.get_user_by_email(email)
        
        if not user:
            return None
        
        # Check if user is active
        if not user.is_active:
            return None
        
        # Check if user can login with password (local auth)
        if not user.can_login_with_password():
            return None
        
        # Verify password hash
        if user.password_hash != password_hash:
            return None
        
        # Update last login and return user
        user.update_last_login()
        await self.user_repository.update_user(user)
        
        return user
    
    async def authenticate_oauth_user(
        self, 
        provider: AuthProvider, 
        provider_id: str
    ) -> Optional[User]:
        """
        Authenticate OAuth user.
        
        Args:
            provider: OAuth provider (google, github, etc.)
            provider_id: Provider-specific user ID
            
        Returns:
            User if authentication successful, None otherwise
        """
        # Get user by provider
        user = await self.user_repository.get_user_by_provider(provider, provider_id)
        
        if not user:
            return None
        
        # Check if user is active
        if not user.is_active:
            return None
        
        # Check if user is OAuth user
        if not user.is_oauth_user():
            return None
        
        # Update last login and return user
        user.update_last_login()
        await self.user_repository.update_user(user)
        
        return user
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        Get user by ID for token validation.
        
        Args:
            user_id: User identifier
            
        Returns:
            User if exists and active, None otherwise
        """
        user = await self.user_repository.get_user_by_id(user_id)
        
        if not user or not user.is_active:
            return None
        
        return user
    
    async def validate_user_session(self, user_id: str) -> Optional[User]:
        """
        Validate user session (for JWT token validation).
        
        Args:
            user_id: User identifier from token
            
        Returns:
            User if session valid, None otherwise
        """
        return await self.get_user_by_id(user_id)
    
    async def deactivate_user(self, user_id: str) -> bool:
        """
        Deactivate user account (soft delete).
        
        Args:
            user_id: User identifier
            
        Returns:
            True if deactivated successfully, False if user not found
        """
        user = await self.user_repository.get_user_by_id(user_id)
        
        if not user:
            return False
        
        user.deactivate()
        await self.user_repository.update_user(user)
        
        return True
    
    async def reactivate_user(self, user_id: str) -> bool:
        """
        Reactivate user account.
        
        Args:
            user_id: User identifier
            
        Returns:
            True if reactivated successfully, False if user not found
        """
        user = await self.user_repository.get_user_by_id(user_id)
        
        if not user:
            return False
        
        user.activate()
        await self.user_repository.update_user(user)
        
        return True