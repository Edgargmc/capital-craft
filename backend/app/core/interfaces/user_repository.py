"""
User Repository Interface
Following Clean Architecture and SOLID principles for user management
"""
from abc import ABC, abstractmethod
from typing import Optional, List
from app.core.entities.user import User, AuthProvider


class UserRepository(ABC):
    """
    Abstract repository for user persistence operations.
    
    Following SOLID principles:
    - Single Responsibility: Only handles user persistence
    - Dependency Inversion: Use cases depend on this abstraction
    - Interface Segregation: Specific to user operations
    """
    
    @abstractmethod
    async def create_user(self, user: User) -> User:
        """
        Create a new user.
        
        Args:
            user: User entity to create
            
        Returns:
            Created user with assigned ID
            
        Raises:
            ValueError: If user already exists (email/username conflict)
        """
        pass
    
    @abstractmethod
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        Retrieve user by ID.
        
        Args:
            user_id: User identifier
            
        Returns:
            User if exists, None otherwise
        """
        pass
    
    @abstractmethod
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Retrieve user by email address.
        
        Args:
            email: User email address
            
        Returns:
            User if exists, None otherwise
        """
        pass
    
    @abstractmethod
    async def get_user_by_username(self, username: str) -> Optional[User]:
        """
        Retrieve user by username.
        
        Args:
            username: Username
            
        Returns:
            User if exists, None otherwise
        """
        pass
    
    @abstractmethod
    async def get_user_by_provider(self, provider: AuthProvider, provider_id: str) -> Optional[User]:
        """
        Retrieve user by OAuth provider information.
        
        Args:
            provider: Authentication provider (google, github, etc.)
            provider_id: Provider-specific user ID
            
        Returns:
            User if exists, None otherwise
        """
        pass
    
    @abstractmethod
    async def update_user(self, user: User) -> User:
        """
        Update existing user.
        
        Args:
            user: User entity with updated information
            
        Returns:
            Updated user
            
        Raises:
            ValueError: If user doesn't exist
        """
        pass
    
    @abstractmethod
    async def delete_user(self, user_id: str) -> bool:
        """
        Delete user by ID.
        
        Args:
            user_id: User identifier
            
        Returns:
            True if deleted, False if user didn't exist
        """
        pass
    
    @abstractmethod
    async def user_exists_by_email(self, email: str) -> bool:
        """
        Check if user exists with given email.
        
        Args:
            email: Email address to check
            
        Returns:
            True if user exists, False otherwise
        """
        pass
    
    @abstractmethod
    async def user_exists_by_username(self, username: str) -> bool:
        """
        Check if user exists with given username.
        
        Args:
            username: Username to check
            
        Returns:
            True if user exists, False otherwise
        """
        pass
    
    @abstractmethod
    async def get_active_users(self, limit: Optional[int] = None) -> List[User]:
        """
        Get list of active users.
        
        Args:
            limit: Optional limit on number of users to return
            
        Returns:
            List of active users
        """
        pass