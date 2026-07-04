from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_active_user, require_org_admin
from app.auth.schemas import GenericResponse, JoinRequestResponse
from app.auth.service import AuthService
from app.database.session import get_db
from app.models.identity import User
from app.organizations.service import OrganizationService
from app.schemas.identity import (
    DepartmentCreate,
    DepartmentResponse,
    OrganizationDetailResponse,
    OrganizationProfileUpdate,
    OrganizationResponse,
    OrganizationUpdate,
    PositionCreate,
    PositionResponse,
)

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


# --- Company Profile Endpoint (Admin) ---


@router.put("/profile", response_model=GenericResponse)
async def update_company_profile(
    profile_in: OrganizationProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
) -> Any:
    """
    Save the organization's company profile and mark onboarding complete (Admin only).

    This is the first step of the assessment: members cannot start an assessment
    until the admin completes this profile.
    """
    org_service = OrganizationService(db)
    org = await org_service.update_company_profile(current_user.organization_id, profile_in)
    return {
        "success": True,
        "message": "Company profile saved",
        "data": {"organization": OrganizationResponse.model_validate(org)},
    }


# --- Invite Code Endpoint (Admin) ---


@router.post("/invite-code/regenerate", response_model=GenericResponse)
async def regenerate_invite_code(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
) -> Any:
    """
    Generate a fresh single-use invite code for the organization (Admin only).

    The previous code is replaced. Each code can be used by exactly one person to
    request to join; once used it is consumed and a new one must be generated.
    """
    org_service = OrganizationService(db)
    code = await org_service.regenerate_invite_code(current_user.organization_id)
    return {
        "success": True,
        "message": "New invite code generated",
        "data": {"invite_code": code},
    }


# --- Join Request Endpoints (Admin) ---


@router.get("/join-requests", response_model=GenericResponse)
async def list_join_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
) -> Any:
    """
    List pending requests from people who want to join the admin's organization.
    """
    auth_service = AuthService(db)
    requests = await auth_service.list_join_requests(current_user.organization_id)
    return {
        "success": True,
        "message": "Join requests retrieved",
        "data": {
            "join_requests": [
                JoinRequestResponse.model_validate(r).model_dump(mode="json")
                for r in requests
            ]
        },
    }


@router.post("/join-requests/{request_id}/approve", response_model=GenericResponse)
async def approve_join_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
) -> Any:
    """
    Approve a pending join request — creates the member account (Admin only).
    """
    auth_service = AuthService(db)
    user = await auth_service.approve_join_request(
        request_id, current_user.organization_id, current_user
    )
    return {
        "success": True,
        "message": "Join request approved. The user can now log in.",
        "data": {"user_id": str(user.id), "email": user.email},
    }


@router.post("/join-requests/{request_id}/reject", response_model=GenericResponse)
async def reject_join_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
) -> Any:
    """
    Reject a pending join request (Admin only).
    """
    auth_service = AuthService(db)
    await auth_service.reject_join_request(
        request_id, current_user.organization_id, current_user
    )
    return {"success": True, "message": "Join request rejected", "data": None}


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
