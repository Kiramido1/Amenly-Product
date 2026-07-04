"""
Assets Router
API endpoints for infrastructure asset management
"""
from typing import Any
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.assets.service import AssetExtractionService
from app.assets.vulnerability_service import VulnerabilityService
from app.auth.dependencies import get_current_active_user
from app.auth.permissions import require_permission
from app.auth.schemas import GenericResponse
from app.database.session import get_db
from app.models.enums import Permission
from app.models.identity import User

logger = structlog.get_logger(__name__)

router = APIRouter()


# Schemas
class AssetExtractionRequest(BaseModel):
    message_text: str = Field(..., min_length=10)
    session_id: UUID | None = None
    message_id: UUID | None = None


class ExtractedAssetResponse(BaseModel):
    id: UUID
    asset_type: str
    asset_name: str
    description: str | None
    asset_metadata: dict | None
    created_at: str

    class Config:
        from_attributes = True


@router.post(
    "/extract",
    response_model=GenericResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(Permission.VIEW_ASSETS))],
)
async def extract_assets(
    request: AssetExtractionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Extract infrastructure assets from conversation text using AI.
    
    Requires: VIEW_ASSETS permission
    
    This endpoint analyzes the provided text and automatically extracts
    infrastructure assets (servers, databases, APIs, cloud services, etc.)
    """
    if current_user.organization_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    asset_service = AssetExtractionService(db)

    extracted_assets = await asset_service.extract_assets_from_message(
        message_text=request.message_text,
        organization_id=current_user.organization_id,
        session_id=request.session_id,
        message_id=request.message_id,
    )

    asset_responses = [
        ExtractedAssetResponse(
            id=asset.id,
            asset_type=asset.asset_type,
            asset_name=asset.asset_name,
            description=asset.description,
            asset_metadata=asset.asset_metadata,
            created_at=asset.created_at.isoformat(),
        )
        for asset in extracted_assets
    ]

    return {
        "success": True,
        "message": f"Extracted {len(extracted_assets)} assets",
        "data": {
            "assets": asset_responses,
            "count": len(extracted_assets),
        },
    }


@router.get(
    "",
    response_model=GenericResponse,
    dependencies=[Depends(require_permission(Permission.VIEW_ASSETS))],
)
async def list_infrastructure_assets(
    asset_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    List infrastructure assets for the organization.
    
    Requires: VIEW_ASSETS permission
    
    Optionally filter by asset type (server, database, api, cloud_service, etc.)
    """
    if current_user.organization_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    asset_service = AssetExtractionService(db)

    assets = await asset_service.get_infrastructure_assets(
        organization_id=current_user.organization_id,
        asset_type=asset_type,
    )

    asset_responses = [
        ExtractedAssetResponse(
            id=asset.id,
            asset_type=asset.asset_type,
            asset_name=asset.asset_name,
            description=asset.description,
            asset_metadata=asset.asset_metadata,
            created_at=asset.created_at.isoformat(),
        )
        for asset in assets
    ]

    return {
        "success": True,
        "message": "Infrastructure assets retrieved",
        "data": {
            "assets": asset_responses,
            "count": len(assets),
            "filter_type": asset_type,
        },
    }


@router.get(
    "/statistics",
    response_model=GenericResponse,
    dependencies=[Depends(require_permission(Permission.VIEW_ASSETS))],
)
async def get_asset_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get statistics about infrastructure assets.
    
    Requires: VIEW_ASSETS permission
    
    Returns counts by type and recent assets.
    """
    if current_user.organization_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    asset_service = AssetExtractionService(db)

    stats = await asset_service.get_asset_statistics(
        organization_id=current_user.organization_id,
    )

    return {
        "success": True,
        "message": "Asset statistics retrieved",
        "data": stats,
    }


# --- Vulnerability scanning + infrastructure map ---


def _require_org(current_user: User) -> UUID:
    if current_user.organization_id is None:
        raise HTTPException(status_code=400, detail="User must belong to an organization")
    return current_user.organization_id


@router.post(
    "/scan-vulnerabilities",
    response_model=GenericResponse,
    dependencies=[Depends(require_permission(Permission.VIEW_VULNERABILITIES))],
)
async def scan_vulnerabilities(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Scan all infrastructure assets against NVD and refresh risk/status (Admin)."""
    org_id = _require_org(current_user)
    service = VulnerabilityService(db)
    summary = await service.scan_organization(org_id)
    return {
        "success": True,
        "message": f"Scanned {summary['assets_scanned']} assets, found {summary['new_vulnerabilities']} new CVEs",
        "data": summary,
    }


@router.get(
    "/vulnerabilities",
    response_model=GenericResponse,
    dependencies=[Depends(require_permission(Permission.VIEW_VULNERABILITIES))],
)
async def list_vulnerabilities(
    only_open: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """List detected vulnerabilities for the organization."""
    org_id = _require_org(current_user)
    service = VulnerabilityService(db)
    vulns = await service.list_vulnerabilities(org_id, only_open=only_open)
    return {
        "success": True,
        "message": "Vulnerabilities retrieved",
        "data": {"vulnerabilities": vulns, "count": len(vulns)},
    }


@router.get(
    "/map",
    response_model=GenericResponse,
    dependencies=[Depends(require_permission(Permission.VIEW_INFRASTRUCTURE_MAP))],
)
async def infrastructure_map(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Infrastructure topology map (nodes + edges) for the dashboard (Admin)."""
    org_id = _require_org(current_user)
    service = VulnerabilityService(db)
    graph = await service.get_infrastructure_map(org_id)
    return {
        "success": True,
        "message": "Infrastructure map retrieved",
        "data": graph,
    }
