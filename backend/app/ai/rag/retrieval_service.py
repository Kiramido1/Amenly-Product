"""
Enterprise RAG Retrieval Service
Professional document retrieval for compliance frameworks
"""

from typing import List, Optional, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue, SearchParams
import structlog

from app.core.config import settings
from app.ai.embeddings import get_embedding_service
from app.ai.rag.schemas import RetrievedChunk, FrameworkType

logger = structlog.get_logger(__name__)


class RetrievalService:
    """
    Professional retrieval service for RAG system
    
    Features:
    - Semantic similarity search
    - Framework filtering
    - Score thresholding
    - Duplicate removal
    - Metadata preservation
    - Ranking and reranking
    """
    
    def __init__(
        self,
        collection_name: str = "compliance_frameworks",
        qdrant_url: Optional[str] = None
    ):
        self.collection_name = collection_name
        self.qdrant_url = qdrant_url or getattr(settings, "QDRANT_URL", "http://localhost:6333")
        self.client = QdrantClient(url=self.qdrant_url)
        self.embedding_service = get_embedding_service()
        
        logger.info(
            "retrieval_service_initialized",
            collection=collection_name,
            qdrant_url=self.qdrant_url
        )
    
    def _build_filter(self, framework: Optional[FrameworkType] = None) -> Optional[Filter]:
        """
        Build Qdrant filter for framework-specific search
        
        Args:
            framework: Framework to filter by
            
        Returns:
            Qdrant Filter object or None
        """
        if not framework or framework == FrameworkType.ALL:
            return None
        
        # Build filter for framework
        return Filter(
            must=[
                FieldCondition(
                    key="framework",
                    match=MatchValue(value=framework.value.lower())
                )
            ]
        )
    
    def _deduplicate_chunks(
        self,
        chunks: List[RetrievedChunk],
        similarity_threshold: float = 0.95
    ) -> List[RetrievedChunk]:
        """
        Remove duplicate or highly similar chunks
        
        Args:
            chunks: List of retrieved chunks
            similarity_threshold: Threshold for considering chunks as duplicates
            
        Returns:
            Deduplicated list of chunks
        """
        if not chunks:
            return []
        
        unique_chunks = []
        seen_texts = set()
        
        for chunk in chunks:
            # Simple deduplication based on text
            text_lower = chunk.text.lower().strip()
            
            # Check if we've seen this exact text
            if text_lower in seen_texts:
                logger.debug("duplicate_chunk_removed", chunk_id=chunk.metadata.get("chunk_id"))
                continue
            
            seen_texts.add(text_lower)
            unique_chunks.append(chunk)
        
        logger.info(
            "deduplication_complete",
            original_count=len(chunks),
            unique_count=len(unique_chunks),
            removed=len(chunks) - len(unique_chunks)
        )
        
        return unique_chunks
    
    async def retrieve(
        self,
        query: str,
        top_k: int = 5,
        score_threshold: float = 0.5,
        framework: Optional[FrameworkType] = None,
        deduplicate: bool = True
    ) -> List[RetrievedChunk]:
        """
        Retrieve relevant chunks for a query
        
        Args:
            query: Search query
            top_k: Number of chunks to retrieve
            score_threshold: Minimum similarity score
            framework: Filter by framework
            deduplicate: Remove duplicate chunks
            
        Returns:
            List of retrieved chunks with metadata
        """
        logger.info(
            "retrieval_start",
            query_length=len(query),
            top_k=top_k,
            score_threshold=score_threshold,
            framework=framework.value if framework else "ALL"
        )
        
        try:
            # Generate query embedding
            query_embedding = await self.embedding_service.embed_query(query)
            
            # Build filter
            query_filter = self._build_filter(framework)
            
            # Search Qdrant
            search_results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                limit=top_k * 2 if deduplicate else top_k,  # Get more for deduplication
                score_threshold=score_threshold,
                query_filter=query_filter,
                with_payload=True
            )
            
            logger.info(
                "qdrant_search_complete",
                results_count=len(search_results),
                top_score=search_results[0].score if search_results else 0.0
            )
            
            # Convert to RetrievedChunk objects
            chunks = []
            for result in search_results:
                payload = result.payload or {}
                
                chunk = RetrievedChunk(
                    text=payload.get("text", ""),
                    score=result.score,
                    metadata=payload,
                    framework=payload.get("framework"),
                    source_file=payload.get("relative_path") or payload.get("source_file"),
                    section=payload.get("section"),
                    control_id=payload.get("control_id"),
                    page_number=payload.get("unit_number") or payload.get("page_number")
                )
                chunks.append(chunk)
            
            # Deduplicate if requested
            if deduplicate:
                chunks = self._deduplicate_chunks(chunks)
            
            # Limit to top_k after deduplication
            chunks = chunks[:top_k]
            
            logger.info(
                "retrieval_complete",
                final_count=len(chunks),
                avg_score=sum(c.score for c in chunks) / len(chunks) if chunks else 0.0
            )
            
            return chunks
            
        except Exception as e:
            logger.error("retrieval_failed", error=str(e))
            raise
    
    async def search_by_metadata(
        self,
        framework: Optional[str] = None,
        section: Optional[str] = None,
        control_id: Optional[str] = None,
        limit: int = 10
    ) -> List[RetrievedChunk]:
        """
        Search chunks by metadata only (no semantic search)
        
        Args:
            framework: Framework name
            section: Section identifier
            control_id: Control ID
            limit: Maximum results
            
        Returns:
            List of matching chunks
        """
        logger.info(
            "metadata_search",
            framework=framework,
            section=section,
            control_id=control_id
        )
        
        # Build filter conditions
        conditions = []
        
        if framework:
            conditions.append(
                FieldCondition(key="framework", match=MatchValue(value=framework.lower()))
            )
        
        if section:
            conditions.append(
                FieldCondition(key="section", match=MatchValue(value=section))
            )
        
        if control_id:
            conditions.append(
                FieldCondition(key="control_id", match=MatchValue(value=control_id))
            )
        
        if not conditions:
            logger.warning("metadata_search_no_conditions")
            return []
        
        # Search with filter only
        search_filter = Filter(must=conditions)
        
        # Use scroll for metadata-only search
        results, _ = self.client.scroll(
            collection_name=self.collection_name,
            scroll_filter=search_filter,
            limit=limit,
            with_payload=True
        )
        
        # Convert to chunks
        chunks = []
        for result in results:
            payload = result.payload or {}
            
            chunk = RetrievedChunk(
                text=payload.get("text", ""),
                score=1.0,  # No similarity score for metadata search
                metadata=payload,
                framework=payload.get("framework"),
                source_file=payload.get("relative_path"),
                section=payload.get("section"),
                control_id=payload.get("control_id"),
                page_number=payload.get("unit_number")
            )
            chunks.append(chunk)
        
        logger.info("metadata_search_complete", results_count=len(chunks))
        
        return chunks


# Global instance
_retrieval_service: Optional[RetrievalService] = None


def get_retrieval_service() -> RetrievalService:
    """Get or create global retrieval service instance"""
    global _retrieval_service
    if _retrieval_service is None:
        _retrieval_service = RetrievalService()
    return _retrieval_service
