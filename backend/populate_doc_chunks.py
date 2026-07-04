#!/usr/bin/env python3
"""
Populate documents and document_chunks tables from Qdrant data
"""

import asyncio
import json
import uuid
from datetime import datetime
from qdrant_client import QdrantClient
from sqlalchemy import text

from app.database.session import AsyncSessionLocal
from app.models.assets_risks import Document, DocumentChunk


async def populate_from_qdrant():
    print("=" * 60)
    print("POPULATING documents & document_chunks FROM QDRANT")
    print("=" * 60)

    qdrant = QdrantClient(url="http://localhost:6333")
    collection_name = "compliance_frameworks"

    # Get all points from Qdrant
    print("\n▶ Fetching all points from Qdrant...")
    all_points = []
    offset = None
    while True:
        result = qdrant.scroll(
            collection_name=collection_name,
            offset=offset,
            limit=100,
            with_payload=True,
            with_vectors=False
        )
        points = result[0]
        if not points:
            break
        all_points.extend(points)
        offset = result[1]
        if offset is None:
            break

    print(f"   Total points in Qdrant: {len(all_points)}")

    # Group by source_file
    sources = {}
    for point in all_points:
        payload = point.payload
        source = payload.get("source_file", "unknown")
        if source not in sources:
            sources[source] = {
                "framework": payload.get("framework", "unknown"),
                "framework_name": payload.get("framework_name", "Unknown Framework"),
                "chunks": []
            }
        # Handle non-integer unit_number (e.g., "Front Sheet" from Excel)
        unit_num = payload.get("unit_number", 0)
        try:
            chunk_idx = int(unit_num) if isinstance(unit_num, (int, float, str)) and str(unit_num).isdigit() else 0
        except (ValueError, TypeError):
            chunk_idx = 0
        sources[source]["chunks"].append({
            "content": payload.get("text", ""),
            "chunk_index": chunk_idx,
            "page_number": payload.get("page_number", 1),
            "metadata": payload
        })

    print(f"   Unique sources: {len(sources)}")
    for src, data in sources.items():
        print(f"     - {src}: {len(data['chunks'])} chunks ({data['framework']})")

    # Now insert into DB
    async with AsyncSessionLocal() as db:
        total_docs = 0
        total_chunks = 0

        for source_file, data in sources.items():
            # Check if document already exists
            result = await db.execute(
                text("SELECT id FROM documents WHERE filename = :fn"),
                {"fn": source_file}
            )
            existing = result.scalar()

            if existing:
                doc_id = existing
                print(f"   ⚠ Document exists: {source_file}")
            else:
                doc_id = uuid.uuid4()
                now = datetime.utcnow()

                # Get org_id from first user
                result = await db.execute(text("SELECT organization_id FROM users LIMIT 1"))
                org_id = result.scalar() or uuid.uuid4()

                # Insert document
                await db.execute(
                    text("""
                        INSERT INTO documents (id, organization_id, filename, file_type, 
                        s3_key, is_processed, created_at, updated_at)
                        VALUES (:id, :org_id, :filename, :file_type, 
                        :s3_key, :is_processed, :created_at, :updated_at)
                    """),
                    {
                        "id": doc_id,
                        "org_id": org_id,
                        "filename": source_file,
                        "file_type": "application/pdf" if source_file.endswith(".pdf") else "text/plain",
                        "s3_key": source_file,
                        "is_processed": True,
                        "created_at": now,
                        "updated_at": now
                    }
                )
                total_docs += 1
                print(f"   ✓ Created document: {source_file} ({doc_id})")

            # Insert chunks
            for chunk_data in data["chunks"]:
                chunk_id = uuid.uuid4()
                now = datetime.utcnow()

                await db.execute(
                    text("""
                        INSERT INTO document_chunks (id, document_id, content, 
                        chunk_index, metadata_json, created_at, updated_at)
                        VALUES (:id, :doc_id, :content, :chunk_index, 
                        :metadata_json, :created_at, :updated_at)
                    """),
                    {
                        "id": chunk_id,
                        "doc_id": doc_id,
                        "content": chunk_data["content"][:5000],  # Limit size
                        "chunk_index": chunk_data["chunk_index"],
                        "metadata_json": json.dumps(chunk_data["metadata"]),
                        "created_at": now,
                        "updated_at": now
                    }
                )
                total_chunks += 1

        await db.commit()

    print(f"\n{'=' * 60}")
    print(f"✅ DONE!")
    print(f"   Documents created: {total_docs}")
    print(f"   Chunks created: {total_chunks}")
    print(f"{'=' * 60}")


async def verify():
    print("\n▶ Verifying...")
    async with AsyncSessionLocal() as db:
        result = await db.execute(text("SELECT COUNT(*) FROM documents"))
        doc_count = result.scalar()

        result = await db.execute(text("SELECT COUNT(*) FROM document_chunks"))
        chunk_count = result.scalar()

        print(f"   documents table: {doc_count} rows")
        print(f"   document_chunks table: {chunk_count} rows")


async def main():
    await populate_from_qdrant()
    await verify()


if __name__ == "__main__":
    asyncio.run(main())
