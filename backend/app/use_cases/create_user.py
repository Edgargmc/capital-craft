"""
Create User Use Case
Business logic for user creation with validation
"""
from typing import Optional
from app.core.entities.user import User, create_local_user, create_oauth_user, AuthProvider
from app.core.interfaces.user_repository import UserRepository
from app.core.interfaces.portfolio_repository import PortfolioRepository
from app.core.entities.portfolio import create_portfolio


class CreateUserUseCase:
    """
    Use case for creating new users.
    
    Handles both local (email/password) and OAuth user creation.
    Automatically creates a portfolio for new users.
    
    Business Rules:
    - Email must be unique
    - Username must be unique
    - OAuth users must have valid provider ID
    - Local users must have password hash
    - New users get a default portfolio with $10,000
    """
    
    def __init__(self, user_repository: UserRepository, portfolio_repository: PortfolioRepository):
        self.user_repository = user_repository
        self.portfolio_repository = portfolio_repository
    
    async def execute_local_user(
        self, 
        email: str, 
        username: str, 
        password_hash: str
    ) -> User:
        """
        Create a local user (email/password authentication).
        
        Args:
            email: User email address
            username: Username
            password_hash: Hashed password
            
        Returns:
            Created user with portfolio
            
        Raises:
            ValueError: If email/username already exists or invalid data
        """
        # Validate uniqueness
        await self._validate_user_uniqueness(email, username)
        
        # Create user entity
        user = create_local_user(email, username, password_hash)
        
        # Save user
        created_user = await self.user_repository.create_user(user)
        
        # Create default portfolio
        await self._create_default_portfolio(created_user.id)
        
        return created_user
    
    async def execute_oauth_user(
        self,
        email: str,
        username: str,
        provider: AuthProvider,
        provider_id: str,
        avatar_url: Optional[str] = None
    ) -> User:
        """
        Create an OAuth user.
        
        Args:
            email: User email address
            username: Username
            provider: OAuth provider
            provider_id: Provider-specific user ID
            avatar_url: Optional avatar URL
            
        Returns:
            Created user with portfolio
            
        Raises:
            ValueError: If email/username already exists or invalid data
        """
        # Check if OAuth user already exists
        existing_user = await self.user_repository.get_user_by_provider(provider, provider_id)
        if existing_user:
            raise ValueError(f"User already exists with {provider.value} ID: {provider_id}")
        
        # Validate uniqueness of email/username
        await self._validate_user_uniqueness(email, username)
        
        # Create user entity
        user = create_oauth_user(email, username, provider, provider_id, avatar_url)
        
        # Save user
        created_user = await self.user_repository.create_user(user)
        
        # Create default portfolio
        await self._create_default_portfolio(created_user.id)
        
        return created_user
    
    async def get_or_create_oauth_user(
        self,
        email: str,
        username: str,
        provider: AuthProvider,
        provider_id: str,
        avatar_url: Optional[str] = None
    ) -> tuple[User, bool]:
        """
        Get existing OAuth user or create new one.
        
        Args:
            email: User email address
            username: Username
            provider: OAuth provider
            provider_id: Provider-specific user ID
            avatar_url: Optional avatar URL
            
        Returns:
            Tuple of (user, was_created)
        """
        # Try to find existing user by provider
        existing_user = await self.user_repository.get_user_by_provider(provider, provider_id)
        if existing_user:
            return existing_user, False
        
        # Try to find by email (user might have switched auth methods)
        existing_user = await self.user_repository.get_user_by_email(email)
        if existing_user:
            # Update user to include OAuth provider info
            existing_user.provider = provider
            existing_user.provider_id = provider_id
            if avatar_url:
                existing_user.avatar_url = avatar_url
            
            updated_user = await self.user_repository.update_user(existing_user)
            return updated_user, False
        
        # Create new user
        new_user = await self.execute_oauth_user(email, username, provider, provider_id, avatar_url)
        return new_user, True
    
    async def _validate_user_uniqueness(self, email: str, username: str) -> None:
        """Validate that email and username are unique."""
        if await self.user_repository.user_exists_by_email(email):
            raise ValueError(f"User already exists with email: {email}")
        
        if await self.user_repository.user_exists_by_username(username):
            raise ValueError(f"User already exists with username: {username}")
    
    async def _create_default_portfolio(self, user_id: str) -> None:
        """Create default portfolio for new user."""
        portfolio = create_portfolio(user_id)
        await self.portfolio_repository.save_portfolio(portfolio)