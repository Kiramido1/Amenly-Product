#!/usr/bin/env python3
"""
Ingest Preprocessed Chunks into Qdrant
Load all chunk files from clean data directory into Qdrant vector database
"""

import asyncio
import json
import sys
from pathlib import Path
from typing import List, Dict, Any
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from rich.panel import Panel
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import settings
from app.ai.llm.ollama_service import get_ollama_service

console = Console()


async def load_chunks_from_file(file_path: Path) -> List[Dict[str, Any]]:
    """Load chunks from a JSONL file"""
    chunks = []
    with file_path.open("r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                chunk = json.loads(line)
                chunks.append(chunk)
    return chunks


async def generate_embeddings_batch(texts: List[str], batch_size: int = 32) -> List[List[float]]:
    """Generate embeddings for a batch of texts"""
    ollama = get_ollama_service()
    embeddings = await ollama.embed_batch(texts, batch_size=batch_size)
    return embeddings


async def ingest_to_qdrant(
    collection_name: str = "compliance_frameworks",
    data_dir: Path = None,
    batch_size: int = 32,
    recreate_collection: bool = True
):
    """
    Ingest all chunks into Qdrant
    
    Args:
        collection_name: Name of Qdrant collection
        data_dir: Directory containing chunk files
        batch_size: Batch size for embedding generation
        recreate_collection: Whether to recreate collection if exists
    """
    console.print(Panel.fit(
        "[bold cyan]Qdrant Ingestion Pipeline[/bold cyan]\n"
        "Loading preprocessed chunks into vector database",
        border_style="cyan"
    ))
    
    # Setup paths
    if data_dir is None:
        data_dir = Path(__file__).parent.parent / "clean data" / "clean data" / "processed" / "chunks"
    
    if not data_dir.exists():
        console.print(f"[red]❌ Data directory not found: {data_dir}[/red]")
        return False
    
    # Get all chunk files
    chunk_files = list(data_dir.glob("*.jsonl"))
    console.print(f"[cyan]Found {len(chunk_files)} chunk files[/cyan]\n")
    
    if len(chunk_files) == 0:
        console.print("[red]❌ No chunk files found[/red]")
        return False
    
    # Connect to Qdrant
    qdrant_url = getattr(settings, "QDRANT_URL", "http://localhost:6333")
    console.print(f"[cyan]Connecting to Qdrant: {qdrant_url}[/cyan]")
    
    client = QdrantClient(url=qdrant_url)
    
    # Check if collection exists
    collections = client.get_collections()
    collection_exists = any(col.name == collection_name for col in collections.collections)
    
    if collection_exists:
        if recreate_collection:
            console.print(f"[yellow]⚠️  Collection '{collection_name}' exists. Deleting...[/yellow]")
            client.delete_collection(collection_name)
            collection_exists = False
        else:
            console.print(f"[yellow]⚠️  Collection '{collection_name}' exists. Appending data...[/yellow]")
    
    # Create collection if needed
    if not collection_exists:
        console.print(f"[cyan]Creating collection '{collection_name}'...[/cyan]")
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=768,  # nomic-embed-text dimension
                distance=Distance.COSINE
            )
        )
        console.print("[green]✅ Collection created[/green]\n")
    
    # Load all chunks
    console.print("[cyan]Loading chunks from files...[/cyan]")
    all_chunks = []
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console
    ) as progress:
        task = progress.add_task("Loading files...", total=len(chunk_files))
        
        for chunk_file in chunk_files:
            chunks = await load_chunks_from_file(chunk_file)
            all_chunks.extend(chunks)
            progress.update(task, advance=1)
    
    console.print(f"[green]✅ Loaded {len(all_chunks)} chunks[/green]\n")
    
    # Generate embeddings
    console.print("[cyan]Generating embeddings...[/cyan]")
    texts = [chunk["text"] for chunk in all_chunks]
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task("Generating embeddings...", total=None)
        embeddings = await generate_embeddings_batch(texts, batch_size=batch_size)
        progress.update(task, completed=True)
    
    console.print(f"[green]✅ Generated {len(embeddings)} embeddings[/green]\n")
    
    # Prepare points for Qdrant
    console.print("[cyan]Preparing points for Qdrant...[/cyan]")
    points = []
    
    for i, (chunk, embedding) in enumerate(zip(all_chunks, embeddings)):
        # Create payload with all metadata
        payload = {
            "chunk_id": chunk.get("chunk_id"),
            "text": chunk.get("text"),
            "framework": chunk.get("framework", "").lower(),
            "relative_path": chunk.get("relative_path"),
            "source_file": chunk.get("relative_path"),
            "unit_number": chunk.get("unit_number"),
            "page_number": chunk.get("unit_number"),
            "word_count": chunk.get("word_count"),
            "section": chunk.get("section"),
            "control_id": chunk.get("control_id"),
        }
        
        point = PointStruct(
            id=i,
            vector=embedding,
            payload=payload
        )
        points.append(point)
    
    console.print(f"[green]✅ Prepared {len(points)} points[/green]\n")
    
    # Upload to Qdrant in batches
    console.print("[cyan]Uploading to Qdrant...[/cyan]")
    upload_batch_size = 100
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console
    ) as progress:
        task = progress.add_task("Uploading...", total=len(points))
        
        for i in range(0, len(points), upload_batch_size):
            batch = points[i:i + upload_batch_size]
            client.upsert(
                collection_name=collection_name,
                points=batch
            )
            progress.update(task, advance=len(batch))
    
    console.print(f"[green]✅ Upload complete![/green]\n")
    
    # Verify
    collection_info = client.get_collection(collection_name)
    console.print(Panel.fit(
        f"[bold green]✅ Ingestion Complete![/bold green]\n\n"
        f"Collection: {collection_name}\n"
        f"Vectors: {collection_info.vectors_count}\n"
        f"Points: {collection_info.points_count}",
        border_style="green"
    ))
    
    return True


async def main():
    """Main ingestion function"""
    try:
        success = await ingest_to_qdrant(
            collection_name="compliance_frameworks",
            batch_size=32,
            recreate_collection=True
        )
        
        if success:
            console.print("\n[bold green]🎉 Ready to query RAG system![/bold green]")
            sys.exit(0)
        else:
            console.print("\n[bold red]❌ Ingestion failed[/bold red]")
            sys.exit(1)
            
    except KeyboardInterrupt:
        console.print("\n[yellow]Ingestion interrupted by user[/yellow]")
        sys.exit(1)
    except Exception as e:
        console.print(f"\n[red]Fatal error: {e}[/red]")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
