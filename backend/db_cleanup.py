#!/usr/bin/env python3
"""
DB Cleanup & Professional Setup
- Remove test users/orgs
- Rename premetions → permissions  
- Add proper indexes
- Clean orphaned records
"""

import asyncio
from sqlalchemy import text
from app.database.session import AsyncSessionLocal


async def cleanup():
    print("=" * 70)
    print("DATABASE CLEANUP & PROFESSIONAL SETUP")
    print("=" * 70)

    async with AsyncSessionLocal() as db:
        # 1. Clean test users and their data
        print("\n## 1. REMOVING TEST USERS")

        # Find test user IDs
        result = await db.execute(text("""
            SELECT id, email, organization_id FROM users 
            WHERE email LIKE '%autoperm%' 
               OR email LIKE '%test.com%' 
               OR email LIKE '%example.%'
               OR email LIKE '%qa_test%'
        """))
        test_users = result.mappings().all()
        print(f"   Found {len(test_users)} test users to remove")

        test_user_ids = [str(u['id']) for u in test_users]
        test_org_ids = list(set([str(u['organization_id']) for u in test_users if u['organization_id']]))

        if test_user_ids:
            # Remove from user_premetions
            for uid in test_user_ids:
                await db.execute(text(f"DELETE FROM user_premetions WHERE user_id = '{uid}'"))
            print(f"   ✓ Cleaned user_premetions")

            # Remove users
            for uid in test_user_ids:
                await db.execute(text(f"DELETE FROM users WHERE id = '{uid}'"))
            print(f"   ✓ Deleted {len(test_user_ids)} test users")

        # 2. Clean test organizations (that have no users now)
        print("\n## 2. CLEANING ORPHANED ORGANIZATIONS")
        result = await db.execute(text("""
            DELETE FROM organizations 
            WHERE id NOT IN (SELECT DISTINCT organization_id FROM users WHERE organization_id IS NOT NULL)
        """))
        print(f"   ✓ Deleted orphaned organizations")

        # 3. Rename premetions → permissions
        print("\n## 3. RENAMING premetions → permissions")

        # Check if permissions table exists
        result = await db.execute(text("""
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' AND tablename = 'permissions'
        """))
        if not result.scalar():
            # Rename table
            await db.execute(text("ALTER TABLE premetions RENAME TO permissions"))
            # Rename indexes
            await db.execute(text("ALTER INDEX IF EXISTS idx_premetions_role RENAME TO idx_permissions_role"))
            await db.execute(text("ALTER INDEX IF EXISTS idx_premetions_permission RENAME TO idx_permissions_permission"))
            print("   ✓ Renamed premetions → permissions")
        else:
            print("   ⚠ permissions table already exists")

        # 4. Create proper role_permissions junction table
        print("\n## 4. CREATING role_permissions TABLE")
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS role_permissions (
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
        await db.execute(text("CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role)"))
        await db.execute(text("CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON role_permissions(permission)"))
        print("   ✓ Created role_permissions table")

        # Copy data from permissions to role_permissions
        result = await db.execute(text("SELECT COUNT(*) FROM role_permissions"))
        if result.scalar() == 0:
            await db.execute(text("""
                INSERT INTO role_permissions (id, role, permission, description, category)
                SELECT id, role, permission, description, category FROM permissions
                ON CONFLICT DO NOTHING
            """))
            print("   ✓ Copied data to role_permissions")

        # 5. Add missing indexes
        print("\n## 5. ADDING INDEXES")
        indexes = [
            ("users", "role", "idx_users_role"),
            ("users", "is_active", "idx_users_active"),
            ("documents", "organization_id", "idx_docs_org"),
            ("document_chunks", "document_id", "idx_chunks_doc"),
            ("frameworks", "type", "idx_frameworks_type"),
            ("assets", "organization_id", "idx_assets_org"),
            ("departments", "organization_id", "idx_depts_org"),
            ("positions", "department_id", "idx_positions_dept"),
        ]
        for table, column, idx_name in indexes:
            try:
                await db.execute(text(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table}({column})"))
                print(f"   ✓ {idx_name} on {table}({column})")
            except Exception as e:
                print(f"   ⚠ {idx_name}: {e}")

        # 6. Clean orphaned user_premetions
        print("\n## 6. CLEANING ORPHANED user_premetions")
        result = await db.execute(text("""
            DELETE FROM user_premetions 
            WHERE user_id NOT IN (SELECT id FROM users)
        """))
        print("   ✓ Removed orphaned permissions")

        await db.commit()

    # Verification
    print("\n" + "=" * 70)
    print("VERIFICATION")
    print("=" * 70)

    async with AsyncSessionLocal() as db:
        tables = ['users', 'organizations', 'permissions', 'role_permissions',
                  'user_premetions', 'documents', 'document_chunks', 'frameworks']
        for t in tables:
            r = await db.execute(text(f'SELECT COUNT(*) FROM "{t}"'))
            print(f"   {t:<30} {r.scalar():>6}")

    print("\n" + "=" * 70)
    print("✅ CLEANUP COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(cleanup())
