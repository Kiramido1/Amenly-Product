#!/usr/bin/env python
"""
Ingest the full NIST SP 800-53 Rev. 5 control catalog (public domain) into the
Qdrant RAG store from the official OSCAL JSON content. ~324 base controls across
20 families -> hundreds of chunks. framework tag = "nist".

Usage: python scripts/scrape_nist.py
"""
import asyncio
import re
import sys
import uuid
from pathlib import Path

import httpx
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

sys.path.insert(0, str(Path(__file__).parent))
from ingest_frameworks import COLLECTION, EMBED_DIM, NAMESPACE, chunk_text  # noqa: E402

from app.ai.embeddings import get_embedding_service  # noqa: E402
from app.core.config import settings  # noqa: E402

CATALOG_URL = (
    "https://raw.githubusercontent.com/usnistgov/oscal-content/main/"
    "nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json"
)


def _clean(text: str) -> str:
    text = re.sub(r"\{\{\s*insert:\s*param,\s*[^}]+\}\}", "[organization-defined]", text)
    return re.sub(r"\s+", " ", text).strip()


def _prose(parts) -> list[str]:
    out: list[str] = []
    for p in parts or []:
        if p.get("prose"):
            out.append(p["prose"])
        out += _prose(p.get("parts"))
    return out


async def main() -> None:
    emb = get_embedding_service()
    client = QdrantClient(url=settings.QDRANT_URL)
    if not client.collection_exists(COLLECTION):
        client.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=EMBED_DIM, distance=Distance.COSINE),
        )

    catalog = httpx.get(CATALOG_URL, timeout=120, follow_redirects=True).json()["catalog"]
    points: list[PointStruct] = []
    n_controls = 0
    for group in catalog.get("groups", []):
        family = group.get("title", "")
        for ctrl in group.get("controls", []):
            cid = ctrl["id"].upper()
            title = ctrl.get("title", "")
            statement = [p for p in ctrl.get("parts", []) if p.get("name") == "statement"]
            body = _clean(f"{title}. " + " ".join(_prose(statement)))
            if len(body) < 40:
                body = _clean(f"{cid} {title}")
            n_controls += 1
            for i, chunk in enumerate(chunk_text(body)):
                vec = await emb.embed_query(chunk)
                pid = str(uuid.uuid5(NAMESPACE, f"NIST:{cid}:{i}"))
                points.append(PointStruct(
                    id=pid, vector=vec,
                    payload={
                        "text": chunk, "framework": "nist",
                        "section": f"{family}: {title}", "control_id": cid,
                        "source_file": "NIST SP 800-53 Rev. 5",
                        "source_url": "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
                        "page_number": None, "organization_id": "PUBLIC",
                    },
                ))

    for start in range(0, len(points), 64):
        client.upsert(collection_name=COLLECTION, points=points[start:start + 64])

    total = client.get_collection(COLLECTION).points_count
    print(f"Ingested {n_controls} NIST 800-53 controls -> {len(points)} chunks.")
    print(f"Collection '{COLLECTION}' now holds {total} points.")


if __name__ == "__main__":
    asyncio.run(main())
