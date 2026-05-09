"""
RAG (Retrieval-Augmented Generation) Module
Enterprise-grade RAG system for compliance frameworks
"""

from app.ai.rag.schemas import (
    RAGQueryRequest,
    RAGQueryResponse,
    RAGSearchRequest,
    RAGSearchResponse,
    RAGAnswer,
    SourceReference,
    RetrievedChunk,
    FrameworkType
)
from app.ai.rag.rag_service import RAGService, get_rag_service
from app.ai.rag.retrieval_service import RetrievalService, get_retrieval_service
from app.ai.rag.context_builder import ContextBuilder
from app.ai.rag.router import router

__all__ = [
    # Schemas
    "RAGQueryRequest",
    "RAGQueryResponse",
    "RAGSearchRequest",
    "RAGSearchResponse",
    "RAGAnswer",
    "SourceReference",
    "RetrievedChunk",
    "FrameworkType",
    # Services
    "RAGService",
    "get_rag_service",
    "RetrievalService",
    "get_retrieval_service",
    "ContextBuilder",
    # Router
    "router",
]
