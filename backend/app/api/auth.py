"""
Authentication API Endpoints
FastAPI endpoints for user authentication and OAuth
"""
import secrets
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr

from app.use_cases.create_user import CreateUserUseCase
from app.use_cases.authenticate_user import AuthenticateUserUseCase
from app.infrastructure.auth.jwt_manager import jwt_manager, TokenPair
from app.infrastructure.auth.google_oauth import google_oauth_client, GoogleUserInfo
from app.core.entities.user import AuthProvider
from app.infrastructure.dependency_injection import (
    get_create_user_use_case, 
    get_authenticate_user_use_case,
    get_generate_notification_use_case
)
from app.use_cases.generate_notification import GenerateNotificationUseCase
from app.core.entities.notification import NotificationTriggerType


# Pydantic models for API
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str = "Bearer"
    user: dict


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    provider: str
    avatar_url: Optional[str] = None
    is_active: bool


# Router instance
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


@auth_router.post("/register", response_model=TokenResponse)
async def register(
    request: RegisterRequest,
    create_user_use_case: CreateUserUseCase = Depends(get_create_user_use_case),
    notification_service: GenerateNotificationUseCase = Depends(get_generate_notification_use_case)
):
    """
    Register new user with email and password.
    """
    try:
        # Simple password hashing (in production, use proper bcrypt)
        import hashlib
        password_hash = hashlib.sha256(request.password.encode()).hexdigest()
        
        # Create user
        user = await create_user_use_case.execute_local_user(
            email=request.email,
            username=request.username,
            password_hash=password_hash
        )
        
        # Create token pair
        token_pair = jwt_manager.create_token_pair(
            user_id=user.id,
            email=user.email,
            username=user.username,
            provider=user.provider.value
        )
        
        # 🎉 NEW: Generate welcome notification for new user
        try:
            welcome_notification = await notification_service.execute(
                user_id=user.id,
                trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
                trigger_data={
                    "topic": "Welcome to Capital Craft!",
                    "topic_description": "Get started with your investment journey",
                    "relevance_score": 1.0,
                    "content_slug": "investment_fundamentals",
                    "event_type": "user_registration",
                    "is_first_time_user": True
                }
            )
            print(f"🔔 Welcome notification generated for new user: {user.id}")
        except Exception as e:
            print(f"⚠️  Failed to generate welcome notification: {e}")
            # Don't fail registration if notification fails
        
        return TokenResponse(
            access_token=token_pair.access_token,
            refresh_token=token_pair.refresh_token,
            expires_in=token_pair.expires_in,
            token_type=token_pair.token_type,
            user={
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "provider": user.provider.value,
                "avatar_url": user.avatar_url,
                "is_active": user.is_active
            }
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@auth_router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    auth_use_case: AuthenticateUserUseCase = Depends(get_authenticate_user_use_case),
    notification_service: GenerateNotificationUseCase = Depends(get_generate_notification_use_case)
):
    """
    Login user with email and password.
    """
    try:
        # Simple password hashing (in production, use proper bcrypt)
        import hashlib
        password_hash = hashlib.sha256(request.password.encode()).hexdigest()
        
        # Authenticate user
        user = await auth_use_case.authenticate_local_user(
            email=request.email,
            password_hash=password_hash
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create token pair
        token_pair = jwt_manager.create_token_pair(
            user_id=user.id,
            email=user.email,
            username=user.username,
            provider=user.provider.value
        )
        
        # 🚀 NEW: Generate login notification for returning user (lightweight)
        try:
            # Only generate login notification if it's been a while (avoid spam)
            from datetime import datetime
            login_notification = await notification_service.execute(
                user_id=user.id,
                trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
                trigger_data={
                    "topic": "Welcome back!",
                    "topic_description": "Check your portfolio performance",
                    "relevance_score": 0.7,
                    "content_slug": "portfolio_review",
                    "event_type": "user_login",
                    "login_timestamp": datetime.now().isoformat()
                }
            )
            if login_notification:
                print(f"🔔 Login notification generated for user: {user.id}")
        except Exception as e:
            print(f"⚠️  Failed to generate login notification: {e}")
            # Don't fail login if notification fails
        
        return TokenResponse(
            access_token=token_pair.access_token,
            refresh_token=token_pair.refresh_token,
            expires_in=token_pair.expires_in,
            token_type=token_pair.token_type,
            user={
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "provider": user.provider.value,
                "avatar_url": user.avatar_url,
                "is_active": user.is_active
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )


@auth_router.post("/refresh", response_model=dict)
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh access token using refresh token.
    """
    new_access_token = jwt_manager.refresh_access_token(request.refresh_token)
    
    if not new_access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    return {
        "access_token": new_access_token,
        "token_type": "Bearer"
    }


@auth_router.get("/google")
async def google_login(request: Request):
    """
    Initiate Google OAuth login.
    """
    if not google_oauth_client.is_configured():
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured"
        )
    
    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)
    
    # Store state in session (in production, use proper session storage)
    # For now, we'll use a simple approach
    
    # Get authorization URL
    auth_url = google_oauth_client.get_authorization_url(state=state)
    
    return {"auth_url": auth_url, "state": state}


@auth_router.get("/google/callback")
async def google_callback(
    code: str,
    state: Optional[str] = None,
    create_user_use_case: CreateUserUseCase = Depends(get_create_user_use_case),
    notification_service: GenerateNotificationUseCase = Depends(get_generate_notification_use_case)
):
    """
    Handle Google OAuth callback.
    """
    try:
        # Exchange code for tokens
        token_response = await google_oauth_client.exchange_code_for_tokens(code)
        if not token_response:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange code for tokens"
            )
        
        # Get user info
        user_info = await google_oauth_client.get_user_info(token_response["access_token"])
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user information"
            )
        
        # Create or get user
        user, was_created = await create_user_use_case.get_or_create_oauth_user(
            email=user_info.email,
            username=user_info.name.replace(" ", "_").lower(),
            provider=AuthProvider.GOOGLE,
            provider_id=user_info.id,
            avatar_url=user_info.picture
        )
        
        # Create token pair
        token_pair = jwt_manager.create_token_pair(
            user_id=user.id,
            email=user.email,
            username=user.username,
            provider=user.provider.value
        )
        
        # 🎯 NEW: Generate OAuth-specific notification
        try:
            if was_created:
                # New Google user - welcome notification
                oauth_notification = await notification_service.execute(
                    user_id=user.id,
                    trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
                    trigger_data={
                        "topic": "Welcome to Capital Craft!",
                        "topic_description": "You've successfully signed up with Google",
                        "relevance_score": 1.0,
                        "content_slug": "investment_fundamentals",
                        "event_type": "oauth_registration",
                        "provider": "google",
                        "is_first_time_user": True
                    }
                )
                print(f"🔔 OAuth welcome notification generated for new user: {user.id}")
            else:
                # Returning Google user
                oauth_notification = await notification_service.execute(
                    user_id=user.id,
                    trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
                    trigger_data={
                        "topic": "Welcome back!",
                        "topic_description": "Signed in with Google successfully",
                        "relevance_score": 0.6,
                        "content_slug": "portfolio_review",
                        "event_type": "oauth_login",
                        "provider": "google"
                    }
                )
                print(f"🔔 OAuth login notification generated for user: {user.id}")
        except Exception as e:
            print(f"⚠️  Failed to generate OAuth notification: {e}")
        
        # In production, redirect to frontend with tokens
        # For now, return JSON response
        return {
            "access_token": token_pair.access_token,
            "refresh_token": token_pair.refresh_token,
            "expires_in": token_pair.expires_in,
            "token_type": token_pair.token_type,
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "provider": user.provider.value,
                "avatar_url": user.avatar_url,
                "is_active": user.is_active
            },
            "was_created": was_created
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth callback failed: {str(e)}"
        )


@auth_router.post("/logout")
async def logout():
    """
    Logout user (client-side token removal).
    """
    # In a stateless JWT system, logout is handled client-side
    # In production, you might want to maintain a token blacklist
    return {"message": "Logged out successfully"}


# Dependency for extracting current user ID from JWT token
async def get_current_user_id(request: Request) -> str:
    """
    Extract current user ID from JWT token.
    """
    authorization = request.headers.get("Authorization")
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    
    token = authorization.split(" ")[1]
    payload = jwt_manager.verify_token(token, "access")
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return payload.user_id


@auth_router.get("/me", response_model=UserResponse)
async def get_current_user(
    auth_use_case: AuthenticateUserUseCase = Depends(get_authenticate_user_use_case),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get current authenticated user information.
    """
    user = await auth_use_case.get_user_by_id(current_user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        provider=user.provider.value,
        avatar_url=user.avatar_url,
        is_active=user.is_active
    )