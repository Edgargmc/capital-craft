"""
Integration Tests for User Repository
Testing database interactions with test database
"""
import pytest
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import text
from app.core.entities.user import User, AuthProvider, create_local_user, create_oauth_user
from app.infrastructure.repositories.postgres_user_repository import PostgresUserRepository
from app.infrastructure.database.models import UserModel
from app.infrastructure.database.config import Base


class TestPostgresUserRepository:
    """Test PostgreSQL User Repository with real database operations"""
    
    @pytest.fixture(scope="function")
    async def test_engine(self):
        """Create test database engine"""
        # Use test database URL
        test_db_url = "postgresql+asyncpg://capital_craft_user:capital_craft_pass@localhost:5434/capital_craft_test"
        
        engine = create_async_engine(
            test_db_url,
            echo=False,  # Set to True for SQL debugging
            pool_size=5,
            max_overflow=0
        )
        
        # Create test database tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        yield engine
        
        # Cleanup
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        
        await engine.dispose()
    
    @pytest.fixture
    async def session(self, test_engine):
        """Create test database session"""
        async_session = async_sessionmaker(
            test_engine, class_=AsyncSession, expire_on_commit=False
        )
        
        async with async_session() as session:
            # Clean up any existing test data
            await session.execute(text("DELETE FROM users WHERE email LIKE '%test%'"))
            await session.commit()
            
            yield session
            
            # Rollback any changes made during test
            await session.rollback()
    
    @pytest.fixture
    def repository(self, session):
        """Create repository instance with test session"""
        return PostgresUserRepository(session)
    
    @pytest.mark.asyncio
    async def test_create_local_user_success(self, repository):
        """Test creating a local user successfully"""
        user = create_local_user(
            email="create_test@example.com",
            username="createtestuser",
            password_hash="hashed_password_123"
        )
        
        created_user = await repository.create_user(user)
        
        assert created_user.id is not None
        assert created_user.email == "create_test@example.com"
        assert created_user.username == "createtestuser"
        assert created_user.provider == AuthProvider.LOCAL
        assert created_user.password_hash == "hashed_password_123"
        assert created_user.is_active is True
        assert created_user.created_at is not None
        assert created_user.updated_at is not None
    
    @pytest.mark.asyncio
    async def test_create_oauth_user_success(self, repository):
        """Test creating an OAuth user successfully"""
        user = create_oauth_user(
            email="oauth_test@example.com",
            username="oauthtestuser",
            provider=AuthProvider.GOOGLE,
            provider_id="google_test_123",
            avatar_url="https://example.com/avatar.jpg"
        )
        
        created_user = await repository.create_user(user)
        
        assert created_user.id is not None
        assert created_user.email == "oauth_test@example.com"
        assert created_user.provider == AuthProvider.GOOGLE
        assert created_user.provider_id == "google_test_123"
        assert created_user.avatar_url == "https://example.com/avatar.jpg"
        assert created_user.password_hash is None
    
    @pytest.mark.asyncio
    async def test_create_user_duplicate_email(self, repository):
        """Test creating user with duplicate email fails"""
        user1 = create_local_user(
            email="duplicate@example.com",
            username="user1",
            password_hash="hash1"
        )
        
        user2 = create_local_user(
            email="duplicate@example.com",
            username="user2",
            password_hash="hash2"
        )
        
        # First user should succeed
        await repository.create_user(user1)
        
        # Second user with same email should fail
        with pytest.raises(ValueError, match="User already exists with email"):
            await repository.create_user(user2)
    
    @pytest.mark.asyncio
    async def test_create_user_duplicate_username(self, repository):
        """Test creating user with duplicate username fails"""
        user1 = create_local_user(
            email="email1@example.com",
            username="duplicateuser",
            password_hash="hash1"
        )
        
        user2 = create_local_user(
            email="email2@example.com",
            username="duplicateuser",
            password_hash="hash2"
        )
        
        # First user should succeed
        await repository.create_user(user1)
        
        # Second user with same username should fail
        with pytest.raises(ValueError, match="User already exists with username"):
            await repository.create_user(user2)
    
    @pytest.mark.asyncio
    async def test_get_user_by_id_success(self, repository):
        """Test retrieving user by ID successfully"""
        user = create_local_user(
            email="getbyid@example.com",
            username="getbyiduser",
            password_hash="hash123"
        )
        
        created_user = await repository.create_user(user)
        retrieved_user = await repository.get_user_by_id(created_user.id)
        
        assert retrieved_user is not None
        assert retrieved_user.id == created_user.id
        assert retrieved_user.email == "getbyid@example.com"
    
    @pytest.mark.asyncio
    async def test_get_user_by_id_not_found(self, repository):
        """Test retrieving non-existent user by ID returns None"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        user = await repository.get_user_by_id(fake_id)
        assert user is None
    
    @pytest.mark.asyncio
    async def test_get_user_by_email_success(self, repository):
        """Test retrieving user by email successfully"""
        user = create_local_user(
            email="getbyemail@example.com",
            username="getbyemailuser",
            password_hash="hash123"
        )
        
        await repository.create_user(user)
        retrieved_user = await repository.get_user_by_email("getbyemail@example.com")
        
        assert retrieved_user is not None
        assert retrieved_user.email == "getbyemail@example.com"
    
    @pytest.mark.asyncio
    async def test_get_user_by_email_not_found(self, repository):
        """Test retrieving non-existent user by email returns None"""
        user = await repository.get_user_by_email("nonexistent@example.com")
        assert user is None
    
    @pytest.mark.asyncio
    async def test_get_user_by_username_success(self, repository):
        """Test retrieving user by username successfully"""
        user = create_local_user(
            email="getbyusername@example.com",
            username="getbyusernameuser",
            password_hash="hash123"
        )
        
        await repository.create_user(user)
        retrieved_user = await repository.get_user_by_username("getbyusernameuser")
        
        assert retrieved_user is not None
        assert retrieved_user.username == "getbyusernameuser"
    
    @pytest.mark.asyncio
    async def test_get_user_by_provider_success(self, repository):
        """Test retrieving user by OAuth provider successfully"""
        user = create_oauth_user(
            email="getbyprovider@example.com",
            username="getbyprovideruser",
            provider=AuthProvider.GOOGLE,
            provider_id="google_provider_123"
        )
        
        await repository.create_user(user)
        retrieved_user = await repository.get_user_by_provider(
            AuthProvider.GOOGLE, "google_provider_123"
        )
        
        assert retrieved_user is not None
        assert retrieved_user.provider == AuthProvider.GOOGLE
        assert retrieved_user.provider_id == "google_provider_123"
    
    @pytest.mark.asyncio
    async def test_update_user_success(self, repository):
        """Test updating user successfully"""
        user = create_local_user(
            email="update@example.com",
            username="updateuser",
            password_hash="hash123"
        )
        
        created_user = await repository.create_user(user)
        
        # Update user data
        created_user.username = "updatedusername"
        created_user.avatar_url = "https://example.com/new-avatar.jpg"
        
        updated_user = await repository.update_user(created_user)
        
        assert updated_user.username == "updatedusername"
        assert updated_user.avatar_url == "https://example.com/new-avatar.jpg"
        assert updated_user.updated_at > created_user.created_at
    
    @pytest.mark.asyncio
    async def test_update_user_not_found(self, repository):
        """Test updating non-existent user fails"""
        user = create_local_user(
            email="nonexistent@example.com",
            username="nonexistentuser",
            password_hash="hash123"
        )
        user.id = "00000000-0000-0000-0000-000000000000"
        
        with pytest.raises(ValueError, match="User not found"):
            await repository.update_user(user)
    
    @pytest.mark.asyncio
    async def test_delete_user_success(self, repository):
        """Test deleting user successfully"""
        user = create_local_user(
            email="delete@example.com",
            username="deleteuser",
            password_hash="hash123"
        )
        
        created_user = await repository.create_user(user)
        success = await repository.delete_user(created_user.id)
        
        assert success is True
        
        # Verify user is actually deleted
        deleted_user = await repository.get_user_by_id(created_user.id)
        assert deleted_user is None
    
    @pytest.mark.asyncio
    async def test_delete_user_not_found(self, repository):
        """Test deleting non-existent user returns False"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        success = await repository.delete_user(fake_id)
        assert success is False
    
    @pytest.mark.asyncio
    async def test_user_exists_by_email(self, repository):
        """Test checking user existence by email"""
        user = create_local_user(
            email="exists@example.com",
            username="existsuser",
            password_hash="hash123"
        )
        
        # User should not exist initially
        exists_before = await repository.user_exists_by_email("exists@example.com")
        assert exists_before is False
        
        # Create user
        await repository.create_user(user)
        
        # User should exist now
        exists_after = await repository.user_exists_by_email("exists@example.com")
        assert exists_after is True
    
    @pytest.mark.asyncio
    async def test_user_exists_by_username(self, repository):
        """Test checking user existence by username"""
        user = create_local_user(
            email="usernameexists@example.com",
            username="usernameexistsuser",
            password_hash="hash123"
        )
        
        # User should not exist initially
        exists_before = await repository.user_exists_by_username("usernameexistsuser")
        assert exists_before is False
        
        # Create user
        await repository.create_user(user)
        
        # User should exist now
        exists_after = await repository.user_exists_by_username("usernameexistsuser")
        assert exists_after is True
    
    @pytest.mark.asyncio
    async def test_get_active_users(self, repository):
        """Test retrieving active users"""
        # Create active user
        active_user = create_local_user(
            email="active@example.com",
            username="activeuser",
            password_hash="hash123"
        )
        created_active = await repository.create_user(active_user)
        
        # Create inactive user
        inactive_user = create_local_user(
            email="inactive@example.com",
            username="inactiveuser",
            password_hash="hash123"
        )
        created_inactive = await repository.create_user(inactive_user)
        
        # Deactivate the second user
        created_inactive.deactivate()
        await repository.update_user(created_inactive)
        
        # Get active users
        active_users = await repository.get_active_users()
        
        # Should only contain active user
        active_emails = [u.email for u in active_users]
        assert "active@example.com" in active_emails
        assert "inactive@example.com" not in active_emails
    
    @pytest.mark.asyncio
    async def test_get_active_users_with_limit(self, repository):
        """Test retrieving active users with limit"""
        # Create multiple users
        for i in range(5):
            user = create_local_user(
                email=f"limit{i}@example.com",
                username=f"limituser{i}",
                password_hash="hash123"
            )
            await repository.create_user(user)
        
        # Get limited active users
        active_users = await repository.get_active_users(limit=3)
        
        assert len(active_users) <= 3