"""
Professional Frameworks API Router
Provides comprehensive endpoints for managing compliance frameworks
"""
from typing import Any, List, Optional
from uuid import UUID
import re
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from app.database.session import get_db
from app.auth.dependencies import get_current_active_user, require_org_admin
from app.models.compliance import Framework, organization_frameworks
from app.models.identity import Organization
from app.models.enums import FrameworkType, FrameworkCategory
from app.schemas.compliance import (
    FrameworkCreate,
    FrameworkUpdate,
    FrameworkResponse,
    FrameworkListResponse,
    FrameworkStatsResponse,
    AddFrameworksRequest,
    AddFrameworksResponse
)
from app.auth.schemas import GenericResponse

router = APIRouter()


def sanitize_input(text: str) -> str:
    """Sanitize input to prevent XSS attacks"""
    if not text:
        return text
    
    # Remove HTML tags
    text = re.sub(r'<[^>]*>', '', text)
    
    # Remove script tags and content
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', ';']
    for char in dangerous_chars:
        if char in text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid character '{char}' in input. HTML/Script tags are not allowed."
            )
    
    return text.strip()


@router.get(
    "/",
    response_model=GenericResponse,
    summary="List all frameworks",
    description="Get a paginated list of all compliance frameworks with optional filtering by type, category, region, and mandatory status"
)
async def list_frameworks(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_active_user),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return"),
    framework_type: Optional[FrameworkType] = Query(None, description="Filter by framework type (STANDARD, REGULATION, GUIDELINE)"),
    category: Optional[FrameworkCategory] = Query(None, description="Filter by category"),
    region: Optional[str] = Query(None, description="Filter by region (e.g., 'United States', 'European Union')"),
    is_mandatory: Optional[bool] = Query(None, description="Filter by mandatory status"),
    search: Optional[str] = Query(None, description="Search in framework name or description")
) -> Any:
    """
    Get list of frameworks with advanced filtering options.
    
    **Filters:**
    - `framework_type`: Filter by STANDARD, REGULATION, or GUIDELINE
    - `category`: Filter by category (e.g., DATA_PROTECTION, HEALTHCARE)
    - `region`: Filter by geographic region
    - `is_mandatory`: Filter by mandatory/optional status
    - `search`: Search in name or description
    
    **Returns:**
    - List of frameworks with metadata
    - Total count
    - Pagination info
    """
    # Build query - join with organization_frameworks to filter by organization
    base_query = (
        select(Framework)
        .join(organization_frameworks, Framework.id == organization_frameworks.c.framework_id)
        .where(organization_frameworks.c.organization_id == current_user.organization_id)
    )
    
    # Apply filters
    if framework_type:
        base_query = base_query.where(Framework.framework_type == framework_type)
    
    if category:
        base_query = base_query.where(Framework.category == category)
    
    if region:
        base_query = base_query.where(Framework.region == region)
    
    if is_mandatory is not None:
        base_query = base_query.where(Framework.is_mandatory == is_mandatory)
    
    if search:
        search_pattern = f"%{search}%"
        base_query = base_query.where(
            or_(
                Framework.name.ilike(search_pattern),
                Framework.description.ilike(search_pattern)
            )
        )
    
    # Get total count - use count on Framework.id directly
    count_query = (
        select(func.count(Framework.id))
        .join(organization_frameworks, Framework.id == organization_frameworks.c.framework_id)
        .where(organization_frameworks.c.organization_id == current_user.organization_id)
    )
    
    # Apply same filters to count query
    if framework_type:
        count_query = count_query.where(Framework.framework_type == framework_type)
    
    if category:
        count_query = count_query.where(Framework.category == category)
    
    if region:
        count_query = count_query.where(Framework.region == region)
    
    if is_mandatory is not None:
        count_query = count_query.where(Framework.is_mandatory == is_mandatory)
    
    if search:
        search_pattern = f"%{search}%"
        count_query = count_query.where(
            or_(
                Framework.name.ilike(search_pattern),
                Framework.description.ilike(search_pattern)
            )
        )
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination and ordering to main query
    query = base_query.order_by(Framework.framework_type, Framework.name).offset(skip).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    frameworks = result.scalars().all()
    
    return {
        "success": True,
        "message": f"Retrieved {len(frameworks)} frameworks",
        "data": {
            "frameworks": [FrameworkListResponse.model_validate(f) for f in frameworks],
            "total": total,
            "skip": skip,
            "limit": limit,
            "filters": {
                "framework_type": framework_type.value if framework_type else None,
                "category": category.value if category else None,
                "region": region,
                "is_mandatory": is_mandatory,
                "search": search
            }
        }
    }


@router.get(
    "/stats",
    response_model=GenericResponse,
    summary="Get framework statistics",
    description="Get comprehensive statistics about frameworks including counts by type, category, region, and mandatory status"
)
async def get_framework_stats(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> Any:
    """
    Get comprehensive statistics about frameworks.
    
    **Returns:**
    - Total count
    - Count by type (STANDARD, REGULATION, GUIDELINE)
    - Count by category
    - Count by region
    - Mandatory vs optional count
    """
    org_id = current_user.organization_id
    
    # Total count - frameworks associated with this organization
    total_result = await db.execute(
        select(func.count(Framework.id))
        .join(organization_frameworks, Framework.id == organization_frameworks.c.framework_id)
        .where(organization_frameworks.c.organization_id == org_id)
    )
    total = total_result.scalar()
    
    # Count by type
    type_result = await db.execute(
        select(Framework.framework_type, func.count(Framework.id))
        .join(organization_frameworks, Framework.id == organization_frameworks.c.framework_id)
        .where(organization_frameworks.c.organization_id == org_id)
        .group_by(Framework.framework_type)
    )
    by_type = {row[0].value: row[1] for row in type_result.all()}
    
    # Count by category
    category_result = await db.execute(
        select(Framework.category, func.count(Framework.id))
        .join(organization_frameworks, Framework.id == organization_frameworks.c.framework_id)
        .where(organization_frameworks.c.organization_id == org_id)
        .group_by(Framework.category)
    )
    by_category = {row[0].value: row[1] for row in category_result.all()}
    
    # Count by region
    region_result = await db.execute(
        select(Framework.region, func.count(Framework.id))
        .join(organization_frameworks, Framework.id == organization_frameworks.c.framework_id)
        .where(organization_frameworks.c.organization_id == org_id, Framework.region.isnot(None))
        .group_by(Framework.region)
    )
    by_region = {row[0]: row[1] for row in region_result.all()}
    
    # Mandatory vs optional
    mandatory_result = await db.execute(
        select(func.count(Framework.id))
        .join(organization_frameworks, Framework.id == organization_frameworks.c.framework_id)
        .where(organization_frameworks.c.organization_id == org_id, Framework.is_mandatory == True)
    )
    mandatory_count = mandatory_result.scalar()
    
    optional_count = total - mandatory_count
    
    return {
        "success": True,
        "message": "Framework statistics retrieved successfully",
        "data": {
            "total": total,
            "by_type": by_type,
            "by_category": by_category,
            "by_region": by_region,
            "mandatory_count": mandatory_count,
            "optional_count": optional_count
        }
    }


@router.get(
    "/types",
    response_model=GenericResponse,
    summary="Get available framework types",
    description="Get list of all available framework types (STANDARD, REGULATION, GUIDELINE)"
)
async def get_framework_types(
    current_user: Any = Depends(get_current_active_user)
) -> Any:
    """
    Get all available framework types.
    
    **Returns:**
    - List of framework types with descriptions
    """
    types = [
        {
            "value": FrameworkType.STANDARD.value,
            "label": "Standard",
            "description": "Industry standards and best practices (e.g., ISO 27001, NIST CSF, SOC 2)"
        },
        {
            "value": FrameworkType.REGULATION.value,
            "label": "Regulation",
            "description": "Legal regulations and compliance requirements (e.g., GDPR, HIPAA, CCPA)"
        },
        {
            "value": FrameworkType.GUIDELINE.value,
            "label": "Guideline",
            "description": "Recommended guidelines and frameworks"
        }
    ]
    
    return {
        "success": True,
        "message": "Framework types retrieved successfully",
        "data": {"types": types}
    }


@router.get(
    "/categories",
    response_model=GenericResponse,
    summary="Get available framework categories",
    description="Get list of all available framework categories"
)
async def get_framework_categories(
    current_user: Any = Depends(get_current_active_user)
) -> Any:
    """
    Get all available framework categories.
    
    **Returns:**
    - List of categories with descriptions
    """
    categories = [
        {"value": cat.value, "label": cat.value.replace("_", " ").title()}
        for cat in FrameworkCategory
    ]
    
    return {
        "success": True,
        "message": "Framework categories retrieved successfully",
        "data": {"categories": categories}
    }


@router.get(
    "/regions",
    response_model=GenericResponse,
    summary="Get available regions",
    description="Get list of all regions that have frameworks"
)
async def get_framework_regions(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> Any:
    """
    Get all unique regions from existing frameworks.
    
    **Returns:**
    - List of regions with framework counts
    """
    result = await db.execute(
        select(Framework.region, func.count(Framework.id))
        .join(organization_frameworks, Framework.id == organization_frameworks.c.framework_id)
        .where(
            organization_frameworks.c.organization_id == current_user.organization_id,
            Framework.region.isnot(None)
        )
        .group_by(Framework.region)
        .order_by(func.count(Framework.id).desc())
    )
    
    regions = [{"region": row[0], "count": row[1]} for row in result.all()]
    
    return {
        "success": True,
        "message": "Framework regions retrieved successfully",
        "data": {"regions": regions}
    }


@router.get(
    "/{framework_id}",
    response_model=GenericResponse,
    summary="Get framework details",
    description="Get detailed information about a specific framework"
)
async def get_framework(
    framework_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> Any:
    """
    Get detailed information about a specific framework.
    
    **Parameters:**
    - `framework_id`: UUID of the framework
    
    **Returns:**
    - Complete framework details including all metadata
    """
    result = await db.execute(
        select(Framework)
        .join(organization_frameworks, Framework.id == organization_frameworks.c.framework_id)
        .where(
            Framework.id == framework_id,
            organization_frameworks.c.organization_id == current_user.organization_id
        )
    )
    framework = result.scalar_one_or_none()
    
    if not framework:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Framework not found"
        )
    
    return {
        "success": True,
        "message": "Framework retrieved successfully",
        "data": {"framework": FrameworkResponse.model_validate(framework)}
    }


@router.post(
    "/",
    response_model=GenericResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new framework",
    description="Create a new compliance framework (Admin only)"
)
async def create_framework(
    framework_in: FrameworkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_org_admin)
) -> Any:
    """
    Create a new compliance framework.
    
    **Required fields:**
    - `name`: Framework name
    - `framework_type`: STANDARD, REGULATION, or GUIDELINE
    - `category`: Framework category
    
    **Optional fields:**
    - `version`: Framework version
    - `description`: Detailed description
    - `region`: Geographic region
    - `industry`: Target industry
    - `is_mandatory`: Whether legally required
    - `official_url`: Official documentation URL
    
    **Permissions:** Organization Admin only
    """
    # Sanitize inputs to prevent XSS
    framework_in.name = sanitize_input(framework_in.name)
    if framework_in.description:
        framework_in.description = sanitize_input(framework_in.description)
    if framework_in.region:
        framework_in.region = sanitize_input(framework_in.region)
    if framework_in.industry:
        framework_in.industry = sanitize_input(framework_in.industry)
    
    # Check for duplicate name in this organization
    existing = await db.execute(
        select(Framework)
        .join(organization_frameworks, Framework.id == organization_frameworks.c.framework_id)
        .where(
            organization_frameworks.c.organization_id == current_user.organization_id,
            Framework.name == framework_in.name
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Framework with name '{framework_in.name}' already exists"
        )
    
    # Create framework (without organization_id)
    framework_data = framework_in.model_dump(exclude={'organization_id'})
    framework = Framework(**framework_data)
    db.add(framework)
    await db.flush()  # Flush to get the framework ID
    
    # Create the organization-framework association
    await db.execute(
        organization_frameworks.insert().values(
            organization_id=current_user.organization_id,
            framework_id=framework.id
        )
    )
    
    await db.commit()
    await db.refresh(framework)
    
    return {
        "success": True,
        "message": "Framework created successfully",
        "data": {"framework": FrameworkResponse.model_validate(framework)}
    }


@router.patch(
    "/{framework_id}",
    response_model=GenericResponse,
    summary="Update framework",
    description="Update an existing framework (Admin only)"
)
async def update_framework(
    framework_id: UUID,
    framework_in: FrameworkUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_org_admin)
) -> Any:
    """
    Update an existing framework.
    
    **Parameters:**
    - `framework_id`: UUID of the framework to update
    
    **Updatable fields:**
    - All framework fields can be updated
    
    **Permissions:** Organization Admin only
    """
    # Get framework
    result = await db.execute(
        select(Framework)
        .join(organization_frameworks, Framework.id == organization_frameworks.c.framework_id)
        .where(
            Framework.id == framework_id,
            organization_frameworks.c.organization_id == current_user.organization_id
        )
    )
    framework = result.scalar_one_or_none()
    
    if not framework:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Framework not found"
        )
    
    # Sanitize inputs
    if framework_in.name:
        framework_in.name = sanitize_input(framework_in.name)
    if framework_in.description:
        framework_in.description = sanitize_input(framework_in.description)
    if framework_in.region:
        framework_in.region = sanitize_input(framework_in.region)
    if framework_in.industry:
        framework_in.industry = sanitize_input(framework_in.industry)
    
    # Check for duplicate name if name is being updated
    if framework_in.name and framework_in.name != framework.name:
        existing = await db.execute(
            select(Framework)
            .join(organization_frameworks, Framework.id == organization_frameworks.c.framework_id)
            .where(
                organization_frameworks.c.organization_id == current_user.organization_id,
                Framework.name == framework_in.name,
                Framework.id != framework_id
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Framework with name '{framework_in.name}' already exists"
            )
    
    # Update framework
    update_data = framework_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(framework, field, value)
    
    db.add(framework)
    await db.commit()
    await db.refresh(framework)
    
    return {
        "success": True,
        "message": "Framework updated successfully",
        "data": {"framework": FrameworkResponse.model_validate(framework)}
    }


@router.delete(
    "/{framework_id}",
    response_model=GenericResponse,
    summary="Delete framework",
    description="Delete a framework (Admin only)"
)
async def delete_framework(
    framework_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_org_admin)
) -> Any:
    """
    Delete a framework.
    
    **Parameters:**
    - `framework_id`: UUID of the framework to delete
    
    **Warning:** This will also delete all associated controls and assessments.
    
    **Permissions:** Organization Admin only
    """
    # Get framework
    result = await db.execute(
        select(Framework)
        .join(organization_frameworks, Framework.id == organization_frameworks.c.framework_id)
        .where(
            Framework.id == framework_id,
            organization_frameworks.c.organization_id == current_user.organization_id
        )
    )
    framework = result.scalar_one_or_none()
    
    if not framework:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Framework not found"
        )
    
    # Delete framework (cascade will handle related records including junction table)
    await db.delete(framework)
    await db.commit()
    
    return {
        "success": True,
        "message": f"Framework '{framework.name}' deleted successfully"
    }


@router.post(
    "/associate",
    response_model=GenericResponse,
    summary="Associate frameworks with organization",
    description="Add frameworks to organization by IDs, types, or all frameworks (Admin only)"
)
async def associate_frameworks(
    request: AddFrameworksRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_org_admin)
) -> Any:
    """
    Associate frameworks with the current organization.
    
    **Three ways to add frameworks:**
    
    1. **By specific IDs**: Provide `framework_ids` list
    2. **By types**: Provide `framework_types` list (e.g., ["standard", "regulation"])
    3. **All frameworks**: Set `add_all` to true
    
    **Examples:**
    
    ```json
    // Add specific frameworks
    {
      "framework_ids": ["uuid1", "uuid2", "uuid3"]
    }
    
    // Add all standards and regulations
    {
      "framework_types": ["standard", "regulation"]
    }
    
    // Add all available frameworks
    {
      "add_all": true
    }
    ```
    
    **Returns:**
    - Number of frameworks added
    - Number of frameworks skipped (already associated)
    - Total frameworks now associated
    - List of newly added frameworks
    
    **Permissions:** Organization Admin only
    """
    org_id = current_user.organization_id
    
    # Validate request - at least one method must be specified
    if not request.framework_ids and not request.framework_types and not request.add_all:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must specify at least one of: framework_ids, framework_types, or add_all"
        )
    
    # Build query to get frameworks to add
    query = select(Framework)
    
    if request.add_all:
        # Add all frameworks
        pass  # No filter needed
    elif request.framework_ids:
        # Add specific frameworks by ID
        query = query.where(Framework.id.in_(request.framework_ids))
    elif request.framework_types:
        # Add frameworks by type
        query = query.where(Framework.framework_type.in_(request.framework_types))
    
    # Get frameworks
    result = await db.execute(query)
    frameworks_to_add = result.scalars().all()
    
    if not frameworks_to_add:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No frameworks found matching the criteria"
        )
    
    # Get already associated framework IDs
    existing_result = await db.execute(
        select(organization_frameworks.c.framework_id)
        .where(organization_frameworks.c.organization_id == org_id)
    )
    existing_framework_ids = {row[0] for row in existing_result.all()}
    
    # Filter out already associated frameworks
    added_frameworks = []
    skipped_count = 0
    
    for framework in frameworks_to_add:
        if framework.id in existing_framework_ids:
            skipped_count += 1
            continue
        
        # Add association
        await db.execute(
            organization_frameworks.insert().values(
                organization_id=org_id,
                framework_id=framework.id
            )
        )
        added_frameworks.append(framework)
    
    await db.commit()
    
    # Get total count after addition
    total_result = await db.execute(
        select(func.count(organization_frameworks.c.framework_id))
        .where(organization_frameworks.c.organization_id == org_id)
    )
    total_frameworks = total_result.scalar()
    
    return {
        "success": True,
        "message": f"Added {len(added_frameworks)} frameworks, skipped {skipped_count} already associated",
        "data": {
            "added_count": len(added_frameworks),
            "skipped_count": skipped_count,
            "total_frameworks": total_frameworks,
            "added_frameworks": [FrameworkListResponse.model_validate(f) for f in added_frameworks]
        }
    }


@router.get(
    "/available/all",
    response_model=GenericResponse,
    summary="Get all available frameworks",
    description="Get all frameworks in the system (not just organization's frameworks)"
)
async def get_all_available_frameworks(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_active_user),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=200, description="Maximum number of records to return"),
    framework_type: Optional[FrameworkType] = Query(None, description="Filter by framework type"),
    category: Optional[FrameworkCategory] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in framework name or description")
) -> Any:
    """
    Get all available frameworks in the system (not filtered by organization).
    
    This endpoint shows ALL frameworks that exist, useful for:
    - Discovering new frameworks to add
    - Browsing the framework library
    - Seeing what's available before associating
    
    **Returns:**
    - List of all frameworks with metadata
    - Indicates which ones are already associated with your organization
    """
    org_id = current_user.organization_id
    
    # Get organization's framework IDs
    org_frameworks_result = await db.execute(
        select(organization_frameworks.c.framework_id)
        .where(organization_frameworks.c.organization_id == org_id)
    )
    org_framework_ids = {row[0] for row in org_frameworks_result.all()}
    
    # Build query for all frameworks
    query = select(Framework)
    
    if framework_type:
        query = query.where(Framework.framework_type == framework_type)
    
    if category:
        query = query.where(Framework.category == category)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Framework.name.ilike(search_pattern),
                Framework.description.ilike(search_pattern)
            )
        )
    
    # Get total count
    count_query = select(func.count(Framework.id))
    if framework_type:
        count_query = count_query.where(Framework.framework_type == framework_type)
    if category:
        count_query = count_query.where(Framework.category == category)
    if search:
        search_pattern = f"%{search}%"
        count_query = count_query.where(
            or_(
                Framework.name.ilike(search_pattern),
                Framework.description.ilike(search_pattern)
            )
        )
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.order_by(Framework.framework_type, Framework.name).offset(skip).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    frameworks = result.scalars().all()
    
    # Add "is_associated" flag to each framework
    frameworks_data = []
    for fw in frameworks:
        fw_dict = FrameworkListResponse.model_validate(fw).model_dump()
        fw_dict["is_associated"] = fw.id in org_framework_ids
        frameworks_data.append(fw_dict)
    
    return {
        "success": True,
        "message": f"Retrieved {len(frameworks)} available frameworks",
        "data": {
            "frameworks": frameworks_data,
            "total": total,
            "skip": skip,
            "limit": limit,
            "organization_associated_count": len(org_framework_ids)
        }
    }


@router.delete(
    "/dissociate/{framework_id}",
    response_model=GenericResponse,
    summary="Remove framework from organization",
    description="Dissociate a framework from the organization (Admin only)"
)
async def dissociate_framework(
    framework_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_org_admin)
) -> Any:
    """
    Remove a framework association from the organization.
    
    **Note:** This only removes the association, it does NOT delete the framework itself.
    The framework will still exist in the system and can be re-associated later.
    
    **Parameters:**
    - `framework_id`: UUID of the framework to dissociate
    
    **Permissions:** Organization Admin only
    """
    org_id = current_user.organization_id
    
    # Check if association exists
    check_result = await db.execute(
        select(organization_frameworks)
        .where(
            organization_frameworks.c.organization_id == org_id,
            organization_frameworks.c.framework_id == framework_id
        )
    )
    association = check_result.first()
    
    if not association:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Framework is not associated with your organization"
        )
    
    # Get framework name for response
    fw_result = await db.execute(
        select(Framework).where(Framework.id == framework_id)
    )
    framework = fw_result.scalar_one_or_none()
    
    # Delete association
    await db.execute(
        organization_frameworks.delete().where(
            organization_frameworks.c.organization_id == org_id,
            organization_frameworks.c.framework_id == framework_id
        )
    )
    await db.commit()
    
    return {
        "success": True,
        "message": f"Framework '{framework.name if framework else 'Unknown'}' removed from organization"
    }
