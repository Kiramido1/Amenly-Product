"""
Permission checking utilities and dependencies
"""

from typing import Any

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_active_user
from app.database.session import get_db
from app.models.enums import Permission
from app.models.permissions import UserRolePermission, get_role_permissions, has_permission


async def get_user_permissions(user: Any, db: AsyncSession) -> list[str]:
    """
    Get all permissions for a user (role-based + custom permissions).
    Returns list of permission strings.
    """
    # Get role-based permissions
    role_perms = get_role_permissions(user.role)
    permissions = [perm.value for perm in role_perms]

    # Get custom permissions from database
    result = await db.execute(
        select(UserRolePermission).where(
            UserRolePermission.user_id == user.id, UserRolePermission.is_active == True
        )
    )
    custom_perm = result.scalar_one_or_none()

    if custom_perm and custom_perm.permissions:
        # custom_perm.permissions might be list[str] or list[Permission] depending on DB dialect
        # Standardize to list of strings for has_permission check
        for p in custom_perm.permissions:
            perm_val = p.value if hasattr(p, 'value') else str(p)
            if perm_val not in permissions:
                permissions.append(perm_val)

    return permissions


def require_permission(required_permission: Permission):
    """
    Dependency to check if user has a specific permission.
    Raises 403 if user doesn't have the permission.

    Usage:
        @router.get("/endpoint", dependencies=[Depends(require_permission(Permission.VIEW_DASHBOARD))])
    """

    async def permission_checker(
        user: Any = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)
    ):
        # Get user permissions
        user_perms = await get_user_permissions(user, db)

        # Check if user has the required permission
        if not has_permission(user.role, user_perms, required_permission):
            # Use 403 Forbidden for permission denied, but 401 Unauthorized for invalid/expired tokens (already handled in get_current_user)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required permission: {required_permission.value}",
            )

        return user

    return permission_checker


def require_any_permission(*required_permissions: Permission):
    """
    Dependency to check if user has ANY of the specified permissions.
    Raises 403 if user doesn't have at least one permission.

    Usage:
        @router.get("/endpoint", dependencies=[Depends(require_any_permission(
            Permission.VIEW_ALL_SESSIONS,
            Permission.VIEW_OWN_SESSIONS
        ))])
    """

    async def permission_checker(
        user: Any = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)
    ):
        # Get user permissions
        user_perms = await get_user_permissions(user, db)

        # Check if user has any of the required permissions
        has_any = any(has_permission(user.role, user_perms, perm) for perm in required_permissions)

        if not has_any:
            perm_names = [p.value for p in required_permissions]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required one of: {', '.join(perm_names)}",
            )

        return user

    return permission_checker


def require_all_permissions(*required_permissions: Permission):
    """
    Dependency to check if user has ALL of the specified permissions.
    Raises 403 if user doesn't have all permissions.

    Usage:
        @router.get("/endpoint", dependencies=[Depends(require_all_permissions(
            Permission.VIEW_DASHBOARD,
            Permission.VIEW_ASSETS
        ))])
    """

    async def permission_checker(
        user: Any = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)
    ):
        # Get user permissions
        user_perms = await get_user_permissions(user, db)

        # Check if user has all required permissions
        has_all = all(has_permission(user.role, user_perms, perm) for perm in required_permissions)

        if not has_all:
            perm_names = [p.value for p in required_permissions]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required all of: {', '.join(perm_names)}",
            )

        return user

    return permission_checker


async def check_user_permission(user: Any, permission: Permission, db: AsyncSession) -> bool:
    """
    Helper function to check if a user has a specific permission.
    Returns True/False without raising exceptions.
    """
    user_perms = await get_user_permissions(user, db)
    return has_permission(user.role, user_perms, permission)
