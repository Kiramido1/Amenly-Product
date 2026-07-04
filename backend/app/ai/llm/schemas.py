"""
LLM Request/Response Schemas
"""

from typing import Any

from pydantic import BaseModel, Field


class GenerateRequest(BaseModel):
    """Request schema for text generation"""
    model: str = Field(..., description="Model name (e.g., qwen2.5)")
    prompt: str = Field(..., description="Input prompt")
    system: str | None = Field(None, description="System prompt")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Sampling temperature")
    top_p: float = Field(0.9, ge=0.0, le=1.0, description="Nucleus sampling")
    top_k: int = Field(40, ge=0, description="Top-k sampling")
    max_tokens: int | None = Field(None, description="Maximum tokens to generate")
    stream: bool = Field(False, description="Enable streaming")

    class Config:
        json_schema_extra = {
            "example": {
                "model": "qwen2.5",
                "prompt": "What are the access control requirements?",
                "system": "You are a compliance expert.",
                "temperature": 0.7,
                "stream": False
            }
        }


class GenerateResponse(BaseModel):
    """Response schema for text generation"""
    model: str
    response: str
    done: bool
    context: list[int] | None = None
    total_duration: int | None = None
    load_duration: int | None = None
    prompt_eval_count: int | None = None
    eval_count: int | None = None
    eval_duration: int | None = None


class EmbeddingRequest(BaseModel):
    """Request schema for embeddings"""
    model: str = Field(..., description="Embedding model name")
    prompt: str = Field(..., description="Text to embed")

    class Config:
        json_schema_extra = {
            "example": {
                "model": "nomic-embed-text",
                "prompt": "What are the MFA requirements?"
            }
        }


class EmbeddingResponse(BaseModel):
    """Response schema for embeddings"""
    embedding: list[float]
    model: str = ""


class ModelInfo(BaseModel):
    """Model information"""
    name: str
    modified_at: str
    size: int
    digest: str
    details: dict[str, Any] | None = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    ollama_available: bool
    models_available: list[str]
    embedding_model: str
    llm_model: str
