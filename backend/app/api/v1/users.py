from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.auth.service import AuthService
from app.auth.dependencies import require_org_admin, get_current_active_user
from app.schemas.identity import UserResponse, UserUpdate
from app.auth.schemas import GenericResponse

router = APIRouter()

@router.get("/", response_model=GenericResponse)
async def get_users(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: Any = Depends(require_org_admin)
) -> Any:
    """
    Get users list (Admin only).
    """
    auth_service = AuthService(db)
    users, total = await auth_service.get_users_list(
        skip=skip, 
        limit=limit, 
        org_id=current_user.organization_id
    )
    
    return {
        "success": True,
        "message": "Users retrieved successfully",
        "data": {
            "users": [UserResponse.model_validate(u) for u in users],
            "total": total,
            "skip": skip,
            "limit": limit
        }
    }

@router.get("/{user_id}", response_model=GenericResponse)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> Any:
    """
    Get single user details.
    """
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    
    # Security check: only allow if same org
    if user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this user")
        
    return {
        "success": True,
        "message": "User retrieved successfully",
        "data": {
            "user": UserResponse.model_validate(user)
        }
    }

@router.patch("/{user_id}", response_model=GenericResponse)
async def update_user(
    user_id: UUID,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_org_admin)
) -> Any:
    """
    Update user (Admin only).
    """
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    
    if user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")
    
    # Update logic
    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return {
        "success": True,
        "message": "User updated successfully",
        "data": {
            "user": UserResponse.model_validate(user)
        }
    }

@router.delete("/{user_id}", response_model=GenericResponse)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_org_admin)
) -> Any:
    """
    Delete user (Admin only - soft delete).
    """
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    
    if user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this user")
    
    await auth_service.repo.delete_user(user)
    
    return {
        "success": True,
        "message": "User deleted successfully"
    }
