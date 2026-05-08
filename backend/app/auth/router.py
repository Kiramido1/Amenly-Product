from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database.session import get_db
from app.auth.service import AuthService
from app.auth.schemas import (
    UserRegister, UserLogin, Token, RefreshTokenRequest, GenericResponse
)
from app.auth.dependencies import get_current_active_user
from app.schemas.identity import UserResponse
from app.core.config import settings

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.post("/register", response_model=GenericResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    user_in: UserRegister,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Register a new user and organization.
    """
    auth_service = AuthService(db)
    user = await auth_service.register_user(user_in)
    tokens = auth_service.create_tokens(user.id)
    
    return {
        "success": True,
        "message": "User registered successfully",
        "data": {
            "user": UserResponse.model_validate(user),
            **tokens
        }
    }

@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(
    request: Request,
    login_in: UserLogin,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Login user and return tokens.
    """
    auth_service = AuthService(db)
    user = await auth_service.authenticate_user(login_in)
    tokens = auth_service.create_tokens(user.id)
    
    return {
        **tokens,
        "user": UserResponse.model_validate(user)
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_in: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Refresh access token using refresh token.
    """
    from jose import jwt, JWTError
    from app.auth.schemas import TokenData
    
    try:
        payload = jwt.decode(
            refresh_in.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenData(**payload)
        if token_data.type != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except (JWTError, Exception):
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(token_data.sub)
    tokens = auth_service.create_tokens(user.id)
    
    return {
        **tokens,
        "user": UserResponse.model_validate(user)
    }

@router.get("/me", response_model=GenericResponse)
async def get_me(
    current_user: Any = Depends(get_current_active_user)
) -> Any:
    """
    Get current user profile.
    """
    return {
        "success": True,
        "message": "Profile retrieved successfully",
        "data": {
            "user": UserResponse.model_validate(current_user)
        }
    }
