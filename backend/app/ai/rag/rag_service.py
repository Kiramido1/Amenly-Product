"""
Complete RAG Service
Orchestrates the full RAG pipeline
"""

import re
from typing import Optional, List, Tuple
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
    SourceReference,
    AnswerSection,
    AnswerMetadata
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
        self.context_builder = ContextBuilder(max_tokens=3000)  # Increased for richer context
        
        logger.info("rag_service_initialized")
    
    def _parse_answer(self, answer_text: str) -> Tuple[str, List[AnswerSection]]:
        """
        Parse raw markdown answer into summary + structured sections.
        Handles ### Title format used by the prompt template.
        """
        sections: List[AnswerSection] = []
        summary = ""
        
        # Split on markdown h3 headers: ### Title
        pattern = r'###\s+(.+?)\n+(.+?)(?=\n###\s+|\Z)'
        matches = re.findall(pattern, answer_text, re.DOTALL)
        
        if matches:
            for order, (title, content) in enumerate(matches, start=1):
                title = title.strip()
                content = content.strip()
                sections.append(AnswerSection(
                    title=title,
                    content=content,
                    order=order
                ))
                # Use first paragraph of first section as summary
                if order == 1:
                    first_para = content.split('\n\n')[0].strip()
                    sentences = re.split(r'(?<=[.!?])\s+', first_para)
                    summary = ' '.join(sentences[:3]) if len(sentences) >= 3 else first_para
        else:
            # Fallback: no sections found, treat entire text as one section
            sections.append(AnswerSection(
                title="Answer",
                content=answer_text.strip(),
                order=1
            ))
            sentences = re.split(r'(?<=[.!?])\s+', answer_text.strip())
            summary = ' '.join(sentences[:3]) if len(sentences) >= 3 else answer_text.strip()
        
        return summary, sections
    
    def _build_metadata(self, answer_text: str, sections: List[AnswerSection], sources_count: int) -> AnswerMetadata:
        """Build answer metadata (word count, reading time, etc.)"""
        word_count = len(answer_text.split())
        char_count = len(answer_text)
        # Average reading speed: ~200 words per minute
        estimated_reading_time_seconds = max(1, int((word_count / 200) * 60))
        
        return AnswerMetadata(
            word_count=word_count,
            char_count=char_count,
            estimated_reading_time_seconds=estimated_reading_time_seconds,
            sections_count=len(sections),
            sources_count=sources_count
        )
    
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
        length_factor = min(answer_length / 2000.0, 1.0)  # Ideal: 2000 chars for detailed answers
        
        confidence = (chunk_factor * 0.4) + (score_factor * 0.4) + (length_factor * 0.2)
        
        return round(confidence, 2)
    
    async def query(
        self,
        request: RAGQueryRequest,
        org_id: Optional[str] = None
    ) -> RAGAnswer:
        """
        Process RAG query end-to-end
        
        Args:
            request: RAG query request
            org_id: Organization ID for security isolation
            
        Returns:
            Structured RAG answer
        """
        start_time = datetime.now()
        
        logger.info(
            "rag_query_start",
            question=request.question[:100],
            framework=request.framework.value if request.framework else "ALL",
            top_k=request.top_k,
            org_id=org_id
        )
        
        try:
            # Step 1: Retrieve relevant chunks
            chunks = await self.retrieval.retrieve(
                query=request.question,
                top_k=request.top_k,
                score_threshold=request.score_threshold,
                framework=request.framework,
                org_id=org_id
            )
            
            if not chunks:
                logger.warning("no_chunks_retrieved")
                
                # Return no-context response
                processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
                
                no_context_meta = AnswerMetadata(
                    word_count=len(NO_CONTEXT_RESPONSE.split()),
                    char_count=len(NO_CONTEXT_RESPONSE),
                    estimated_reading_time_seconds=1,
                    sections_count=1,
                    sources_count=0
                )
                return RAGAnswer(
                    summary=NO_CONTEXT_RESPONSE,
                    sections=[AnswerSection(title="No Context", content=NO_CONTEXT_RESPONSE, order=1)],
                    full_text=NO_CONTEXT_RESPONSE,
                    sources=[],
                    confidence_score=0.0,
                    retrieved_chunks=0,
                    processing_time_ms=processing_time,
                    framework_filter=request.framework.value if request.framework else None,
                    metadata=no_context_meta
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
            
            # Step 4: Generate answer with maximum verbosity settings
            response = await self.ollama.generate(
                prompt=user_prompt,
                system=SYSTEM_PROMPT,
                temperature=0.8,  # Higher for maximum verbosity and detail
                top_p=0.95,  # More diverse token selection for richer answers
                max_tokens=2048  # Maximum for comprehensive, thorough answers
            )
            
            answer_text = response.response
            
            # Step 5: Parse answer into structured sections + summary
            summary, sections = self._parse_answer(answer_text)
            
            # Step 6: Extract sources
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
            
            metadata = self._build_metadata(answer_text, sections, len(sources))
            
            return RAGAnswer(
                summary=summary,
                sections=sections,
                full_text=answer_text,
                sources=sources,
                confidence_score=confidence,
                retrieved_chunks=len(chunks),
                processing_time_ms=processing_time,
                framework_filter=request.framework.value if request.framework else None,
                metadata=metadata
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
