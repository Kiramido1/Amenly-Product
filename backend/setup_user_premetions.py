#!/usr/bin/env python3
"""
Create user_premetions table + auto-assign permissions to existing users
"""

import asyncio
import uuid
from datetime import datetime
from sqlalchemy import text
from app.database.session import AsyncSessionLocal


async def setup_user_premetions():
    print("=" * 60)
    print("SETTING UP USER_PREMETIONS TABLE")
    print("=" * 60)

    async with AsyncSessionLocal() as db:
        # Drop old if exists
        await db.execute(text("DROP TABLE IF EXISTS user_premetions"))
        print("\n✓ Dropped old user_premetions table")

        # Create table
        await db.execute(text("""
            CREATE TABLE user_premetions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                permission VARCHAR(200) NOT NULL,
                granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, permission)
            )
        """))
        print("✓ Created user_premetions table")

        # Indexes
        await db.execute(text("CREATE INDEX idx_user_premetions_user_id ON user_premetions(user_id)"))
        await db.execute(text("CREATE INDEX idx_user_premetions_permission ON user_premetions(permission)"))
        print("✓ Created indexes")

        await db.commit()


async def assign_permissions_to_users():
    print("\n" + "=" * 60)
    print("AUTO-ASSIGNING PERMISSIONS TO EXISTING USERS")
    print("=" * 60)

    async with AsyncSessionLocal() as db:
        # Get all users with their roles
        result = await db.execute(text("""
            SELECT id, role FROM users WHERE is_active = true
        """))
        users = result.mappings().all()
        print(f"\nFound {len(users)} active users")

        # Get permissions for each role
        result = await db.execute(text("SELECT DISTINCT role, permission FROM premetions"))
        perms = result.mappings().all()

        role_perms = {}
        for p in perms:
            role = p["role"]
            if role not in role_perms:
                role_perms[role] = []
            role_perms[role].append(p["permission"])

        total_assigned = 0
        for user in users:
            user_id = str(user["id"])
            role = user["role"]

            if role not in role_perms:
                print(f"   ⚠ No permissions found for role '{role}' (user {user_id[:8]})")
                continue

            permissions = role_perms[role]
            for perm in permissions:
                await db.execute(
                    text("""
                        INSERT INTO user_premetions (id, user_id, permission)
                        VALUES (:id, :user_id, :permission)
                        ON CONFLICT (user_id, permission) DO NOTHING
                    """),
                    {
                        "id": uuid.uuid4(),
                        "user_id": user_id,
                        "permission": perm
                    }
                )
                total_assigned += 1

            print(f"   ✓ User {user_id[:8]}... ({role}) → {len(permissions)} permissions")

        await db.commit()

    print(f"\n✅ Assigned {total_assigned} total permissions")


async def verify():
    print("\n" + "=" * 60)
    print("VERIFICATION")
    print("=" * 60)

    async with AsyncSessionLocal() as db:
        result = await db.execute(text("SELECT COUNT(*) FROM user_premetions"))
        total = result.scalar()

        result = await db.execute(text("""
            SELECT u.email, u.role, COUNT(up.permission) as perm_count
            FROM users u
            LEFT JOIN user_premetions up ON u.id = up.user_id
            WHERE u.is_active = true
            GROUP BY u.id, u.email, u.role
        """))
        rows = result.mappings().all()

        print(f"\nTotal user_premetions: {total}")
        print("\nPer user:")
        for row in rows:
            print(f"  {row['email']:<35} ({row['role']}) → {row['perm_count']} permissions")


async def main():
    await setup_user_premetions()
    await assign_permissions_to_users()
    await verify()
    print("\n" + "=" * 60)
    print("✅ USER PREMETIONS READY!")
    print("   Any new user will auto-get role permissions on register.")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
