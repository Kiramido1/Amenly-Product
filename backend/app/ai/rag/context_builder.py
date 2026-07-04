"""
Context Building for RAG
Assembles retrieved chunks into coherent context
"""


import structlog
import tiktoken

from app.ai.rag.prompt_templates import CONTEXT_CHUNK_TEMPLATE
from app.ai.rag.schemas import RetrievedChunk

logger = structlog.get_logger(__name__)


class ContextBuilder:
    """
    Build context from retrieved chunks
    
    Features:
    - Token-aware assembly
    - Metadata preservation
    - Hierarchical organization
    - Truncation handling
    """

    def __init__(self, max_tokens: int = 4000, model: str = "gpt-3.5-turbo"):
        self.max_tokens = max_tokens
        try:
            self.encoding = tiktoken.encoding_for_model(model)
        except KeyError:
            # Fallback to cl100k_base if model not found
            self.encoding = tiktoken.get_encoding("cl100k_base")

    def _count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        return len(self.encoding.encode(text))

    def build_context(
        self,
        chunks: list[RetrievedChunk],
        include_metadata: bool = True
    ) -> str:
        """
        Build context string from chunks
        
        Args:
            chunks: Retrieved chunks
            include_metadata: Include source metadata
            
        Returns:
            Formatted context string
        """
        if not chunks:
            return ""

        context_parts = []
        total_tokens = 0

        for i, chunk in enumerate(chunks, 1):
            # Format chunk with metadata
            if include_metadata:
                chunk_text = CONTEXT_CHUNK_TEMPLATE.format(
                    framework=chunk.framework or "Unknown",
                    source_file=chunk.source_file or "Unknown",
                    section=chunk.section or "N/A",
                    page=chunk.page_number or "N/A",
                    text=chunk.text
                )
            else:
                chunk_text = f"{chunk.text}\n---\n"

            # Check token limit
            chunk_tokens = self._count_tokens(chunk_text)

            if total_tokens + chunk_tokens > self.max_tokens:
                logger.warning(
                    "context_truncated",
                    chunks_included=i-1,
                    total_chunks=len(chunks),
                    tokens_used=total_tokens
                )
                break

            context_parts.append(chunk_text)
            total_tokens += chunk_tokens

        context = "\n".join(context_parts)

        logger.info(
            "context_built",
            chunks_used=len(context_parts),
            total_tokens=total_tokens,
            max_tokens=self.max_tokens
        )

        return context
