"""
Dashboard Router
API endpoints for organization dashboard with role-based access control
"""
from typing import Any

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import get_current_active_user
from app.auth.permissions import require_any_permission, require_permission
from app.auth.schemas import GenericResponse
from app.database.session import get_db
from app.models.assessments import Assessment, AssessmentSession
from app.models.assets_risks import Asset, Risk
from app.models.compliance import Framework
from app.models.enums import Permission, UserRole
from app.models.identity import Organization, User

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get(
    "/overview",
    response_model=GenericResponse,
    dependencies=[Depends(require_any_permission(
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_ORG_TOTAL_SCORE
    ))],
)
async def get_dashboard_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get dashboard overview with role-based data filtering.
    
    org_admin: Sees full organization overview
    org_member: Sees personal assessment progress only
    """
    if current_user.organization_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    org_id = current_user.organization_id
    is_admin = current_user.role == UserRole.ORG_ADMIN

    # Get organization details
    org_result = await db.execute(
        select(Organization).where(Organization.id == org_id)
    )
    org = org_result.scalar_one_or_none()

    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    # Base response data
    data = {
        "organization": {
            "id": str(org.id),
            "name": org.name,
            "domain": org.domain,
        },
        "user_role": current_user.role.value,
    }

    if is_admin:
        # Admin sees full organization stats
        # Get total assessments
        assessments_result = await db.execute(
            select(func.count(Assessment.id)).where(Assessment.organization_id == org_id)
        )
        total_assessments = assessments_result.scalar() or 0

        # Get completed assessments with scores
        completed_result = await db.execute(
            select(
                func.count(Assessment.id),
                func.avg(Assessment.overall_score)
            ).where(
                and_(
                    Assessment.organization_id == org_id,
                    Assessment.status == "completed",
                    Assessment.overall_score.isnot(None)
                )
            )
        )
        completed_data = completed_result.first()
        completed_assessments = completed_data[0] if completed_data else 0
        avg_compliance_score = float(completed_data[1]) if completed_data and completed_data[1] else 0.0

        # Get total assets
        assets_result = await db.execute(
            select(func.count(Asset.id)).where(Asset.organization_id == org_id)
        )
        total_assets = assets_result.scalar() or 0

        # Get total risks
        risks_result = await db.execute(
            select(func.count(Risk.id))
            .join(Asset, Risk.asset_id == Asset.id)
            .where(Asset.organization_id == org_id)
        )
        total_risks = risks_result.scalar() or 0

        # Get active frameworks
        frameworks_result = await db.execute(
            select(Framework)
            .join(Organization.frameworks)
            .where(Organization.id == org_id)
        )
        frameworks = frameworks_result.scalars().all()

        data.update({
            "stats": {
                "total_assessments": total_assessments,
                "completed_assessments": completed_assessments,
                "avg_compliance_score": round(avg_compliance_score, 2),
                "total_assets": total_assets,
                "total_risks": total_risks,
                "active_frameworks": len(frameworks),
            },
            "frameworks": [
                {
                    "id": str(f.id),
                    "name": f.name,
                    "version": f.version,
                    "category": f.category.value if f.category else None,
                }
                for f in frameworks
            ],
        })
    else:
        # Member sees personal progress only
        # Get user's assessment sessions
        sessions_result = await db.execute(
            select(AssessmentSession)
            .where(AssessmentSession.user_id == current_user.id)
            .options(selectinload(AssessmentSession.assessment))
        )
        sessions = sessions_result.scalars().all()

        total_sessions = len(sessions)
        completed_sessions = len([s for s in sessions if s.status == "completed"])

        data.update({
            "stats": {
                "total_sessions": total_sessions,
                "completed_sessions": completed_sessions,
                "completion_rate": round((completed_sessions / total_sessions * 100) if total_sessions > 0 else 0, 2),
            },
        })

    return {
        "success": True,
        "message": "Dashboard overview retrieved successfully",
        "data": data,
    }


@router.get(
    "/compliance",
    response_model=GenericResponse,
    dependencies=[Depends(require_permission(Permission.VIEW_ORG_TOTAL_SCORE))],
)
async def get_compliance_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get compliance dashboard (Admin only).
    
    Requires: VIEW_ORG_TOTAL_SCORE permission
    """
    if current_user.organization_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    org_id = current_user.organization_id

    # Get all assessments with scores
    assessments_result = await db.execute(
        select(Assessment)
        .where(Assessment.organization_id == org_id)
        .options(selectinload(Assessment.framework))
        .order_by(Assessment.created_at.desc())
    )
    assessments = assessments_result.scalars().all()

    # Calculate organization-wide compliance score
    scored_assessments = [a for a in assessments if a.overall_score is not None]
    org_score = sum(a.overall_score for a in scored_assessments) / len(scored_assessments) if scored_assessments else 0.0

    # Break down by framework
    framework_scores = {}
    for assessment in assessments:
        if assessment.framework and assessment.overall_score is not None:
            fw_name = assessment.framework.name
            if fw_name not in framework_scores:
                framework_scores[fw_name] = []
            framework_scores[fw_name].append(assessment.overall_score)

    framework_averages = {
        fw: round(sum(scores) / len(scores), 2)
        for fw, scores in framework_scores.items()
    }

    return {
        "success": True,
        "message": "Compliance dashboard retrieved successfully",
        "data": {
            "organization_compliance_score": round(org_score, 2),
            "total_assessments": len(assessments),
            "scored_assessments": len(scored_assessments),
            "framework_scores": framework_averages,
            "assessments": [
                {
                    "id": str(a.id),
                    "name": a.name,
                    "framework": a.framework.name if a.framework else None,
                    "status": a.status.value,
                    "score": a.overall_score,
                    "created_at": a.created_at.isoformat(),
                }
                for a in assessments
            ],
        },
    }


@router.get(
    "/assets",
    response_model=GenericResponse,
    dependencies=[Depends(require_permission(Permission.VIEW_ASSETS))],
)
async def get_assets_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get assets dashboard with role-based filtering.
    
    org_admin: Sees all organization assets
    org_member: Sees only assets they own
    """
    if current_user.organization_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    org_id = current_user.organization_id
    is_admin = current_user.role == UserRole.ORG_ADMIN

    # Build query based on role
    if is_admin:
        # Admin sees all assets
        assets_result = await db.execute(
            select(Asset)
            .where(Asset.organization_id == org_id)
            .options(selectinload(Asset.risks))
        )
    else:
        # Member sees only their owned assets
        assets_result = await db.execute(
            select(Asset)
            .where(
                and_(
                    Asset.organization_id == org_id,
                    Asset.owner_id == current_user.id,
                )
            )
            .options(selectinload(Asset.risks))
        )

    assets = assets_result.scalars().all()

    # Calculate asset statistics
    total_assets = len(assets)
    assets_by_type = {}
    assets_by_criticality = {}

    for asset in assets:
        # Count by type
        asset_type = asset.type.value if asset.type else "unknown"
        assets_by_type[asset_type] = assets_by_type.get(asset_type, 0) + 1

        # Count by criticality
        crit = asset.criticality.value if asset.criticality else "unknown"
        assets_by_criticality[crit] = assets_by_criticality.get(crit, 0) + 1

    return {
        "success": True,
        "message": "Assets dashboard retrieved successfully",
        "data": {
            "total_assets": total_assets,
            "assets_by_type": assets_by_type,
            "assets_by_criticality": assets_by_criticality,
            "assets": [
                {
                    "id": str(a.id),
                    "name": a.name,
                    "type": a.type.value if a.type else None,
                    "criticality": a.criticality.value if a.criticality else None,
                    "owner_id": str(a.owner_id) if a.owner_id else None,
                    "risk_count": len(a.risks) if a.risks else 0,
                    "properties": a.properties,
                }
                for a in assets
            ],
        },
    }


@router.get(
    "/risks",
    response_model=GenericResponse,
    dependencies=[Depends(require_permission(Permission.VIEW_VULNERABILITIES))],
)
async def get_risks_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get risks dashboard with role-based filtering.
    
    org_admin: Sees all organization risks
    org_member: Sees only risks related to their owned assets
    """
    if current_user.organization_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    org_id = current_user.organization_id
    is_admin = current_user.role == UserRole.ORG_ADMIN

    # Build query based on role
    if is_admin:
        # Admin sees all risks
        risks_result = await db.execute(
            select(Risk)
            .join(Asset, Risk.asset_id == Asset.id)
            .where(Asset.organization_id == org_id)
            .options(selectinload(Risk.asset))
        )
    else:
        # Member sees only risks on their owned assets
        risks_result = await db.execute(
            select(Risk)
            .join(Asset, Risk.asset_id == Asset.id)
            .where(
                and_(
                    Asset.organization_id == org_id,
                    Asset.owner_id == current_user.id,
                )
            )
            .options(selectinload(Risk.asset))
        )

    risks = risks_result.scalars().all()

    # Calculate risk statistics
    total_risks = len(risks)
    risks_by_severity = {}
    high_impact_risks = 0

    for risk in risks:
        # Count by severity
        severity = risk.severity.value if risk.severity else "unknown"
        risks_by_severity[severity] = risks_by_severity.get(severity, 0) + 1

        # Count high impact risks (probability > 0.7 and impact > 0.7)
        if risk.probability and risk.impact:
            if risk.probability > 0.7 and risk.impact > 0.7:
                high_impact_risks += 1

    return {
        "success": True,
        "message": "Risks dashboard retrieved successfully",
        "data": {
            "total_risks": total_risks,
            "high_impact_risks": high_impact_risks,
            "risks_by_severity": risks_by_severity,
            "risks": [
                {
                    "id": str(r.id),
                    "title": r.title,
                    "description": r.description,
                    "probability": r.probability,
                    "impact": r.impact,
                    "severity": r.severity.value if r.severity else None,
                    "asset_name": r.asset.name if r.asset else None,
                    "mitigation_plan": r.mitigation_plan,
                }
                for r in risks
            ],
        },
    }
