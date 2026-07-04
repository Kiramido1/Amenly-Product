#!/usr/bin/env python
"""
Web scraper that ingests full public framework/regulation text into the Qdrant
RAG store. Currently scrapes the complete GDPR (all articles) from the public
reproduction at gdpr-info.eu, then chunks/embeds/upserts the same way as
ingest_frameworks.py (PUBLIC org scope, idempotent uuid5 ids).

Usage:
    python scripts/scrape_web.py                 # scrape + ingest GDPR articles
    python scripts/scrape_web.py --max-article 99

Only scrape sources you are licensed to store. GDPR is official EU law (public).
"""
import argparse
import asyncio
import re
import sys
import uuid
from pathlib import Path

import httpx
import lxml.html
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

sys.path.insert(0, str(Path(__file__).parent))
from ingest_frameworks import COLLECTION, EMBED_DIM, NAMESPACE, chunk_text  # noqa: E402

from app.ai.embeddings import get_embedding_service  # noqa: E402
from app.core.config import settings  # noqa: E402

GDPR_ART_URL = "https://gdpr-info.eu/art-{n}-gdpr/"
_FOOTER_MARKERS = ("Suggested citation", "GDPR Cookie", "Report error", "Flexible Compliance")


def _extract_article(html: str) -> tuple[str, str]:
    doc = lxml.html.fromstring(html)
    title = " ".join(t.strip() for t in doc.xpath("//h1//text()") if t.strip())
    ec = doc.xpath('//div[contains(@class,"entry-content")]')
    if not ec:
        return title, ""
    text = ec[0].text_content()
    for marker in _FOOTER_MARKERS:
        idx = text.find(marker)
        if idx > 0:
            text = text[:idx]
    text = re.sub(r"\n{2,}", "\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text).strip()
    return title, text


async def main(max_article: int) -> None:
    emb = get_embedding_service()
    client = QdrantClient(url=settings.QDRANT_URL)
    if not client.collection_exists(COLLECTION):
        client.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=EMBED_DIM, distance=Distance.COSINE),
        )

    points: list[PointStruct] = []
    scraped = 0
    with httpx.Client(timeout=25, follow_redirects=True,
                      headers={"User-Agent": "Amenly-Research/1.0"}) as http:
        for n in range(1, max_article + 1):
            try:
                resp = http.get(GDPR_ART_URL.format(n=n))
                if resp.status_code != 200:
                    continue
                title, body = _extract_article(resp.text)
                if not body or len(body) < 60:
                    continue
            except Exception as exc:  # noqa: BLE001
                print(f"  art {n}: fetch error {exc}")
                continue

            scraped += 1
            for i, chunk in enumerate(chunk_text(body)):
                vec = await emb.embed_query(chunk)
                pid = str(uuid.uuid5(NAMESPACE, f"GDPR:Art. {n}:{i}"))
                points.append(PointStruct(
                    id=pid, vector=vec,
                    payload={
                        "text": chunk, "framework": "gdpr",
                        "section": title or f"GDPR Article {n}",
                        "control_id": f"Art. {n}",
                        "source_file": "GDPR (Regulation EU 2016/679)",
                        "source_url": GDPR_ART_URL.format(n=n),
                        "page_number": None, "organization_id": "PUBLIC",
                    },
                ))

    for start in range(0, len(points), 64):
        client.upsert(collection_name=COLLECTION, points=points[start:start + 64])

    total = client.get_collection(COLLECTION).points_count
    print(f"Scraped {scraped} GDPR articles -> {len(points)} chunks.")
    print(f"Collection '{COLLECTION}' now holds {total} points.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--max-article", type=int, default=99)
    args = ap.parse_args()
    asyncio.run(main(args.max_article))
