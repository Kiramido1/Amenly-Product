"""
Complete RAG Service
Orchestrates the full RAG pipeline
"""

from typing import Optional
from datetime import datetime
import structlog

from app.ai.llm import get_ollama_service
from app.ai.rag.retrieval_service import get_retrieval_service
from app.ai.rag.context_builder import ContextBuilder
from app.ai.rag.prompt_templates import (
    SYSTEM_PROMPT,
    USER_PROMPT_TEMPLATE,
    NO_CONTEXT_RESPONSE
)
from app.ai.rag.schemas import (
    RAGQueryRequest,
    RAGAnswer,
    SourceReference
)

logger = structlog.get_logger(__name__)


class RAGService:
    """
    Enterprise RAG Service for Compliance Queries
    
    Complete pipeline:
    1. Generate query embedding
    2. Search Qdrant
    3. Retrieve & rank chunks
    4. Build context
    5. Create prompt
    6. Generate answer
    7. Structure response
    """
    
    def __init__(self):
        self.ollama = get_ollama_service()
        self.retrieval = get_retrieval_service()
        self.context_builder = ContextBuilder(max_tokens=800)  # Reduced for CPU
        
        logger.info("rag_service_initialized")
    
    def _calculate_confidence(
        self,
        chunks_count: int,
        avg_score: float,
        answer_length: int
    ) -> float:
        """
        Calculate confidence score for answer
        
        Args:
            chunks_count: Number of chunks retrieved
            avg_score: Average similarity score
            answer_length: Length of generated answer
            
        Returns:
            Confidence score (0.0 to 1.0)
        """
        # Simple heuristic
        chunk_factor = min(chunks_count / 5.0, 1.0)  # Ideal: 5 chunks
        score_factor = avg_score
        length_factor = min(answer_length / 500.0, 1.0)  # Ideal: 500 chars
        
        confidence = (chunk_factor * 0.4) + (score_factor * 0.4) + (length_factor * 0.2)
        
        return round(confidence, 2)
    
    async def query(
        self,
        request: RAGQueryRequest
    ) -> RAGAnswer:
        """
        Process RAG query end-to-end
        
        Args:
            request: RAG query request
            
        Returns:
            Structured RAG answer
        """
        start_time = datetime.now()
        
        logger.info(
            "rag_query_start",
            question=request.question[:100],
            framework=request.framework.value if request.framework else "ALL",
            top_k=request.top_k
        )
        
        try:
            # Step 1: Retrieve relevant chunks
            chunks = await self.retrieval.retrieve(
                query=request.question,
                top_k=request.top_k,
                score_threshold=request.score_threshold,
                framework=request.framework,
                deduplicate=True
            )
            
            if not chunks:
                logger.warning("no_chunks_retrieved")
                
                # Return no-context response
                processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
                
                return RAGAnswer(
                    answer=NO_CONTEXT_RESPONSE,
                    sources=[],
                    confidence_score=0.0,
                    retrieved_chunks=0,
                    processing_time_ms=processing_time,
                    framework_filter=request.framework.value if request.framework else None
                )
            
            # Step 2: Build context
            context = self.context_builder.build_context(
                chunks,
                include_metadata=request.include_metadata
            )
            
            # Step 3: Create prompt
            user_prompt = USER_PROMPT_TEMPLATE.format(
                context=context,
                question=request.question
            )
            
            # Step 4: Generate answer
            response = await self.ollama.generate(
                prompt=user_prompt,
                system=SYSTEM_PROMPT,
                temperature=0.3,  # Lower for factual answers
                max_tokens=256  # Reduced for faster CPU generation
            )
            
            answer_text = response.response
            
            # Step 5: Extract sources
            sources = []
            for chunk in chunks[:5]:  # Top 5 sources
                source = SourceReference(
                    framework=chunk.framework or "Unknown",
                    section=chunk.section,
                    control_id=chunk.control_id,
                    source_file=chunk.source_file or "Unknown",
                    page_number=chunk.page_number,
                    relevance_score=chunk.score
                )
                sources.append(source)
            
            # Step 6: Calculate confidence
            avg_score = sum(c.score for c in chunks) / len(chunks)
            confidence = self._calculate_confidence(
                chunks_count=len(chunks),
                avg_score=avg_score,
                answer_length=len(answer_text)
            )
            
            # Step 7: Calculate processing time
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            logger.info(
                "rag_query_complete",
                chunks_retrieved=len(chunks),
                confidence=confidence,
                processing_time_ms=processing_time
            )
            
            return RAGAnswer(
                answer=answer_text,
                sources=sources,
                confidence_score=confidence,
                retrieved_chunks=len(chunks),
                processing_time_ms=processing_time,
                framework_filter=request.framework.value if request.framework else None
            )
            
        except Exception as e:
            logger.error("rag_query_failed", error=str(e))
            raise


# Global instance
_rag_service: Optional[RAGService] = None


def get_rag_service() -> RAGService:
    """Get or create global RAG service instance"""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
