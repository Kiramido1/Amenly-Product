from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.auth.service import AuthService
from app.auth.schemas import (
    UserRegister,
    UserLogin,
    Token,
    RefreshTokenRequest,
    GenericResponse,
)
from app.auth.dependencies import get_current_active_user
from app.schemas.identity import UserResponse
from app.models.identity import User
from app.core.config import settings

router = APIRouter()


@router.post(
    "/register", response_model=GenericResponse, status_code=status.HTTP_201_CREATED
)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)) -> Any:
    """
    Register a new user and organization.
    """
    auth_service = AuthService(db)
    user = await auth_service.register_user(user_in)
    tokens = await auth_service.create_tokens(user.id, revoke_old=False)

    return {
        "success": True,
        "message": "User registered successfully",
        "data": {"user": UserResponse.model_validate(user), **tokens},
    }


@router.post("/login", response_model=Token)
async def login(login_in: UserLogin, db: AsyncSession = Depends(get_db)) -> Any:
    """
    Login user and return tokens.
    """
    auth_service = AuthService(db)
    user = await auth_service.authenticate_user(login_in)
    tokens = await auth_service.create_tokens(user.id, revoke_old=True)

    return {**tokens, "user": UserResponse.model_validate(user)}


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_in: RefreshTokenRequest, db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Refresh access token using refresh token.
    Old access token will be revoked.
    """
    from jose import jwt, JWTError
    from app.auth.schemas import TokenData
    from app.auth.token_manager import token_manager

    try:
        payload = jwt.decode(
            refresh_in.refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        token_data = TokenData(**payload)
        if token_data.type != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        # Check if refresh token is revoked
        is_revoked = await token_manager.is_token_revoked(refresh_in.refresh_token, token_data.sub)
        if is_revoked:
            raise HTTPException(status_code=401, detail="Refresh token has been revoked")
            
    except (JWTError, Exception) as e:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(token_data.sub)
    
    # Create new tokens with revoke_old=True to atomically revoke old and store new
    tokens = await auth_service.create_tokens(user.id, revoke_old=True)

    return {**tokens, "user": UserResponse.model_validate(user)}


@router.get("/me", response_model=GenericResponse)
async def get_me(current_user: Any = Depends(get_current_active_user)) -> Any:
    """
    Get current user profile.
    """
    return {
        "success": True,
        "message": "Profile retrieved successfully",
        "data": {"user": UserResponse.model_validate(current_user)},
    }


@router.post("/logout", response_model=GenericResponse)
async def logout(current_user: User = Depends(get_current_active_user)) -> Any:
    """
    Logout user by revoking all active tokens.
    """
    from app.auth.token_manager import token_manager
    
    # Revoke all user tokens
    await token_manager.revoke_user_tokens(current_user.id)
    
    return {
        "success": True,
        "message": "Logged out successfully",
        "data": None,
    }


@router.get("/debug/token-status", response_model=GenericResponse)
async def debug_token_status(current_user: User = Depends(get_current_active_user)) -> Any:
    """
    Debug endpoint to check token status in Redis.
    Only available in development mode.
    """
    if not settings.DEBUG:
        raise HTTPException(status_code=404, detail="Not found")
    
    from app.auth.token_manager import token_manager
    import redis.asyncio as redis
    
    redis_client = await token_manager._get_redis()
    if not redis_client:
        return {
            "success": False,
            "message": "Redis not available",
            "data": None
        }
    
    # Get all keys for this user
    access_key = f"active_token:access:{current_user.id}"
    refresh_key = f"active_token:refresh:{current_user.id}"
    
    access_token = await redis_client.get(access_key)
    refresh_token = await redis_client.get(refresh_key)
    
    # Get all blacklist keys
    blacklist_keys = []
    async for key in redis_client.scan_iter("blacklist:*"):
        blacklist_keys.append(key)
    
    return {
        "success": True,
        "message": "Token status retrieved",
        "data": {
            "user_id": str(current_user.id),
            "has_active_access_token": bool(access_token),
            "has_active_refresh_token": bool(refresh_token),
            "access_token_preview": access_token[:50] + "..." if access_token else None,
            "refresh_token_preview": refresh_token[:50] + "..." if refresh_token else None,
            "blacklisted_tokens_count": len(blacklist_keys),
            "blacklist_keys": blacklist_keys[:10]  # Show first 10
        }
    }
