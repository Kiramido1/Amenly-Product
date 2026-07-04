#!/usr/bin/env python3
"""
Fix Qdrant data issues:
1. Index framework descriptions from DB into Qdrant
2. Fix organization_id from "N/A" to "PUBLIC"
"""

import asyncio
import uuid
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Distance, VectorParams
from sqlalchemy import select, text

from app.database.session import AsyncSessionLocal
from app.models.compliance import Framework
from app.ai.embeddings import get_embedding_service


async def index_framework_descriptions():
    """Index all framework descriptions from PostgreSQL into Qdrant"""
    print("=" * 60)
    print("INDEXING FRAMEWORK DESCRIPTIONS INTO QDRANT")
    print("=" * 60)

    qdrant = QdrantClient(url="http://localhost:6333")
    embedding_service = get_embedding_service()
    collection_name = "compliance_frameworks"

    # Check/create collection
    collections = [c.name for c in qdrant.get_collections().collections]
    if collection_name not in collections:
        print(f"Creating collection: {collection_name}")
        qdrant.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=768, distance=Distance.COSINE)
        )
    else:
        print(f"Collection exists: {collection_name}")

    async with AsyncSessionLocal() as db:
        result = await db.execute(text("SELECT * FROM frameworks"))
        frameworks = result.mappings().all()

    print(f"\nFound {len(frameworks)} frameworks in PostgreSQL")

    points = []
    for fw in frameworks:
        # Build rich text from framework metadata
        fw_text = f"""
Framework: {fw['name']} Version {fw['version']}
Type: {fw['framework_type']}
Category: {fw['category']}
Region: {fw['region']}
Industry: {fw['industry']}
Mandatory: {fw['is_mandatory']}

Description:
{fw['description']}

URL: {fw.get('official_url', 'N/A')}
""".strip()

        # Generate embedding
        embedding = await embedding_service.embed_query(fw_text)

        # Create point
        point_id = str(uuid.uuid4())
        points.append(PointStruct(
            id=point_id,
            vector=embedding,
            payload={
                "text": fw_text,
                "framework": fw['name'].lower().replace(" ", "").replace("-", ""),
                "framework_name": fw['name'],
                "version": fw['version'],
                "organization_id": "PUBLIC",
                "chunk_id": f"{fw['name'].lower().replace(' ', '_')}_desc",
                "source_file": "seeded_from_db",
                "page_number": 1,
                "section": "overview"
            }
        ))
        print(f"  ✓ Prepared: {fw['name']} ({len(fw_text)} chars)")

    if points:
        qdrant.upsert(collection_name=collection_name, points=points)
        print(f"\n✅ Indexed {len(points)} framework descriptions into Qdrant")

    # Show current stats
    info = qdrant.get_collection(collection_name)
    print(f"\n📊 Qdrant Stats:")
    print(f"   Total points: {info.points_count}")
    print(f"   Status: {info.status}")


async def fix_existing_org_ids():
    """Fix organization_id from 'N/A' to 'PUBLIC' for existing points"""
    print("\n" + "=" * 60)
    print("FIXING ORGANIZATION IDs IN EXISTING POINTS")
    print("=" * 60)

    qdrant = QdrantClient(url="http://localhost:6333")
    collection_name = "compliance_frameworks"

    # Scroll through all points and find ones with N/A org_id
    offset = None
    fixed = 0
    total = 0

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

        for point in points:
            total += 1
            payload = point.payload
            org_id = payload.get("organization_id", "N/A")

            if org_id == "N/A" or org_id is None or org_id == "":
                # Fix it
                qdrant.set_payload(
                    collection_name=collection_name,
                    points=[point.id],
                    payload={"organization_id": "PUBLIC"}
                )
                fixed += 1

        offset = result[1]
        if offset is None:
            break

    print(f"   Scanned: {total} points")
    print(f"   Fixed: {fixed} points (N/A → PUBLIC)")
    print(f"   Already OK: {total - fixed} points")


async def main():
    print("\n🔧 Qdrant Data Fix Script")
    print("=" * 60 + "\n")

    await fix_existing_org_ids()
    await index_framework_descriptions()

    print("\n" + "=" * 60)
    print("DONE! Now try your RAG query again.")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
