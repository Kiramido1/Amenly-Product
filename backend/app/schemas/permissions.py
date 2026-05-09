"""
Permission Schemas
"""
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import Permission


class PermissionInfo(BaseModel):
    """Information about a single permission"""
    value: str = Field(..., description="Permission value")
    label: str = Field(..., description="Human-readable label")
    description: str = Field(..., description="Permission description")
    category: str = Field(..., description="Permission category")


class UserPermissionsResponse(BaseModel):
    """User's complete permissions"""
    user_id: UUID
    role: str
    role_permissions: List[str] = Field(..., description="Permissions from role")
    custom_permissions: List[str] = Field(..., description="Additional granted permissions")
    all_permissions: List[str] = Field(..., description="Combined permissions")


class GrantPermissionRequest(BaseModel):
    """Request to grant permissions to a user"""
    user_id: UUID = Field(..., description="User to grant permissions to")
    permissions: List[Permission] = Field(..., description="Permissions to grant")
    notes: Optional[str] = Field(None, max_length=500, description="Notes about why permissions were granted")
    expires_at: Optional[datetime] = Field(None, description="Optional expiry date for permissions")


class RevokePermissionRequest(BaseModel):
    """Request to revoke permissions from a user"""
    user_id: UUID = Field(..., description="User to revoke permissions from")
    permissions: List[Permission] = Field(..., description="Permissions to revoke")


class UserRolePermissionResponse(BaseModel):
    """Response for user role permission"""
    id: UUID
    user_id: UUID
    permissions: List[str]
    granted_by_id: Optional[UUID]
    granted_at: datetime
    expires_at: Optional[datetime]
    is_active: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Permission categories and descriptions
PERMISSION_CATALOG = {
    # Assessment Permissions
    Permission.START_ASSESSMENT: {
        "label": "Start Assessment",
        "description": "Can initiate new compliance assessments",
        "category": "Assessment"
    },
    Permission.VIEW_OWN_SESSIONS: {
        "label": "View Own Sessions",
        "description": "Can view own assessment sessions and chats",
        "category": "Assessment"
    },
    Permission.VIEW_ALL_SESSIONS: {
        "label": "View All Sessions",
        "description": "Can view all assessment sessions of organization members",
        "category": "Assessment"
    },
    Permission.VIEW_OWN_SCORE: {
        "label": "View Own Score",
        "description": "Can view own compliance scores",
        "category": "Assessment"
    },
    Permission.VIEW_ALL_SCORES: {
        "label": "View All Scores",
        "description": "Can view compliance scores of all members",
        "category": "Assessment"
    },
    Permission.VIEW_ORG_TOTAL_SCORE: {
        "label": "View Organization Total Score",
        "description": "Can view organization's total compliance score",
        "category": "Assessment"
    },
    
    # Framework Permissions
    Permission.SELECT_FRAMEWORK: {
        "label": "Select Framework",
        "description": "Can select compliance frameworks for assessments",
        "category": "Framework"
    },
    Permission.MANAGE_FRAMEWORKS: {
        "label": "Manage Frameworks",
        "description": "Can add, update, and remove frameworks",
        "category": "Framework"
    },
    
    # Dashboard Permissions
    Permission.VIEW_DASHBOARD: {
        "label": "View Dashboard",
        "description": "Can access the compliance dashboard",
        "category": "Dashboard"
    },
    Permission.VIEW_ASSETS: {
        "label": "View Assets",
        "description": "Can view organization assets",
        "category": "Dashboard"
    },
    Permission.VIEW_VULNERABILITIES: {
        "label": "View Vulnerabilities",
        "description": "Can view security vulnerabilities",
        "category": "Dashboard"
    },
    Permission.MANAGE_DASHBOARD_ACCESS: {
        "label": "Manage Dashboard Access",
        "description": "Can grant dashboard access to members",
        "category": "Dashboard"
    },
    
    # Member Management
    Permission.VIEW_MEMBERS: {
        "label": "View Members",
        "description": "Can view organization members",
        "category": "Members"
    },
    Permission.MANAGE_MEMBERS: {
        "label": "Manage Members",
        "description": "Can add, update, and remove members",
        "category": "Members"
    },
    Permission.GRANT_PERMISSIONS: {
        "label": "Grant Permissions",
        "description": "Can grant permissions to other users",
        "category": "Members"
    },
}


def get_permission_info(permission: Permission) -> PermissionInfo:
    """Get information about a permission"""
    info = PERMISSION_CATALOG.get(permission, {
        "label": permission.value.replace("_", " ").title(),
        "description": f"Permission: {permission.value}",
        "category": "Other"
    })
    
    return PermissionInfo(
        value=permission.value,
        label=info["label"],
        description=info["description"],
        category=info["category"]
    )
