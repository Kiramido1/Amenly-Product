"""
User Role Permissions Model
Fine-grained permission system for role-based access control
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, String, ForeignKey, Boolean, Table
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship

from app.database.session import Base
from app.models.identity import TimestampMixin
from app.models.enums import Permission


class UserRolePermission(Base, TimestampMixin):
    """
    User-specific permissions that override or extend role-based permissions.
    Allows granular control over what each user can do.
    """
    __tablename__ = "user_role_permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Permissions stored as array of enum values
    permissions = Column(ARRAY(String), nullable=False, default=list)
    
    # Optional: Grant specific permissions
    granted_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    granted_at = Column(DateTime, default=datetime.utcnow)
    
    # Optional: Expiry for temporary permissions
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Notes about why permission was granted
    notes = Column(String(500), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="custom_permissions")
    granted_by = relationship("User", foreign_keys=[granted_by_id])


# Default permissions for each role
ROLE_PERMISSIONS = {
    "org_admin": [
        # Assessment Permissions
        Permission.START_ASSESSMENT,
        Permission.VIEW_OWN_SESSIONS,
        Permission.VIEW_ALL_SESSIONS,
        Permission.VIEW_OWN_SCORE,
        Permission.VIEW_ALL_SCORES,
        Permission.VIEW_ORG_TOTAL_SCORE,
        
        # Framework Permissions
        Permission.SELECT_FRAMEWORK,
        Permission.MANAGE_FRAMEWORKS,
        
        # Dashboard Permissions
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_ASSETS,
        Permission.VIEW_VULNERABILITIES,
        Permission.MANAGE_DASHBOARD_ACCESS,
        
        # Member Management
        Permission.VIEW_MEMBERS,
        Permission.MANAGE_MEMBERS,
        Permission.GRANT_PERMISSIONS,
    ],
    "org_member": [
        # Assessment Permissions (limited)
        Permission.VIEW_OWN_SESSIONS,
        Permission.VIEW_OWN_SCORE,
        
        # Dashboard Permissions (if granted)
        # VIEW_DASHBOARD can be granted by admin
    ]
}


def get_role_permissions(role: str) -> list[Permission]:
    """Get default permissions for a role"""
    return ROLE_PERMISSIONS.get(role, [])


def has_permission(user_role: str, user_permissions: list[str], required_permission: Permission) -> bool:
    """
    Check if user has a specific permission.
    Checks both role-based and user-specific permissions.
    """
    # Get role-based permissions
    role_perms = get_role_permissions(user_role)
    
    # Check if permission is in role permissions
    if required_permission in role_perms:
        return True
    
    # Check if permission is in user-specific permissions
    if user_permissions and required_permission.value in user_permissions:
        return True
    
    return False
