"""
LLM Integration Module
Enterprise-grade Ollama integration for Amenly AI Compliance Platform
"""

from app.ai.llm.ollama_service import OllamaService, get_ollama_service
from app.ai.llm.schemas import GenerateRequest, GenerateResponse, EmbeddingRequest, EmbeddingResponse

__all__ = [
    "OllamaService",
    "get_ollama_service",
    "GenerateRequest",
    "GenerateResponse",
    "EmbeddingRequest",
    "EmbeddingResponse",
]
