from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_active_user
from app.auth.schemas import (
    ChangePasswordRequest,
    GenericResponse,
    JoinRequestCreate,
    RefreshTokenRequest,
    Token,
    UserLogin,
    UserRegister,
)
from app.auth.service import AuthService
from app.core.config import settings
from app.core.rate_limit import rate_limit
from app.database.session import get_db
from app.models.identity import User
from app.schemas.identity import UserResponse

router = APIRouter()


@router.post(
    "/register",
    response_model=GenericResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit("register", limit=10, window_seconds=60))],
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


@router.post(
    "/join-request",
    response_model=GenericResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit("register", limit=10, window_seconds=60))],
)
async def request_to_join(
    body: JoinRequestCreate, db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Request to join an existing organization using its invite code.

    No account is created and no token is returned — an organization admin must
    approve the request before the user can log in.
    """
    auth_service = AuthService(db)
    await auth_service.request_join(body)
    return {
        "success": True,
        "message": "Your request has been sent. You can log in once an admin approves it.",
        "data": None,
    }


@router.post(
    "/login",
    response_model=Token,
    dependencies=[Depends(rate_limit("login", limit=10, window_seconds=60))],
)
async def login(login_in: UserLogin, db: AsyncSession = Depends(get_db)) -> Any:
    """
    Login user and return tokens.
    """
    auth_service = AuthService(db)
    user = await auth_service.authenticate_user(login_in)
    tokens = await auth_service.create_tokens(user.id, revoke_old=True)

    return {**tokens, "user": UserResponse.model_validate(user)}


@router.post(
    "/refresh",
    response_model=Token,
    dependencies=[Depends(rate_limit("refresh", limit=20, window_seconds=60))],
)
async def refresh_token(
    refresh_in: RefreshTokenRequest, db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Refresh access token using refresh token.
    Old access token will be revoked.
    """
    from jose import JWTError, jwt

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

    except (JWTError, Exception):
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(token_data.sub)

    # H-6: refresh-token rotation + reuse detection. If the presented token is not the
    # current active refresh token, it is a rotated-out/stolen token being replayed —
    # revoke the whole session. Otherwise invalidate it so it cannot be reused after
    # this rotation.
    stored = await token_manager.get_active_token(token_data.sub, "refresh")
    if stored is not None and stored != refresh_in.refresh_token:
        await token_manager.revoke_user_tokens(token_data.sub)
        raise HTTPException(status_code=401, detail="Refresh token reuse detected")
    await token_manager.blacklist_token(
        refresh_in.refresh_token, settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600
    )

    # Create new tokens with revoke_old=True to atomically revoke old and store new
    tokens = await auth_service.create_tokens(user.id, revoke_old=True)

    return {**tokens, "user": UserResponse.model_validate(user)}


@router.post("/change-password", response_model=GenericResponse)
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Change the authenticated user's password (requires the current password).
    All existing tokens are revoked, so the user must log in again.
    """
    auth_service = AuthService(db)
    await auth_service.change_password(current_user, body.current_password, body.new_password)
    return {
        "success": True,
        "message": "Password changed successfully. Please log in again.",
        "data": None,
    }


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
