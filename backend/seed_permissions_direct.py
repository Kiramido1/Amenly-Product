"""
Direct psycopg permission seeding to avoid pgbouncer prepared statement issues
"""
import asyncio
import os
from psycopg import AsyncConnection
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Default permissions with categories
DEFAULT_PERMISSIONS = [
    ("start_assessment", "Create and start new assessments", "assessment"),
    ("participate_in_assessment", "Participate in assigned assessments", "assessment"),
    ("view_assessment_results", "View assessment results", "assessment"),
    ("view_own_sessions", "View own assessment sessions", "assessment"),
    ("view_all_sessions", "View all organization assessment sessions", "assessment"),
    ("view_org_dashboard", "View organization-wide dashboard", "dashboard"),
    ("view_personal_dashboard", "View personal dashboard", "dashboard"),
    ("view_dashboard", "View dashboard", "dashboard"),
    ("view_all_assets", "View all organization assets", "assets"),
    ("view_assigned_assets_only", "View only assigned assets", "assets"),
    ("view_assets", "View assets", "assets"),
    ("view_final_compliance_score", "View final compliance scores", "compliance"),
    ("view_personal_compliance", "View personal compliance data", "compliance"),
    ("view_org_total_score", "View organization total score", "compliance"),
    ("view_own_score", "View own score", "compliance"),
    ("view_all_scores", "View all scores", "compliance"),
    ("manage_permissions", "Manage user permissions", "admin"),
    ("manage_users", "Manage organization users", "admin"),
    ("manage_frameworks", "Manage compliance frameworks", "admin"),
    ("manage_members", "Manage members", "admin"),
    ("grant_permissions", "Grant permissions to users", "admin"),
    ("view_infrastructure_map", "View infrastructure map", "infrastructure"),
    ("view_vulnerabilities", "View vulnerabilities", "infrastructure"),
    ("select_framework", "Select compliance framework", "framework"),
    ("manage_dashboard_access", "Manage dashboard access", "dashboard"),
]

ROLE_PERMISSION_MAPPING = {
    "org_admin": [
        "start_assessment", "view_assessment_results", "view_own_sessions", "view_all_sessions",
        "view_org_dashboard", "view_all_assets", "view_final_compliance_score", "view_org_total_score",
        "view_all_scores", "manage_permissions", "manage_users", "manage_frameworks", "manage_members",
        "grant_permissions", "view_infrastructure_map", "view_vulnerabilities", "select_framework",
        "manage_dashboard_access", "view_dashboard", "view_assets",
    ],
    "org_member": [
        "participate_in_assessment", "view_personal_dashboard", "view_assigned_assets_only",
        "view_personal_compliance", "view_own_sessions", "view_own_score",
    ],
}


async def seed_permissions():
    """Seed permissions using direct psycopg connection"""
    print("🌱 Seeding permissions...")
    
    # Get database URL from environment
    db_url = os.getenv("DATABASE_URL", "")
    if not db_url:
        print("❌ DATABASE_URL not set")
        return
    
    # Convert async URL if needed
    if db_url.startswith("postgresql+asyncpg://"):
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    elif db_url.startswith("postgresql+psycopg://"):
        db_url = db_url.replace("postgresql+psycopg://", "postgresql://")
    
    async with await AsyncConnection.connect(db_url) as conn:
        async with conn.cursor() as cur:
            # Insert permissions
            for name, description, category in DEFAULT_PERMISSIONS:
                await cur.execute(
                    """
                    INSERT INTO permissions (id, name, description, category, created_at)
                    VALUES (gen_random_uuid(), %s, %s, %s, NOW())
                    ON CONFLICT (name) DO NOTHING
                    """,
                    (name, description, category)
                )
                print(f"  ✓ Permission: {name}")
            
            await conn.commit()
            print(f"\n✓ Processed {len(DEFAULT_PERMISSIONS)} permissions")
            
            # Insert role permissions
            print("\n🔐 Seeding role permissions...")
            for role, permission_names in ROLE_PERMISSION_MAPPING.items():
                for perm_name in permission_names:
                    await cur.execute(
                        """
                        INSERT INTO role_permissions (id, role, permission_id, created_at)
                        SELECT gen_random_uuid(), %s, p.id, NOW()
                        FROM permissions p
                        WHERE p.name = %s
                        ON CONFLICT (role, permission_id) DO NOTHING
                        """,
                        (role, perm_name)
                    )
                
                print(f"  ✓ Role '{role}': {len(permission_names)} permissions")
            
            await conn.commit()
            print("\n✅ Permission seeding complete!")


def main():
    asyncio.run(seed_permissions())


if __name__ == "__main__":
    main()
