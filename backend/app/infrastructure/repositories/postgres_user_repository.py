"""
PostgreSQL User Repository Implementation
Concrete implementation of UserRepository using PostgreSQL
"""
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.exc import IntegrityError

from app.core.interfaces.user_repository import UserRepository
from app.core.entities.user import User, AuthProvider
from app.infrastructure.database.models import UserModel


class PostgresUserRepository(UserRepository):
    """
    PostgreSQL implementation of UserRepository.
    
    Maps between User domain entities and UserModel SQLAlchemy models.
    Handles database operations with proper error handling and transactions.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create_user(self, user: User) -> User:
        """Create a new user in the database."""
        try:
            # Convert User entity to UserModel
            user_model = self._user_to_model(user)
            
            self.session.add(user_model)
            await self.session.commit()
            await self.session.refresh(user_model)
            
            return self._model_to_user(user_model)
            
        except IntegrityError as e:
            await self.session.rollback()
            if "email" in str(e.orig):
                raise ValueError(f"User already exists with email: {user.email}")
            elif "username" in str(e.orig):
                raise ValueError(f"User already exists with username: {user.username}")
            else:
                raise ValueError("User creation failed due to constraint violation")
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Retrieve user by ID."""
        stmt = select(UserModel).where(UserModel.id == user_id)
        result = await self.session.execute(stmt)
        user_model = result.scalar_one_or_none()
        
        return self._model_to_user(user_model) if user_model else None
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Retrieve user by email address."""
        stmt = select(UserModel).where(UserModel.email == email)
        result = await self.session.execute(stmt)
        user_model = result.scalar_one_or_none()
        
        return self._model_to_user(user_model) if user_model else None
    
    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Retrieve user by username."""
        stmt = select(UserModel).where(UserModel.username == username)
        result = await self.session.execute(stmt)
        user_model = result.scalar_one_or_none()
        
        return self._model_to_user(user_model) if user_model else None
    
    async def get_user_by_provider(self, provider: AuthProvider, provider_id: str) -> Optional[User]:
        """Retrieve user by OAuth provider information."""
        stmt = select(UserModel).where(
            UserModel.provider == provider.value,
            UserModel.provider_id == provider_id
        )
        result = await self.session.execute(stmt)
        user_model = result.scalar_one_or_none()
        
        return self._model_to_user(user_model) if user_model else None
    
    async def update_user(self, user: User) -> User:
        """Update existing user."""
        if not user.id:
            raise ValueError("User ID is required for update")
        
        try:
            # Get existing user model
            stmt = select(UserModel).where(UserModel.id == user.id)
            result = await self.session.execute(stmt)
            user_model = result.scalar_one_or_none()
            
            if not user_model:
                raise ValueError(f"User not found with ID: {user.id}")
            
            # Update fields
            user_model.email = user.email
            user_model.username = user.username
            user_model.provider = user.provider.value
            user_model.provider_id = user.provider_id
            user_model.password_hash = user.password_hash
            user_model.avatar_url = user.avatar_url
            user_model.is_active = user.is_active
            user_model.updated_at = user.updated_at
            
            await self.session.commit()
            await self.session.refresh(user_model)
            
            return self._model_to_user(user_model)
            
        except IntegrityError as e:
            await self.session.rollback()
            if "email" in str(e.orig):
                raise ValueError(f"Email already in use: {user.email}")
            elif "username" in str(e.orig):
                raise ValueError(f"Username already in use: {user.username}")
            else:
                raise ValueError("User update failed due to constraint violation")
    
    async def delete_user(self, user_id: str) -> bool:
        """Delete user by ID."""
        stmt = delete(UserModel).where(UserModel.id == user_id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        
        return result.rowcount > 0
    
    async def user_exists_by_email(self, email: str) -> bool:
        """Check if user exists with given email."""
        stmt = select(UserModel.id).where(UserModel.email == email)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None
    
    async def user_exists_by_username(self, username: str) -> bool:
        """Check if user exists with given username."""
        stmt = select(UserModel.id).where(UserModel.username == username)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None
    
    async def get_active_users(self, limit: Optional[int] = None) -> List[User]:
        """Get list of active users."""
        stmt = select(UserModel).where(UserModel.is_active == True)
        
        if limit:
            stmt = stmt.limit(limit)
        
        result = await self.session.execute(stmt)
        user_models = result.scalars().all()
        
        return [self._model_to_user(model) for model in user_models]
    
    def _user_to_model(self, user: User) -> UserModel:
        """Convert User entity to UserModel."""
        return UserModel(
            id=user.id,
            email=user.email,
            username=user.username,
            provider=user.provider.value,
            provider_id=user.provider_id,
            password_hash=user.password_hash,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
    
    def _model_to_user(self, model: UserModel) -> User:
        """Convert UserModel to User entity."""
        return User(
            id=str(model.id),
            email=model.email,
            username=model.username,
            provider=AuthProvider(model.provider),
            provider_id=model.provider_id,
            password_hash=model.password_hash,
            avatar_url=model.avatar_url,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at
        )