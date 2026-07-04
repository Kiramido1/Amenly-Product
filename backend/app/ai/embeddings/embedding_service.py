"""
Enterprise Embedding Service
Production-grade embedding generation for RAG system
"""


import structlog

from app.ai.llm.ollama_service import OllamaServiceError, get_ollama_service

logger = structlog.get_logger(__name__)


class EmbeddingService:
    """
    Professional embedding service for compliance documents
    
    Features:
    - Async embedding generation
    - Batch processing
    - Retry handling
    - Vector dimension validation
    - Query normalization
    """

    def __init__(self, model: str = "nomic-embed-text", expected_dim: int = 768):
        self.model = model
        self.expected_dim = expected_dim
        self.ollama = get_ollama_service()

        logger.info(
            "embedding_service_initialized",
            model=model,
            expected_dim=expected_dim
        )

    def _normalize_query(self, query: str) -> str:
        """
        Normalize query text for better retrieval
        
        Args:
            query: Raw query text
            
        Returns:
            Normalized query
        """
        # Remove extra whitespace
        query = " ".join(query.split())

        # Ensure query ends with proper punctuation for better embedding
        if query and query[-1] not in ".?!":
            query += "?"

        return query

    async def embed_query(self, query: str) -> list[float]:
        """
        Generate embedding for search query
        
        Args:
            query: Search query text
            
        Returns:
            Embedding vector
            
        Raises:
            OllamaServiceError: If embedding generation fails
        """
        # Normalize query
        normalized_query = self._normalize_query(query)

        logger.info(
            "embedding_query",
            original_length=len(query),
            normalized_length=len(normalized_query)
        )

        try:
            embedding = await self.ollama.embed(normalized_query, model=self.model)

            # Validate dimension
            if len(embedding) != self.expected_dim:
                logger.warning(
                    "embedding_dimension_mismatch",
                    expected=self.expected_dim,
                    actual=len(embedding)
                )

            return embedding

        except OllamaServiceError as e:
            logger.error("embedding_query_failed", error=str(e))
            raise

    async def embed_documents(
        self,
        texts: list[str],
        batch_size: int = 32
    ) -> list[list[float]]:
        """
        Generate embeddings for multiple documents
        
        Args:
            texts: List of document texts
            batch_size: Batch size for parallel processing
            
        Returns:
            List of embedding vectors
        """
        logger.info(
            "embedding_documents_start",
            total_documents=len(texts),
            batch_size=batch_size
        )

        try:
            embeddings = await self.ollama.embed_batch(
                texts,
                model=self.model,
                batch_size=batch_size
            )

            # Validate all dimensions
            invalid_count = sum(
                1 for emb in embeddings
                if len(emb) != self.expected_dim
            )

            if invalid_count > 0:
                logger.warning(
                    "embedding_dimension_validation",
                    invalid_count=invalid_count,
                    total=len(embeddings)
                )

            logger.info(
                "embedding_documents_complete",
                total_embeddings=len(embeddings),
                valid_embeddings=len(embeddings) - invalid_count
            )

            return embeddings

        except OllamaServiceError as e:
            logger.error("embedding_documents_failed", error=str(e))
            raise


# Global instance
_embedding_service: EmbeddingService | None = None


def get_embedding_service() -> EmbeddingService:
    """Get or create global embedding service instance"""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
