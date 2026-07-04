"""
RAG API Endpoints
Professional REST APIs for RAG system
"""

from typing import Any

import structlog
from fastapi import APIRouter, Depends, HTTPException, status

from app.ai.llm import get_ollama_service
from app.ai.rag.rag_service import get_rag_service
from app.ai.rag.schemas import (
    RAGQueryRequest,
    RAGQueryResponse,
    RAGSearchRequest,
    RAGSearchResponse,
)
from app.auth.dependencies import get_current_active_user
from app.models.identity import User

logger = structlog.get_logger(__name__)

router = APIRouter(tags=["RAG System"])


@router.post("/query", response_model=RAGQueryResponse)
async def query_rag(
    request: RAGQueryRequest, current_user: User = Depends(get_current_active_user)
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
            framework=request.framework.value if request.framework else "ALL",
        )

        rag_service = get_rag_service()
        answer = await rag_service.query(request, org_id=str(current_user.organization_id))

        return RAGQueryResponse(
            success=True, message="Query processed successfully", data=answer
        )

    except Exception as e:
        # Log full detail server-side; never leak internal infra errors to clients.
        logger.error("rag_query_error", error=str(e), user_id=str(current_user.id))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to process the query at this time. Please try again later.",
        )


@router.post("/search", response_model=RAGSearchResponse)
async def search_documents(
    request: RAGSearchRequest, current_user: User = Depends(get_current_active_user)
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
        from datetime import datetime

        from app.ai.rag.retrieval_service import get_retrieval_service

        start_time = datetime.now()

        retrieval = get_retrieval_service()
        chunks = await retrieval.retrieve(
            query=request.query,
            top_k=request.top_k,
            score_threshold=request.score_threshold,
            framework=request.framework,
            org_id=str(current_user.organization_id),
            deduplicate=True,
        )

        query_time = int((datetime.now() - start_time).total_seconds() * 1000)

        results = [
            {"text": chunk.text, "score": chunk.score, "metadata": chunk.metadata}
            for chunk in chunks
        ]

        return RAGSearchResponse(
            success=True,
            message="Search completed successfully",
            data={"results": results, "total_results": len(results), "query_time_ms": query_time},
        )

    except Exception as e:
        logger.error("search_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to complete the search at this time. Please try again later.",
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

        # SECURITY: this endpoint is unauthenticated. Return only coarse status —
        # never leak model names, infrastructure URLs, or collection names, which
        # are valuable reconnaissance for an attacker.
        healthy = health.ollama_available and qdrant_status == "connected"
        return {
            "status": "healthy" if healthy else "degraded",
            "ollama": health.ollama_available,
            "qdrant": qdrant_status == "connected",
        }

    except Exception:
        logger.exception("rag_health_check_failed")
        return {"status": "unhealthy"}
