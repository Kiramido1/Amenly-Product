"""
Permissions API Router
Manage user permissions and role-based access control
"""
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_active_user
from app.auth.permissions import check_user_permission, get_user_permissions, require_permission
from app.auth.schemas import GenericResponse
from app.database.session import get_db
from app.models.enums import Permission
from app.models.identity import User
from app.models.permissions import ROLE_PERMISSIONS, UserRolePermission, get_role_permissions
from app.schemas.permissions import (
    GrantPermissionRequest,
    RevokePermissionRequest,
    get_permission_info,
)

router = APIRouter()


@router.get(
    "/me",
    response_model=GenericResponse,
    summary="Get my permissions",
    description="Get current user's permissions (role-based + custom)"
)
async def get_my_permissions(
    current_user: Any = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get current user's complete permissions.
    
    **Returns:**
    - Role permissions
    - Custom granted permissions
    - Combined list of all permissions
    """
    # Get role permissions
    role_perms = get_role_permissions(current_user.role)
    role_perm_values = [perm.value for perm in role_perms]

    # Get custom permissions
    all_perms_list = await get_user_permissions(current_user, db)

    return {
        "success": True,
        "message": "Permissions retrieved successfully",
        "data": {
            "user_id": current_user.id,
            "role": current_user.role,
            "role_permissions": role_perm_values,
            "custom_permissions": [p for p in all_perms_list if p not in role_perm_values],
            "all_permissions": all_perms_list
        }
    }


@router.get(
    "/catalog",
    response_model=GenericResponse,
    summary="Get permissions catalog",
    description="Get list of all available permissions with descriptions"
)
async def get_permissions_catalog(
    current_user: Any = Depends(get_current_active_user)
) -> Any:
    """
    Get catalog of all available permissions.
    
    **Returns:**
    - List of all permissions with labels, descriptions, and categories
    """
    permissions = []
    for perm in Permission:
        permissions.append(get_permission_info(perm))

    # Group by category
    by_category = {}
    for perm_info in permissions:
        category = perm_info.category
        if category not in by_category:
            by_category[category] = []
        by_category[category].append(perm_info.model_dump())

    return {
        "success": True,
        "message": "Permissions catalog retrieved successfully",
        "data": {
            "permissions": [p.model_dump() for p in permissions],
            "by_category": by_category,
            "total": len(permissions)
        }
    }


@router.get(
    "/roles",
    response_model=GenericResponse,
    summary="Get role permissions",
    description="Get default permissions for each role"
)
async def get_role_permissions_list(
    current_user: Any = Depends(get_current_active_user)
) -> Any:
    """
    Get default permissions for each role.
    
    **Returns:**
    - Permissions for org_admin
    - Permissions for org_member
    """
    roles_data = {}
    for role, perms in ROLE_PERMISSIONS.items():
        roles_data[role] = {
            "role": role,
            "permissions": [perm.value for perm in perms],
            "count": len(perms)
        }

    return {
        "success": True,
        "message": "Role permissions retrieved successfully",
        "data": {"roles": roles_data}
    }


@router.get(
    "/user/{user_id}",
    response_model=GenericResponse,
    summary="Get user permissions",
    description="Get permissions for a specific user (Admin only)",
    dependencies=[Depends(require_permission(Permission.VIEW_MEMBERS))]
)
async def get_user_permissions_by_id(
    user_id: UUID,
    current_user: Any = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get permissions for a specific user.
    
    **Parameters:**
    - `user_id`: UUID of the user
    
    **Returns:**
    - User's role permissions
    - User's custom permissions
    - Combined permissions
    
    **Permissions:** Requires VIEW_MEMBERS permission
    """
    # Check if user exists and is in same organization
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.organization_id == current_user.organization_id
        )
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in your organization"
        )

    # Get role permissions
    role_perms = get_role_permissions(user.role)
    role_perm_values = [perm.value for perm in role_perms]

    # Get custom permissions
    all_perms_list = await get_user_permissions(user, db)

    return {
        "success": True,
        "message": "User permissions retrieved successfully",
        "data": {
            "user_id": user.id,
            "user_email": user.email,
            "user_name": user.full_name,
            "role": user.role,
            "role_permissions": role_perm_values,
            "custom_permissions": [p for p in all_perms_list if p not in role_perm_values],
            "all_permissions": all_perms_list
        }
    }


@router.post(
    "/grant",
    response_model=GenericResponse,
    summary="Grant permissions to user",
    description="Grant additional permissions to a user (Admin only)",
    dependencies=[Depends(require_permission(Permission.GRANT_PERMISSIONS))]
)
async def grant_permissions(
    request: GrantPermissionRequest,
    current_user: Any = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Grant additional permissions to a user.
    
    **Request Body:**
    ```json
    {
      "user_id": "uuid",
      "permissions": ["view_dashboard", "view_assets"],
      "notes": "Granted for project work",
      "expires_at": "2026-12-31T23:59:59"  // Optional
    }
    ```
    
    **Common Use Cases:**
    - Grant dashboard access to org_member
    - Grant temporary elevated permissions
    - Grant specific feature access
    
    **Permissions:** Requires GRANT_PERMISSIONS permission (Admin only)
    """
    # Check if target user exists and is in same organization
    result = await db.execute(
        select(User).where(
            User.id == request.user_id,
            User.organization_id == current_user.organization_id
        )
    )
    target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in your organization"
        )

    # Get or create user permissions record
    result = await db.execute(
        select(UserRolePermission).where(
            UserRolePermission.user_id == request.user_id
        )
    )
    user_perm = result.scalar_one_or_none()

    if user_perm:
        # Update existing permissions
        existing_perms = set(user_perm.permissions or [])
        new_perms = set(perm.value for perm in request.permissions)
        combined_perms = list(existing_perms | new_perms)

        user_perm.permissions = combined_perms
        user_perm.granted_by_id = current_user.id
        user_perm.is_active = True
        if request.expires_at:
            user_perm.expires_at = request.expires_at
        if request.notes:
            user_perm.notes = request.notes
    else:
        # Create new permissions record
        user_perm = UserRolePermission(
            user_id=request.user_id,
            permissions=[perm.value for perm in request.permissions],
            granted_by_id=current_user.id,
            expires_at=request.expires_at,
            notes=request.notes,
            is_active=True
        )
        db.add(user_perm)

    await db.commit()
    await db.refresh(user_perm)

    return {
        "success": True,
        "message": f"Granted {len(request.permissions)} permissions to user",
        "data": {
            "user_id": request.user_id,
            "granted_permissions": [perm.value for perm in request.permissions],
            "total_custom_permissions": len(user_perm.permissions)
        }
    }


@router.post(
    "/revoke",
    response_model=GenericResponse,
    summary="Revoke permissions from user",
    description="Revoke custom permissions from a user (Admin only)",
    dependencies=[Depends(require_permission(Permission.GRANT_PERMISSIONS))]
)
async def revoke_permissions(
    request: RevokePermissionRequest,
    current_user: Any = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Revoke custom permissions from a user.
    
    **Request Body:**
    ```json
    {
      "user_id": "uuid",
      "permissions": ["view_dashboard", "view_assets"]
    }
    ```
    
    **Note:** This only revokes custom permissions, not role-based permissions.
    
    **Permissions:** Requires GRANT_PERMISSIONS permission (Admin only)
    """
    # Check if target user exists and is in same organization
    result = await db.execute(
        select(User).where(
            User.id == request.user_id,
            User.organization_id == current_user.organization_id
        )
    )
    target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in your organization"
        )

    # Get user permissions record
    result = await db.execute(
        select(UserRolePermission).where(
            UserRolePermission.user_id == request.user_id
        )
    )
    user_perm = result.scalar_one_or_none()

    if not user_perm or not user_perm.permissions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User has no custom permissions to revoke"
        )

    # Remove specified permissions
    existing_perms = set(user_perm.permissions)
    perms_to_revoke = set(perm.value for perm in request.permissions)
    remaining_perms = list(existing_perms - perms_to_revoke)

    if not remaining_perms:
        # No permissions left, delete the record
        await db.delete(user_perm)
    else:
        # Update with remaining permissions
        user_perm.permissions = remaining_perms

    await db.commit()

    return {
        "success": True,
        "message": f"Revoked {len(request.permissions)} permissions from user",
        "data": {
            "user_id": request.user_id,
            "revoked_permissions": [perm.value for perm in request.permissions],
            "remaining_custom_permissions": len(remaining_perms)
        }
    }


@router.delete(
    "/user/{user_id}/all",
    response_model=GenericResponse,
    summary="Revoke all custom permissions",
    description="Revoke all custom permissions from a user (Admin only)",
    dependencies=[Depends(require_permission(Permission.GRANT_PERMISSIONS))]
)
async def revoke_all_permissions(
    user_id: UUID,
    current_user: Any = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Revoke ALL custom permissions from a user.
    User will only have their role-based permissions.
    
    **Parameters:**
    - `user_id`: UUID of the user
    
    **Permissions:** Requires GRANT_PERMISSIONS permission (Admin only)
    """
    # Check if target user exists and is in same organization
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.organization_id == current_user.organization_id
        )
    )
    target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in your organization"
        )

    # Delete all custom permissions
    await db.execute(
        delete(UserRolePermission).where(
            UserRolePermission.user_id == user_id
        )
    )
    await db.commit()

    return {
        "success": True,
        "message": "All custom permissions revoked from user",
        "data": {
            "user_id": user_id,
            "user_email": target_user.email
        }
    }


@router.get(
    "/check/{permission}",
    response_model=GenericResponse,
    summary="Check if I have permission",
    description="Check if current user has a specific permission"
)
async def check_my_permission(
    permission: str,
    current_user: Any = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Check if current user has a specific permission.
    
    **Parameters:**
    - `permission`: Permission value to check (e.g., "view_dashboard")
    
    **Returns:**
    - Whether user has the permission
    - Source of permission (role or custom)
    """
    try:
        perm_enum = Permission(permission)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid permission: {permission}"
        )

    # Check permission
    has_perm = await check_user_permission(current_user, perm_enum, db)

    # Determine source
    role_perms = get_role_permissions(current_user.role)
    source = "role" if perm_enum in role_perms else "custom"

    return {
        "success": True,
        "message": "Permission check completed",
        "data": {
            "permission": permission,
            "has_permission": has_perm,
            "source": source if has_perm else None
        }
    }
