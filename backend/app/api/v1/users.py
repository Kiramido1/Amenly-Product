from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_active_user, require_org_admin
from app.auth.permissions import require_permission
from app.auth.schemas import GenericResponse
from app.auth.service import AuthService
from app.database.session import get_db
from app.models.enums import Permission, UserRole
from app.models.identity import User
from app.schemas.identity import MemberCreate, UserResponse, UserSelfUpdate, UserUpdate

router = APIRouter()


@router.get(
    "/",
    response_model=GenericResponse,
    dependencies=[Depends(require_permission(Permission.VIEW_MEMBERS))],
)
async def get_users(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get users list (Admin only).
    """
    auth_service = AuthService(db)
    users, total = await auth_service.get_users_list(
        skip=skip, limit=limit, org_id=current_user.organization_id
    )

    return {
        "success": True,
        "message": "Users retrieved successfully",
        "data": {
            "users": [UserResponse.model_validate(u) for u in users],
            "total": total,
            "skip": skip,
            "limit": limit,
        },
    }


@router.post(
    "/",
    response_model=GenericResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a member to your organization (Admin only)",
)
async def create_member(
    member_in: MemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
) -> Any:
    """Create a new user inside the current admin's organization."""
    auth_service = AuthService(db)
    user = await auth_service.create_member(current_user.organization_id, member_in)
    return {
        "success": True,
        "message": "Member created successfully",
        "data": {"user": UserResponse.model_validate(user)},
    }


@router.patch("/me", response_model=GenericResponse, summary="Update my own profile")
async def update_my_profile(
    update_in: UserSelfUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Update the authenticated user's own profile (name/email)."""
    auth_service = AuthService(db)
    user = await auth_service.repo.get_user_by_id(current_user.id)
    update_data = update_in.model_dump(exclude_unset=True)
    if "email" in update_data and update_data["email"] != user.email:
        if await auth_service.repo.get_user_by_email(update_data["email"]):
            raise HTTPException(status_code=400, detail="Email already in use")
    for field, value in update_data.items():
        setattr(user, field, value)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {
        "success": True,
        "message": "Profile updated successfully",
        "data": {"user": UserResponse.model_validate(user)},
    }


@router.get(
    "/{user_id}",
    response_model=GenericResponse,
    dependencies=[Depends(require_permission(Permission.VIEW_MEMBERS))],
)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get single user details.
    """
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Security check: only allow if same org
    if user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this user")

    return {
        "success": True,
        "message": "User retrieved successfully",
        "data": {"user": UserResponse.model_validate(user)},
    }


@router.patch("/{user_id}", response_model=GenericResponse)
async def update_user(
    user_id: UUID,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
) -> Any:
    """
    Update user (Admin only).
    """
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")

    # Update logic
    update_data = user_in.model_dump(exclude_unset=True)

    # M-5: deactivating the last admin is equivalent to demoting them — block it.
    if update_data.get("is_active") is False and user.role == UserRole.ORG_ADMIN:
        from sqlalchemy import func, select

        active_admins = await db.execute(
            select(func.count())
            .select_from(User)
            .where(
                User.organization_id == user.organization_id,
                User.role == UserRole.ORG_ADMIN,
                User.is_active == True,
            )
        )
        if active_admins.scalar() <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot deactivate the last admin of the organization",
            )

    # Logical Check: Prevent demoting the last admin
    if (
        "role" in update_data
        and user.role == UserRole.ORG_ADMIN
        and update_data["role"] != UserRole.ORG_ADMIN
    ):
        # Check how many admins are left in the org
        from sqlalchemy import func, select

        admin_count_query = (
            select(func.count())
            .select_from(User)
            .where(
                User.organization_id == user.organization_id,
                User.role == UserRole.ORG_ADMIN,
                User.is_active == True,
            )
        )
        admin_count_result = await db.execute(admin_count_query)
        if admin_count_result.scalar() <= 1:
            raise HTTPException(
                status_code=400, detail="Cannot demote the last admin of the organization"
            )

    for field, value in update_data.items():
        setattr(user, field, value)

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {
        "success": True,
        "message": "User updated successfully",
        "data": {"user": UserResponse.model_validate(user)},
    }


@router.delete("/{user_id}", response_model=GenericResponse)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
) -> Any:
    """
    Delete user (Admin only - soft delete).
    """
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this user")

    # M-6: guard against self-deletion and removing the last active admin.
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")

    if user.role == UserRole.ORG_ADMIN:
        from sqlalchemy import func, select

        active_admins = await db.execute(
            select(func.count())
            .select_from(User)
            .where(
                User.organization_id == user.organization_id,
                User.role == UserRole.ORG_ADMIN,
                User.is_active == True,
            )
        )
        if active_admins.scalar() <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete the last admin of the organization",
            )

    await auth_service.repo.delete_user(user)

    return {"success": True, "message": "User deleted successfully"}
