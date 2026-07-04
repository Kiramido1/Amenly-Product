"""
Seed default permissions into the database
Run this after migrations to set up the permission system
"""
import asyncio
import uuid
from sqlalchemy import select, Column, String, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base
from datetime import datetime
from app.database.session import AsyncSessionLocal

# Define minimal models just for seeding
Base = declarative_base()

class PermissionModel(Base):
    """Permission definitions"""
    __tablename__ = "permissions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(String(500), nullable=True)
    category = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class RolePermission(Base):
    """Role to permission mapping"""
    __tablename__ = "role_permissions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role = Column(String(50), nullable=False)
    permission_id = Column(UUID(as_uuid=True), ForeignKey("permissions.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

# Default permissions with categories
DEFAULT_PERMISSIONS = [
    # Assessment permissions
    ("start_assessment", "Create and start new assessments", "assessment"),
    ("participate_in_assessment", "Participate in assigned assessments", "assessment"),
    ("view_assessment_results", "View assessment results", "assessment"),
    ("view_own_sessions", "View own assessment sessions", "assessment"),
    ("view_all_sessions", "View all organization assessment sessions", "assessment"),
    
    # Dashboard permissions
    ("view_org_dashboard", "View organization-wide dashboard", "dashboard"),
    ("view_personal_dashboard", "View personal dashboard", "dashboard"),
    ("view_dashboard", "View dashboard", "dashboard"),
    
    # Asset permissions
    ("view_all_assets", "View all organization assets", "assets"),
    ("view_assigned_assets_only", "View only assigned assets", "assets"),
    ("view_assets", "View assets", "assets"),
    
    # Compliance permissions
    ("view_final_compliance_score", "View final compliance scores", "compliance"),
    ("view_personal_compliance", "View personal compliance data", "compliance"),
    ("view_org_total_score", "View organization total score", "compliance"),
    ("view_own_score", "View own score", "compliance"),
    ("view_all_scores", "View all scores", "compliance"),
    
    # Admin permissions
    ("manage_permissions", "Manage user permissions", "admin"),
    ("manage_users", "Manage organization users", "admin"),
    ("manage_frameworks", "Manage compliance frameworks", "admin"),
    ("manage_members", "Manage members", "admin"),
    ("grant_permissions", "Grant permissions to users", "admin"),
    
    # Infrastructure permissions
    ("view_infrastructure_map", "View infrastructure map", "infrastructure"),
    ("view_vulnerabilities", "View vulnerabilities", "infrastructure"),
    
    # Framework permissions
    ("select_framework", "Select compliance framework", "framework"),
    
    # Dashboard access
    ("manage_dashboard_access", "Manage dashboard access", "dashboard"),
]

# Role to permission mapping
ROLE_PERMISSION_MAPPING = {
    "org_admin": [
        "start_assessment",
        "view_assessment_results",
        "view_own_sessions",
        "view_all_sessions",
        "view_org_dashboard",
        "view_all_assets",
        "view_final_compliance_score",
        "view_org_total_score",
        "view_all_scores",
        "manage_permissions",
        "manage_users",
        "manage_frameworks",
        "manage_members",
        "grant_permissions",
        "view_infrastructure_map",
        "view_vulnerabilities",
        "select_framework",
        "manage_dashboard_access",
        "view_dashboard",
        "view_assets",
    ],
    "org_member": [
        "participate_in_assessment",
        "view_personal_dashboard",
        "view_assigned_assets_only",
        "view_personal_compliance",
        "view_own_sessions",
        "view_own_score",
    ],
}


async def seed_permissions():
    """Seed permissions and role permissions"""
    print("🌱 Seeding permissions...")
    
    async with AsyncSessionLocal() as db:
        try:
            # Create permissions
            permission_map = {}
            for name, description, category in DEFAULT_PERMISSIONS:
                # Check if permission already exists
                result = await db.execute(select(PermissionModel).filter_by(name=name))
                existing = result.scalar_one_or_none()
                
                if existing:
                    print(f"  ✓ Permission '{name}' already exists")
                    permission_map[name] = existing
                    continue
                
                permission = PermissionModel(
                    id=uuid.uuid4(),
                    name=name,
                    description=description,
                    category=category
                )
                db.add(permission)
                permission_map[name] = permission
                print(f"  + Created permission: {name}")
            
            await db.commit()
            print(f"✓ Created {len(permission_map)} permissions")
            
            # Create role permissions
            print("\n🔐 Seeding role permissions...")
            for role, permission_names in ROLE_PERMISSION_MAPPING.items():
                added_count = 0
                for perm_name in permission_names:
                    if perm_name not in permission_map:
                        print(f"  ⚠ Warning: Permission '{perm_name}' not found for role '{role}'")
                        continue
                    
                    try:
                        role_perm = RolePermission(
                            id=uuid.uuid4(),
                            role=role,
                            permission_id=permission_map[perm_name].id
                        )
                        db.add(role_perm)
                        added_count += 1
                    except Exception:
                        # Already exists, skip
                        pass
                
                print(f"  ✓ Processed {len(permission_names)} permissions for role '{role}' ({added_count} new)")
            
            await db.commit()
            print("\n✅ Permission seeding complete!")
            
        except Exception as e:
            print(f"\n❌ Error seeding permissions: {e}")
            await db.rollback()
            raise


def main():
    """Main execution"""
    asyncio.run(seed_permissions())


if __name__ == "__main__":
    main()
