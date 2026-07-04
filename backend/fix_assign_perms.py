#!/usr/bin/env python3
"""
Fix permission assignment (case-insensitive role matching)
"""

import asyncio
import uuid
from sqlalchemy import text
from app.database.session import AsyncSessionLocal


async def fix_assign():
    print("=" * 60)
    print("FIXING PERMISSION ASSIGNMENT")
    print("=" * 60)

    async with AsyncSessionLocal() as db:
        # Clear existing user_premetions
        await db.execute(text("DELETE FROM user_premetions"))
        print("\n✓ Cleared user_premetions")

        # Get permissions by lowercase role
        result = await db.execute(text("SELECT DISTINCT role, permission FROM premetions"))
        perms = result.mappings().all()

        role_perms = {}
        for p in perms:
            role = p["role"].lower()
            if role not in role_perms:
                role_perms[role] = []
            role_perms[role].append(p["permission"])

        print(f"   org_admin permissions: {len(role_perms.get('org_admin', []))}")
        print(f"   org_member permissions: {len(role_perms.get('org_member', []))}")

        # Get all active users
        result = await db.execute(text("SELECT id, email, role FROM users WHERE is_active = true"))
        users = result.mappings().all()
        print(f"\nFound {len(users)} active users")

        total = 0
        for user in users:
            user_id = str(user["id"])
            role = user["role"].lower()  # Convert ORG_ADMIN → org_admin

            if role not in role_perms:
                print(f"   ⚠ No permissions for role '{role}' ({user['email']})")
                continue

            for perm in role_perms[role]:
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
                total += 1

            print(f"   ✓ {user['email']:<35} ({role}) → {len(role_perms[role])} perms")

        await db.commit()

    print(f"\n{'=' * 60}")
    print(f"✅ Assigned {total} permissions total")
    print(f"{'=' * 60}")


async def verify():
    async with AsyncSessionLocal() as db:
        result = await db.execute(text("SELECT COUNT(*) FROM user_premetions"))
        print(f"\nuser_premetions count: {result.scalar()}")

        result = await db.execute(text("""
            SELECT u.email, u.role, COUNT(up.permission) as c
            FROM users u
            LEFT JOIN user_premetions up ON u.id = up.user_id
            WHERE u.is_active = true
            GROUP BY u.id, u.email, u.role
            LIMIT 10
        """))
        print("\nSample users:")
        for row in result.mappings().all():
            print(f"  {row['email']:<35} ({row['role']}) → {row['c']} perms")


if __name__ == "__main__":
    asyncio.run(fix_assign())
    asyncio.run(verify())
