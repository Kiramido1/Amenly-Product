#!/usr/bin/env python
"""
Ingest compliance framework / regulation text into the Qdrant RAG store.

Reads a curated corpus (scripts/data/framework_corpus.json) of publicly available
framework text, splits each section into overlapping chunks, embeds them with the
local embedding model (nomic-embed-text), and upserts them into the
`compliance_frameworks` collection with PUBLIC org scope so every tenant can query
them. Point IDs are deterministic (uuid5) so re-running is idempotent.

Usage:
    python scripts/ingest_frameworks.py                 # add/update from corpus
    python scripts/ingest_frameworks.py --recreate      # wipe collection first
    python scripts/ingest_frameworks.py --corpus path.json

Note: Only ingest text you are licensed to store. Copyrighted standards
(ISO/IEC, PCI DSS, COBIT, AICPA) are represented here by publicly available
summaries/control titles with source attribution, not their full proprietary text.
"""
import argparse
import asyncio
import json
import re
import uuid
from pathlib import Path

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from app.ai.embeddings import get_embedding_service
from app.core.config import settings

COLLECTION = "compliance_frameworks"
EMBED_DIM = 768  # nomic-embed-text
NAMESPACE = uuid.UUID("8f6b9d22-0000-4000-a000-616d656e6c79")  # stable namespace for IDs
DEFAULT_CORPUS = Path(__file__).parent / "data" / "framework_corpus.json"


def chunk_text(text: str, max_chars: int = 900, overlap: int = 150) -> list[str]:
    """Split text into overlapping chunks at sentence boundaries."""
    text = text.strip()
    if len(text) <= max_chars:
        return [text]

    sentences = re.split(r"(?<=[.;])\s+", text)
    chunks: list[str] = []
    current = ""
    for sent in sentences:
        if len(current) + len(sent) + 1 <= max_chars:
            current = f"{current} {sent}".strip()
        else:
            if current:
                chunks.append(current)
            # start new chunk with tail overlap of the previous one
            tail = current[-overlap:] if overlap and current else ""
            current = f"{tail} {sent}".strip()
    if current:
        chunks.append(current)
    return chunks


async def main(corpus_path: Path, recreate: bool) -> None:
    corpus = json.loads(corpus_path.read_text(encoding="utf-8"))
    emb = get_embedding_service()
    client = QdrantClient(url=settings.QDRANT_URL)

    exists = client.collection_exists(COLLECTION)
    if recreate or not exists:
        client.recreate_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=EMBED_DIM, distance=Distance.COSINE),
        )
        print(f"{'Recreated' if recreate else 'Created'} collection '{COLLECTION}'.")

    points: list[PointStruct] = []
    per_framework: dict[str, int] = {}
    for doc in corpus:
        fw = doc["framework"]
        fw_lower = fw.lower()
        for sec in doc["sections"]:
            for i, chunk in enumerate(chunk_text(sec["text"])):
                vec = await emb.embed_query(chunk)
                pid = str(uuid.uuid5(NAMESPACE, f"{fw}:{sec['control_id']}:{i}"))
                points.append(PointStruct(
                    id=pid,
                    vector=vec,
                    payload={
                        "text": chunk,
                        "framework": fw_lower,
                        "section": sec["section"],
                        "control_id": sec["control_id"],
                        "source_file": doc["source_file"],
                        "source_url": doc.get("source_url"),
                        "page_number": None,
                        "organization_id": "PUBLIC",
                    },
                ))
                per_framework[fw] = per_framework.get(fw, 0) + 1

    # Upsert in batches.
    for start in range(0, len(points), 64):
        client.upsert(collection_name=COLLECTION, points=points[start:start + 64])

    total = client.get_collection(COLLECTION).points_count
    print(f"Ingested {len(points)} chunks across {len(per_framework)} frameworks:")
    for fw, n in sorted(per_framework.items()):
        print(f"  - {fw}: {n} chunks")
    print(f"Collection '{COLLECTION}' now holds {total} points (dim={EMBED_DIM}).")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Ingest framework corpus into Qdrant.")
    ap.add_argument("--corpus", type=Path, default=DEFAULT_CORPUS)
    ap.add_argument("--recreate", action="store_true", help="Wipe the collection first")
    args = ap.parse_args()
    asyncio.run(main(args.corpus, args.recreate))
