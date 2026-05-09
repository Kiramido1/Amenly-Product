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

router = APIRouter(tags=["RAG System"])


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
        
        # Check Qdrant
        from app.ai.rag.retrieval_service import get_retrieval_service
        retrieval = get_retrieval_service()
        
        try:
            collections = retrieval.client.get_collections()
            qdrant_status = "connected"
            qdrant_collections = [col.name for col in collections.collections]
        except Exception as e:
            qdrant_status = f"error: {str(e)}"
            qdrant_collections = []
        
        return {
            "status": "healthy" if health.ollama_available and qdrant_status == "connected" else "degraded",
            "ollama": {
                "available": health.ollama_available,
                "llm_model": health.llm_model,
                "embedding_model": health.embedding_model,
                "models": health.models_available
            },
            "qdrant": {
                "url": retrieval.qdrant_url,
                "status": qdrant_status,
                "collections": qdrant_collections
            }
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
