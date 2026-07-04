#!/usr/bin/env python3
"""
Create premetions (role permissions) table and populate with org_admin & org_member permissions
"""

import asyncio
import uuid
from datetime import datetime
from sqlalchemy import text
from app.database.session import AsyncSessionLocal


# Permissions for org_admin
ORG_ADMIN_PERMISSIONS = [
    "assessment.start",
    "assessment.view_all",
    "assessment.framework.select",
    "assessment.score.view_all",
    "chat.view_all",
    "chat.export",
    "chat.delete",
    "dashboard.view_org",
    "dashboard.assets.view",
    "dashboard.vulnerabilities.view",
    "dashboard.risk.view",
    "dashboard.analytics.view",
    "dashboard.compliance.view",
    "assets.view_all",
    "assets.manage",
    "vulnerabilities.view_all",
    "vulnerabilities.manage",
    "frameworks.view",
    "frameworks.assign",
    "frameworks.manage",
    "reports.view_org",
    "reports.export",
    "members.view",
    "member.invite",
    "member.remove",
    "member.permissions.manage",
    "member.roles.manage",
    "sessions.view_all",
    "environment.view",
    "environment.edit",
]

# Permissions for org_member
ORG_MEMBER_PERMISSIONS = [
    "assessment.view_own",
    "assessment.score.view_own",
    "chat.view_own",
    "dashboard.view_own",
    "assets.view_own",
    "vulnerabilities.view_own",
    "frameworks.view",
    "reports.view_own",
    "sessions.view_own",
    "risk.view_own",
    "ai_recommendations.view_own",
    "compliance.view_own",
]


async def setup_premetions():
    print("=" * 60)
    print("SETTING UP PREMETIONS TABLE")
    print("=" * 60)

    async with AsyncSessionLocal() as db:
        # Drop old table if exists
        await db.execute(text("DROP TABLE IF EXISTS premetions"))
        print("\n✓ Dropped old premetions table (if existed)")

        # Create new table
        await db.execute(text("""
            CREATE TABLE premetions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                role VARCHAR(50) NOT NULL,
                permission VARCHAR(200) NOT NULL,
                description TEXT,
                category VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(role, permission)
            )
        """))
        print("✓ Created premetions table")

        # Create index for faster lookups
        await db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_premetions_role ON premetions(role)
        """))
        await db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_premetions_permission ON premetions(permission)
        """))
        print("✓ Created indexes")

        # Insert org_admin permissions
        for perm in ORG_ADMIN_PERMISSIONS:
            # Determine category from permission name
            category = perm.split(".")[0] if "." in perm else "general"
            await db.execute(
                text("""
                    INSERT INTO premetions (id, role, permission, description, category)
                    VALUES (:id, :role, :permission, :description, :category)
                    ON CONFLICT (role, permission) DO NOTHING
                """),
                {
                    "id": uuid.uuid4(),
                    "role": "org_admin",
                    "permission": perm,
                    "description": f"Permission to {perm.replace('.', ' ').replace('_', ' ')}",
                    "category": category
                }
            )
        print(f"✓ Inserted {len(ORG_ADMIN_PERMISSIONS)} org_admin permissions")

        # Insert org_member permissions
        for perm in ORG_MEMBER_PERMISSIONS:
            category = perm.split(".")[0] if "." in perm else "general"
            await db.execute(
                text("""
                    INSERT INTO premetions (id, role, permission, description, category)
                    VALUES (:id, :role, :permission, :description, :category)
                    ON CONFLICT (role, permission) DO NOTHING
                """),
                {
                    "id": uuid.uuid4(),
                    "role": "org_member",
                    "permission": perm,
                    "description": f"Permission to {perm.replace('.', ' ').replace('_', ' ')}",
                    "category": category
                }
            )
        print(f"✓ Inserted {len(ORG_MEMBER_PERMISSIONS)} org_member permissions")

        await db.commit()

    # Verify
    print("\n" + "=" * 60)
    print("VERIFICATION")
    print("=" * 60)

    async with AsyncSessionLocal() as db:
        result = await db.execute(text("SELECT COUNT(*) FROM premetions"))
        total = result.scalar()

        result = await db.execute(text("SELECT role, COUNT(*) FROM premetions GROUP BY role"))
        rows = result.all()

        print(f"\nTotal permissions: {total}")
        for row in rows:
            print(f"  {row[0]}: {row[1]} permissions")

        # Show sample
        print("\n--- org_admin sample ---")
        result = await db.execute(
            text("SELECT permission FROM premetions WHERE role='org_admin' LIMIT 10")
        )
        for row in result.all():
            print(f"  • {row[0]}")

        print("\n--- org_member sample ---")
        result = await db.execute(
            text("SELECT permission FROM premetions WHERE role='org_member' LIMIT 10")
        )
        for row in result.all():
            print(f"  • {row[0]}")


if __name__ == "__main__":
    asyncio.run(setup_premetions())
    print("\n" + "=" * 60)
    print("✅ PREMETIONS TABLE READY!")
    print("=" * 60)
