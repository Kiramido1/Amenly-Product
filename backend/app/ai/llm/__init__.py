"""
LLM Integration Module
Enterprise-grade Ollama integration for Amenly AI Compliance Platform
"""

from app.ai.llm.ollama_service import OllamaService
from app.ai.llm.schemas import GenerateRequest, GenerateResponse, EmbeddingRequest, EmbeddingResponse

__all__ = [
    "OllamaService",
    "GenerateRequest",
    "GenerateResponse",
    "EmbeddingRequest",
    "EmbeddingResponse",
]
