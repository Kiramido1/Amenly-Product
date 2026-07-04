#!/usr/bin/env python3
"""
Comprehensive Database Audit & Cleanup Script
"""

import asyncio
import uuid
from datetime import datetime
from sqlalchemy import text
from app.database.session import AsyncSessionLocal


async def get_all_tables(db):
    """Get all user tables"""
    result = await db.execute(text("""
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    """))
    return [row[0] for row in result.all()]


async def get_table_count(db, table):
    result = await db.execute(text(f'SELECT COUNT(*) FROM "{table}"'))
    return result.scalar()


async def check_orphaned_users(db):
    """Users without organizations"""
    result = await db.execute(text("""
        SELECT id, email FROM users 
        WHERE organization_id IS NULL OR organization_id NOT IN (SELECT id FROM organizations)
    """))
    return result.mappings().all()


async def check_orphaned_documents(db):
    """Document chunks without documents"""
    result = await db.execute(text("""
        SELECT COUNT(*) FROM document_chunks 
        WHERE document_id NOT IN (SELECT id FROM documents)
    """))
    return result.scalar()


async def check_orphaned_departments(db):
    """Departments without organizations"""
    result = await db.execute(text("""
        SELECT COUNT(*) FROM departments 
        WHERE organization_id NOT IN (SELECT id FROM organizations)
    """))
    return result.scalar()


async def check_orphaned_positions(db):
    """Positions without departments"""
    result = await db.execute(text("""
        SELECT COUNT(*) FROM positions 
        WHERE department_id NOT IN (SELECT id FROM departments)
    """))
    return result.scalar()


async def check_duplicate_emails(db):
    """Duplicate email users"""
    result = await db.execute(text("""
        SELECT email, COUNT(*) as cnt FROM users 
        GROUP BY email HAVING COUNT(*) > 1
    """))
    return result.mappings().all()


async def get_test_users(db):
    """Users that look like test data"""
    patterns = [
        '%test%', '%example%', '%example.com%', '%example.org%',
        '%example.net%', '%first.com%', '%autoperm%', '%qa_test%'
    ]
    test_users = []
    for pattern in patterns:
        result = await db.execute(
            text("SELECT id, email, role FROM users WHERE email ILIKE :p"),
            {"p": pattern}
        )
        test_users.extend(result.mappings().all())
    return test_users


async def check_constraints(db):
    """Check FK constraints"""
    result = await db.execute(text("""
        SELECT
            tc.table_name, kcu.column_name,
            ccu.table_name AS foreign_table,
            ccu.column_name AS foreign_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        ORDER BY tc.table_name
    """))
    return result.all()


async def main():
    print("=" * 70)
    print("DATABASE AUDIT REPORT")
    print("=" * 70)

    async with AsyncSessionLocal() as db:
        # 1. All tables and counts
        print("\n## 1. TABLES & ROW COUNTS")
        tables = await get_all_tables(db)
        total_rows = 0
        for table in tables:
            count = await get_table_count(db, table)
            total_rows += count
            print(f"   {table:<40} {count:>6} rows")
        print(f"   {'TOTAL':<40} {total_rows:>6} rows")

        # 2. Orphaned records
        print("\n## 2. ORPHANED RECORDS")
        orphaned_users = await check_orphaned_users(db)
        print(f"   Users without valid org: {len(orphaned_users)}")

        orphaned_chunks = await check_orphaned_documents(db)
        print(f"   Document chunks without docs: {orphaned_chunks}")

        orphaned_depts = await check_orphaned_departments(db)
        print(f"   Departments without org: {orphaned_depts}")

        orphaned_pos = await check_orphaned_positions(db)
        print(f"   Positions without dept: {orphaned_pos}")

        # 3. Duplicates
        print("\n## 3. DUPLICATES")
        dups = await check_duplicate_emails(db)
        print(f"   Duplicate emails: {len(dups)}")
        for dup in dups:
            print(f"      {dup['email']} ({dup['cnt']} times)")

        # 4. Test users
        print("\n## 4. TEST/DUMMY USERS")
        test_users = await get_test_users(db)
        unique_test = {}
        for u in test_users:
            unique_test[u['email']] = u
        print(f"   Found {len(unique_test)} test users:")
        for email, u in list(unique_test.items())[:20]:
            print(f"      {email} ({u['role']})")

        # 5. Foreign Key Constraints
        print("\n## 5. FOREIGN KEY CONSTRAINTS")
        constraints = await check_constraints(db)
        for c in constraints:
            print(f"   {c[0]}.{c[1]} → {c[2]}.{c[3]}")

        # 6. Permissions Summary
        print("\n## 6. PERMISSIONS TABLES")
        for table in ['premetions', 'user_premetions']:
            try:
                count = await get_table_count(db, table)
                print(f"   {table}: {count} rows")
            except:
                print(f"   {table}: MISSING")

        # 7. Documents & Chunks
        print("\n## 7. DOCUMENTS & CHUNKS")
        docs = await get_table_count(db, 'documents')
        chunks = await get_table_count(db, 'document_chunks')
        print(f"   Documents: {docs}")
        print(f"   Chunks: {chunks}")

        # 8. Frameworks
        print("\n## 8. FRAMEWORKS")
        fw = await get_table_count(db, 'frameworks')
        print(f"   Frameworks: {fw}")

        # 9. RAG Health
        print("\n## 9. RAG DATA (Qdrant)")
        try:
            from qdrant_client import QdrantClient
            qc = QdrantClient(url="http://localhost:6333")
            info = qc.get_collection("compliance_docs")
            print(f"   Qdrant points: {info.points_count}")
        except Exception as e:
            print(f"   Qdrant: {e}")

    print("\n" + "=" * 70)
    print("AUDIT COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
