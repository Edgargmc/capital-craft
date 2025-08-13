"""
Authentication Dependencies for FastAPI
Provides JWT token validation and user extraction
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

from app.infrastructure.auth.jwt_manager import jwt_manager, TokenPayload
from app.core.entities.user import User


# Security scheme for Bearer token
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TokenPayload:
    """
    Extract and validate current user from JWT token
    
    Args:
        credentials: Bearer token from Authorization header
        
    Returns:
        TokenPayload: Validated user information from token
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        # Extract token from Bearer scheme
        token = credentials.credentials
        
        # Validate and decode token using correct method name
        payload = jwt_manager.verify_token(token, expected_type="access")
        
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return payload
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_id(
    current_user: TokenPayload = Depends(get_current_user)
) -> str:
    """
    Extract user_id from validated JWT token
    
    Args:
        current_user: Validated token payload
        
    Returns:
        str: User ID from token
    """
    return current_user.user_id


# Optional: For endpoints that can work with or without auth
async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[TokenPayload]:
    """
    Extract user from JWT token if provided, None if not authenticated
    
    Args:
        credentials: Optional Bearer token
        
    Returns:
        Optional[TokenPayload]: User info if authenticated, None otherwise
    """
    if not credentials:
        return None
        
    try:
        token = credentials.credentials
        payload = jwt_manager.verify_token(token, expected_type="access")
        
        if payload:
            return payload
            
    except Exception:
        # Silently fail for optional auth
        pass
        
    return None
