"""
User Role Permissions Model
Fine-grained permission system for role-based access control
"""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import relationship

from app.database.session import Base
from app.models.enums import Permission as PermissionEnum
from app.models.identity import TimestampMixin


class PermissionModel(Base):
    """Permission definitions"""
    __tablename__ = "permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(String(500), nullable=True)
    category = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    role_permissions = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")


class RolePermission(Base):
    """Role to permission mapping"""
    __tablename__ = "role_permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role = Column(String(50), nullable=False, index=True)
    permission_id = Column(UUID(as_uuid=True), ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    permission = relationship("PermissionModel", back_populates="role_permissions")


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
        PermissionEnum.START_ASSESSMENT,
        PermissionEnum.VIEW_ORG_DASHBOARD,
        PermissionEnum.VIEW_ALL_ASSETS,
        PermissionEnum.VIEW_FINAL_COMPLIANCE_SCORE,
        PermissionEnum.MANAGE_PERMISSIONS,
        PermissionEnum.MANAGE_USERS,
        PermissionEnum.MANAGE_FRAMEWORKS,

        # Assessment Permissions
        PermissionEnum.VIEW_OWN_SESSIONS,
        PermissionEnum.VIEW_ALL_SESSIONS,
        PermissionEnum.VIEW_OWN_SCORE,
        PermissionEnum.VIEW_ALL_SCORES,
        PermissionEnum.VIEW_ORG_TOTAL_SCORE,

        # Framework Permissions
        PermissionEnum.SELECT_FRAMEWORK,
        PermissionEnum.MANAGE_FRAMEWORKS,

        # Campaign lifecycle (admin only)
        PermissionEnum.LAUNCH_ASSESSMENT,
        PermissionEnum.CLOSE_ASSESSMENT,

        # Dashboard Permissions
        PermissionEnum.VIEW_DASHBOARD,
        PermissionEnum.VIEW_ASSETS,
        PermissionEnum.VIEW_VULNERABILITIES,
        PermissionEnum.VIEW_INFRASTRUCTURE_MAP,
        PermissionEnum.MANAGE_DASHBOARD_ACCESS,

        # Member Management
        PermissionEnum.VIEW_MEMBERS,
        PermissionEnum.MANAGE_MEMBERS,
        PermissionEnum.GRANT_PERMISSIONS,
    ],
    "org_member": [
        PermissionEnum.PARTICIPATE_IN_ASSESSMENT,
        PermissionEnum.VIEW_ASSIGNED_ASSETS_ONLY,

        # Assessment Permissions (limited)
        PermissionEnum.VIEW_OWN_SESSIONS,
        PermissionEnum.VIEW_OWN_SCORE,
        PermissionEnum.VIEW_ASSETS,

        # Dashboard Permissions (if granted)
        # VIEW_DASHBOARD can be granted by admin
    ]
}


def get_role_permissions(role: str) -> list[PermissionEnum]:
    """Get default permissions for a role"""
    return ROLE_PERMISSIONS.get(role, [])


PERMISSION_ALIASES = {
    PermissionEnum.VIEW_DASHBOARD: PermissionEnum.VIEW_ORG_DASHBOARD,
    PermissionEnum.VIEW_ORG_TOTAL_SCORE: PermissionEnum.VIEW_FINAL_COMPLIANCE_SCORE,
    PermissionEnum.VIEW_ASSETS: PermissionEnum.VIEW_ALL_ASSETS,
    PermissionEnum.VIEW_OWN_SESSIONS: PermissionEnum.PARTICIPATE_IN_ASSESSMENT,
    PermissionEnum.GRANT_PERMISSIONS: PermissionEnum.MANAGE_PERMISSIONS,
    PermissionEnum.MANAGE_MEMBERS: PermissionEnum.MANAGE_USERS,
}


def has_permission(user_role: str, user_permissions: list[str], required_permission: PermissionEnum) -> bool:
    """
    Check if user has a specific permission.
    Checks both role-based and user-specific permissions.
    """
    # Get role-based permissions
    role_perms = get_role_permissions(user_role)

    # Check if permission is in role permissions
    if required_permission in role_perms:
        return True

    candidate_values = {required_permission.value}
    alias = PERMISSION_ALIASES.get(required_permission)
    if alias:
        candidate_values.add(alias.value)

    # Check if permission is in user-specific permissions
    if user_permissions and any(permission in user_permissions for permission in candidate_values):
        return True

    return False
