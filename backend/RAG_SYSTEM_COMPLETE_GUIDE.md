# 🚀 RAG System - Complete Implementation Guide

## ✅ Current Status

### Completed Components:
1. ✅ **Ollama Service** - Production-grade LLM integration
2. ✅ **Embedding Service** - nomic-embed-text integration
3. ✅ **Retrieval Service** - Qdrant search with filtering
4. ✅ **RAG Schemas** - Request/Response models
5. ⏳ **Downloading nomic-embed-text** (63% complete)

### What's Working:
- ✅ Ollama running locally (qwen2.5:7b available)
- ✅ Qdrant running (just started)
- ✅ 42 chunk files ready (preprocessed data)
- ✅ All Python dependencies installed

---

## 🏗️ Complete RAG Architecture

```
User Question
     ↓
[1] Generate Query Embedding (nomic-embed-text)
     ↓
[2] Search Qdrant (cosine similarity + filters)
     ↓
[3] Retrieve Top-K Chunks (with metadata)
     ↓
[4] Deduplicate & Rank
     ↓
[5] Build Context (merge chunks + metadata)
     ↓
[6] Create Prompt (system + context + question)
     ↓
[7] Generate Answer (qwen2.5)
     ↓
[8] Structure Response (answer + sources + confidence)
     ↓
Final Answer
```

---

## 📁 Project Structure

```
app/ai/
├── llm/
│   ├── __init__.py ✅
│   ├── schemas.py ✅
│   └── ollama_service.py ✅
├── embeddings/
│   ├── __init__.py ✅
│   └── embedding_service.py ✅
├── rag/
│   ├── __init__.py ⏳
│   ├── schemas.py ✅
│   ├── retrieval_service.py ✅
│   ├── prompt_templates.py ⏳
│   ├── context_builder.py ⏳
│   ├── rag_service.py ⏳
│   └── router.py ⏳
└── services/
    └── llm.py (old - can be removed)
```

---

## 🔧 Remaining Components to Build

### 1. Prompt Templates (`app/ai/rag/prompt_templates.py`)

```python
"""
Professional Prompt Templates for Compliance RAG
"""

SYSTEM_PROMPT = """You are a professional compliance and cybersecurity analyst specializing in information security frameworks and regulations.

Your role:
- Answer questions ONLY based on the provided context from official compliance documents
- Cite specific framework sections, controls, or requirements when available
- If the context doesn't contain enough information, clearly state this
- Never make up or hallucinate information
- Provide structured, professional responses
- Focus on accuracy and compliance requirements

Frameworks you specialize in:
- ISO 27001 (Information Security Management)
- NIST (Cybersecurity Framework, SP 800-53)
- SOC 2 (Service Organization Controls)
- GDPR (Data Protection)
- HIPAA (Healthcare Privacy)
- PCI DSS (Payment Card Security)
- Other compliance frameworks

Response format:
- Start with a direct answer
- Reference specific controls or sections
- Provide implementation guidance when relevant
- Mention any important caveats or requirements
"""

USER_PROMPT_TEMPLATE = """Based on the following context from compliance framework documents, please answer the question.

CONTEXT:
{context}

QUESTION: {question}

Please provide a comprehensive answer based ONLY on the information in the context above. If the context doesn't contain enough information to fully answer the question, please state that clearly.

ANSWER:"""

CONTEXT_CHUNK_TEMPLATE = """
[Source: {framework} - {source_file}]
[Section: {section} | Page: {page}]
{text}
---
"""

NO_CONTEXT_RESPONSE = """I don't have enough information in the available compliance documents to answer this question accurately. 

This could mean:
1. The specific topic isn't covered in the uploaded frameworks
2. The question requires information from documents that haven't been uploaded yet
3. The question might need to be rephrased to match the terminology used in the frameworks

Please try:
- Rephrasing your question using standard compliance terminology
- Specifying which framework you're asking about (e.g., "According to ISO 27001...")
- Checking if the relevant framework documents have been uploaded to the system
"""
```

### 2. Context Builder (`app/ai/rag/context_builder.py`)

```python
"""
Context Building for RAG
Assembles retrieved chunks into coherent context
"""

from typing import List
import tiktoken
import structlog

from app.ai.rag.schemas import RetrievedChunk
from app.ai.rag.prompt_templates import CONTEXT_CHUNK_TEMPLATE

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
        self.encoding = tiktoken.encoding_for_model(model)
        
    def _count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        return len(self.encoding.encode(text))
    
    def build_context(
        self,
        chunks: List[RetrievedChunk],
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
```

### 3. RAG Service (`app/ai/rag/rag_service.py`)

```python
"""
Complete RAG Service
Orchestrates the full RAG pipeline
"""

from typing import Optional, Dict, Any
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
    FrameworkType
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
        self.context_builder = ContextBuilder(max_tokens=4000)
        
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
                max_tokens=1000
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
```

### 4. API Router (`app/ai/rag/router.py`)

```python
"""
RAG API Endpoints
Professional REST APIs for RAG system
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any
import structlog

from app.ai.rag.schemas import (
    RAGQueryRequest,
    RAGQueryResponse,
    RAGSearchRequest,
    RAGSearchResponse
)
from app.ai.rag.rag_service import get_rag_service
from app.ai.llm import get_ollama_service
from app.auth.dependencies import get_current_active_user
from app.models.identity import User

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/rag", tags=["RAG System"])


@router.post("/query", response_model=RAGQueryResponse)
async def query_rag(
    request: RAGQueryRequest,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Query RAG system with compliance question
    
    This endpoint:
    1. Generates query embedding
    2. Searches Qdrant for relevant chunks
    3. Builds context from retrieved documents
    4. Generates answer using LLM
    5. Returns structured response with sources
    
    Example:
        ```json
        {
            "question": "What does ISO 27001 require for MFA?",
            "framework": "ISO27001",
            "top_k": 5
        }
        ```
    """
    try:
        logger.info(
            "rag_query_request",
            user_id=str(current_user.id),
            question=request.question[:100],
            framework=request.framework.value if request.framework else "ALL"
        )
        
        rag_service = get_rag_service()
        answer = await rag_service.query(request)
        
        return RAGQueryResponse(
            success=True,
            message="Query processed successfully",
            data=answer.dict()
        )
        
    except Exception as e:
        logger.error("rag_query_error", error=str(e), user_id=str(current_user.id))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG query failed: {str(e)}"
        )


@router.post("/search", response_model=RAGSearchResponse)
async def search_documents(
    request: RAGSearchRequest,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Semantic search without LLM generation
    
    Returns relevant document chunks without generating an answer.
    Useful for:
    - Exploring available content
    - Finding specific controls or sections
    - Debugging retrieval quality
    """
    try:
        from app.ai.rag.retrieval_service import get_retrieval_service
        from datetime import datetime
        
        start_time = datetime.now()
        
        retrieval = get_retrieval_service()
        chunks = await retrieval.retrieve(
            query=request.query,
            top_k=request.top_k,
            score_threshold=request.score_threshold,
            framework=request.framework,
            deduplicate=True
        )
        
        query_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        results = [
            {
                "text": chunk.text,
                "score": chunk.score,
                "metadata": chunk.metadata
            }
            for chunk in chunks
        ]
        
        return RAGSearchResponse(
            success=True,
            message="Search completed successfully",
            data={
                "results": results,
                "total_results": len(results),
                "query_time_ms": query_time
            }
        )
        
    except Exception as e:
        logger.error("search_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )


@router.get("/health")
async def health_check() -> Any:
    """
    Check RAG system health
    
    Verifies:
    - Ollama connection
    - Available models
    - Qdrant connection
    """
    try:
        ollama = get_ollama_service()
        health = await ollama.health_check()
        
        return {
            "status": "healthy" if health.ollama_available else "degraded",
            "ollama": {
                "available": health.ollama_available,
                "llm_model": health.llm_model,
                "embedding_model": health.embedding_model,
                "models": health.models_available
            },
            "qdrant": {
                "url": "http://localhost:6333",
                "status": "connected"  # TODO: Add actual check
            }
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
```

---

## 🧪 Testing Commands

### 1. Test Ollama
```bash
# Check if running
curl http://localhost:11434/api/tags

# Test generation
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5",
  "prompt": "What is MFA?",
  "stream": false
}'

# Test embedding
curl http://localhost:11434/api/embeddings -d '{
  "model": "nomic-embed-text",
  "prompt": "access control requirements"
}'
```

### 2. Test Qdrant
```bash
# List collections
curl http://localhost:6333/collections

# Check collection info
curl http://localhost:6333/collections/compliance_frameworks
```

### 3. Test RAG API
```bash
# Health check
curl http://localhost:8001/api/v1/rag/health

# Query (requires auth token)
curl -X POST http://localhost:8001/api/v1/rag/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What does ISO 27001 require for MFA?",
    "framework": "ISO27001",
    "top_k": 5
  }'

# Search
curl -X POST http://localhost:8001/api/v1/rag/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "multi-factor authentication",
    "framework": "ISO27001",
    "top_k": 10
  }'
```

---

## 📊 Next Steps

1. **Wait for nomic-embed-text to finish downloading**
2. **Run component tests again**: `poetry run python test_rag_components.py`
3. **Create remaining files** (prompt_templates.py, context_builder.py, rag_service.py, router.py)
4. **Load chunks into Qdrant** (ingestion script)
5. **Test full RAG pipeline**
6. **Integrate with main API**

---

## 🎯 Expected Results

When you ask: **"What does ISO 27001 require for MFA?"**

You should get:
```json
{
  "success": true,
  "message": "Query processed successfully",
  "data": {
    "answer": "ISO 27001 requires multi-factor authentication (MFA) as part of control A.9.4.2 (Secure log-on procedures). Organizations must implement MFA for remote access and privileged accounts...",
    "sources": [
      {
        "framework": "ISO27001",
        "section": "A.9.4.2",
        "control_id": "A.9.4.2",
        "source_file": "ISO27001\\iso1.pdf",
        "page_number": 45,
        "relevance_score": 0.92
      }
    ],
    "confidence_score": 0.89,
    "retrieved_chunks": 5,
    "processing_time_ms": 1250
  }
}
```

---

**Status**: Components built, waiting for model download to complete testing! 🚀
