from typing import Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.organizations.service import OrganizationService
from app.auth.dependencies import get_current_active_user, require_org_admin
from app.schemas.identity import (
    OrganizationResponse,
    OrganizationUpdate,
    OrganizationDetailResponse,
    DepartmentResponse,
    DepartmentCreate,
    PositionResponse,
    PositionCreate,
)
from app.auth.schemas import GenericResponse
from app.models.identity import User

router = APIRouter()


@router.get("/me", response_model=GenericResponse)
async def get_my_organization(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get current user's organization details including departments and positions.
    """
    org_service = OrganizationService(db)
    org = await org_service.get_organization_details(current_user.organization_id)
    return {
        "success": True,
        "message": "Organization details retrieved",
        "data": {"organization": OrganizationDetailResponse.model_validate(org)},
    }


@router.patch("/me", response_model=GenericResponse)
async def update_my_organization(
    org_in: OrganizationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
) -> Any:
    """
    Update organization settings (Admin only).
    """
    org_service = OrganizationService(db)
    org = await org_service.update_organization(current_user.organization_id, org_in)
    return {
        "success": True,
        "message": "Organization updated successfully",
        "data": {"organization": OrganizationResponse.model_validate(org)},
    }


# --- Department Endpoints ---


@router.post(
    "/departments", response_model=GenericResponse, status_code=status.HTTP_201_CREATED
)
async def create_department(
    dept_in: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
) -> Any:
    """
    Create a new department in the organization (Admin only).
    """
    org_service = OrganizationService(db)
    dept = await org_service.create_new_department(
        current_user.organization_id, dept_in
    )
    return {
        "success": True,
        "message": "Department created successfully",
        "data": {"department": DepartmentResponse.model_validate(dept)},
    }


@router.get("/departments", response_model=GenericResponse)
async def list_departments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    List all departments in the current organization.
    """
    org_service = OrganizationService(db)
    depts = await org_service.list_departments(current_user.organization_id)
    return {
        "success": True,
        "message": "Departments retrieved",
        "data": {"departments": [DepartmentResponse.model_validate(d) for d in depts]},
    }


# --- Position Endpoints ---


@router.post(
    "/positions", response_model=GenericResponse, status_code=status.HTTP_201_CREATED
)
async def create_position(
    pos_in: PositionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
) -> Any:
    """
    Create a new position within a department (Admin only).
    """
    org_service = OrganizationService(db)
    pos = await org_service.create_new_position(current_user.organization_id, pos_in)
    return {
        "success": True,
        "message": "Position created successfully",
        "data": {"position": PositionResponse.model_validate(pos)},
    }


@router.get("/departments/{dept_id}/positions", response_model=GenericResponse)
async def list_positions(
    dept_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    List all positions within a specific department.
    """
    org_service = OrganizationService(db)
    positions = await org_service.list_positions(dept_id, current_user.organization_id)
    return {
        "success": True,
        "message": "Positions retrieved",
        "data": {"positions": [PositionResponse.model_validate(p) for p in positions]},
    }


@router.delete("/departments/{dept_id}", response_model=GenericResponse)
async def delete_department(
    dept_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
) -> Any:
    """
    Delete a department (Admin only).
    """
    org_service = OrganizationService(db)
    await org_service.delete_dept(dept_id, current_user.organization_id)
    return {"success": True, "message": "Department deleted successfully"}


@router.delete("/positions/{pos_id}", response_model=GenericResponse)
async def delete_position(
    pos_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
) -> Any:
    """
    Delete a position (Admin only).
    """
    org_service = OrganizationService(db)
    await org_service.delete_pos(pos_id, current_user.organization_id)
    return {"success": True, "message": "Position deleted successfully"}
