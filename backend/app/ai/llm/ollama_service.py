"""
Enterprise-Grade Ollama Service
Production-ready integration with Ollama for LLM and embeddings
"""

import httpx
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime
import structlog

from app.core.config import settings
from app.ai.llm.schemas import (
    GenerateRequest,
    GenerateResponse,
    EmbeddingRequest,
    EmbeddingResponse,
    ModelInfo,
    HealthResponse
)

logger = structlog.get_logger(__name__)


class OllamaServiceError(Exception):
    """Base exception for Ollama service errors"""
    pass


class ModelNotFoundError(OllamaServiceError):
    """Raised when requested model is not available"""
    pass


class OllamaConnectionError(OllamaServiceError):
    """Raised when cannot connect to Ollama"""
    pass


class OllamaService:
    """
    Production-grade Ollama service for LLM and embedding operations
    
    Features:
    - Async HTTP requests
    - Automatic retries with exponential backoff
    - Timeout handling
    - Model validation
    - Health checking
    - Structured logging
    - Error handling
    """
    
    def __init__(
        self,
        base_url: Optional[str] = None,
        llm_model: Optional[str] = None,
        embedding_model: Optional[str] = None,
        timeout: float = 600.0,  # Increased to 10 minutes for CPU processing
        max_retries: int = 3
    ):
        self.base_url = base_url or settings.OLLAMA_URL
        self.llm_model = llm_model or getattr(settings, "OLLAMA_MODEL", "qwen2.5")
        self.embedding_model = embedding_model or getattr(settings, "OLLAMA_EMBEDDING_MODEL", "nomic-embed-text")
        self.timeout = timeout
        self.max_retries = max_retries
        
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(timeout),
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=100)
        )
        
        logger.info(
            "ollama_service_initialized",
            base_url=self.base_url,
            llm_model=self.llm_model,
            embedding_model=self.embedding_model
        )
    
    async def _retry_request(self, func, *args, **kwargs):
        """Execute request with exponential backoff retry"""
        last_exception = None
        
        for attempt in range(self.max_retries):
            try:
                return await func(*args, **kwargs)
            except (httpx.TimeoutException, httpx.ConnectError) as e:
                last_exception = e
                if attempt < self.max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.warning(
                        "ollama_request_retry",
                        attempt=attempt + 1,
                        max_retries=self.max_retries,
                        wait_time=wait_time,
                        error=str(e)
                    )
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(
                        "ollama_request_failed",
                        attempts=self.max_retries,
                        error=str(e)
                    )
        
        raise OllamaConnectionError(f"Failed after {self.max_retries} attempts: {last_exception}")
    
    async def health_check(self) -> HealthResponse:
        """
        Check Ollama service health and available models
        
        Returns:
            HealthResponse with service status and available models
        """
        try:
            # Check if Ollama is running
            response = await self.client.get("/api/tags")
            response.raise_for_status()
            
            data = response.json()
            models = [model["name"] for model in data.get("models", [])]
            
            return HealthResponse(
                status="healthy",
                ollama_available=True,
                models_available=models,
                embedding_model=self.embedding_model,
                llm_model=self.llm_model
            )
        except Exception as e:
            logger.error("ollama_health_check_failed", error=str(e))
            return HealthResponse(
                status="unhealthy",
                ollama_available=False,
                models_available=[],
                embedding_model=self.embedding_model,
                llm_model=self.llm_model
            )
    
    async def list_models(self) -> List[ModelInfo]:
        """
        List all available models
        
        Returns:
            List of ModelInfo objects
        """
        try:
            response = await self.client.get("/api/tags")
            response.raise_for_status()
            
            data = response.json()
            models = []
            
            for model_data in data.get("models", []):
                models.append(ModelInfo(
                    name=model_data["name"],
                    modified_at=model_data.get("modified_at", ""),
                    size=model_data.get("size", 0),
                    digest=model_data.get("digest", ""),
                    details=model_data.get("details")
                ))
            
            return models
        except Exception as e:
            logger.error("list_models_failed", error=str(e))
            raise OllamaServiceError(f"Failed to list models: {e}")
    
    async def validate_model(self, model_name: str) -> bool:
        """
        Validate that a model exists
        
        Args:
            model_name: Name of the model to validate
            
        Returns:
            True if model exists, False otherwise
        """
        try:
            models = await self.list_models()
            # Check for exact match or partial match (e.g., "qwen2.5" matches "qwen2.5:7b")
            return any(
                model.name == model_name or model.name.startswith(f"{model_name}:")
                for model in models
            )
        except Exception:
            return False
    
    async def _resolve_model_name(self, model_name: str) -> str:
        """
        Resolve model name to full name with tag
        
        Args:
            model_name: Short model name (e.g., "qwen2.5")
            
        Returns:
            Full model name with tag (e.g., "qwen2.5:7b")
        """
        try:
            models = await self.list_models()
            
            # Try exact match first
            for model in models:
                if model.name == model_name:
                    return model.name
            
            # Try partial match
            for model in models:
                if model.name.startswith(f"{model_name}:"):
                    return model.name
            
            # Return original if no match
            return model_name
        except Exception:
            return model_name
    
    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        top_p: float = 0.9,
        top_k: int = 40,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> GenerateResponse:
        """
        Generate text completion using LLM
        
        Args:
            prompt: Input prompt
            system: System prompt (optional)
            model: Model name (defaults to configured LLM model)
            temperature: Sampling temperature (0.0 to 2.0)
            top_p: Nucleus sampling parameter
            top_k: Top-k sampling parameter
            max_tokens: Maximum tokens to generate
            stream: Enable streaming (not implemented yet)
            
        Returns:
            GenerateResponse with generated text
            
        Raises:
            ModelNotFoundError: If model doesn't exist
            OllamaServiceError: If generation fails
        """
        model = model or self.llm_model
        
        # Validate model exists
        if not await self.validate_model(model):
            raise ModelNotFoundError(f"Model '{model}' not found. Please pull it first: ollama pull {model}")
        
        # Resolve to full model name with tag
        model = await self._resolve_model_name(model)
        
        request_data = {
            "model": model,
            "prompt": prompt,
            "stream": stream,
            "options": {
                "temperature": temperature,
                "top_p": top_p,
                "top_k": top_k,
                "num_ctx": 8192,  # Expanded context window for large context + long output
                "num_predict": 2048,  # Maximum for longest possible answers
                "repeat_penalty": 1.0,  # No repeat penalty to encourage longer output
            }
        }
        
        if system:
            request_data["system"] = system
        
        if max_tokens:
            request_data["options"]["num_predict"] = max_tokens
        
        logger.info(
            "ollama_generate_request",
            model=model,
            prompt_length=len(prompt),
            has_system=bool(system),
            temperature=temperature
        )
        
        start_time = datetime.now()
        
        try:
            async def _make_request():
                response = await self.client.post("/api/generate", json=request_data)
                response.raise_for_status()
                return response.json()
            
            data = await self._retry_request(_make_request)
            
            duration = (datetime.now() - start_time).total_seconds()
            
            logger.info(
                "ollama_generate_success",
                model=model,
                duration_seconds=duration,
                response_length=len(data.get("response", "")),
                eval_count=data.get("eval_count")
            )
            
            return GenerateResponse(**data)
            
        except httpx.HTTPStatusError as e:
            logger.error(
                "ollama_generate_http_error",
                status_code=e.response.status_code,
                error=str(e)
            )
            raise OllamaServiceError(f"HTTP error: {e.response.status_code}")
        except Exception as e:
            logger.error("ollama_generate_failed", error=str(e))
            raise OllamaServiceError(f"Generation failed: {e}")
    
    async def embed(
        self,
        text: str,
        model: Optional[str] = None
    ) -> List[float]:
        """
        Generate embedding for text
        
        Args:
            text: Text to embed
            model: Embedding model name (defaults to configured embedding model)
            
        Returns:
            List of floats representing the embedding vector
            
        Raises:
            ModelNotFoundError: If model doesn't exist
            OllamaServiceError: If embedding generation fails
        """
        model = model or self.embedding_model
        
        # Validate model exists
        if not await self.validate_model(model):
            raise ModelNotFoundError(f"Embedding model '{model}' not found. Please pull it first: ollama pull {model}")
        
        # Resolve to full model name with tag
        model = await self._resolve_model_name(model)
        
        request_data = {
            "model": model,
            "prompt": text
        }
        
        logger.debug(
            "ollama_embed_request",
            model=model,
            text_length=len(text)
        )
        
        try:
            async def _make_request():
                response = await self.client.post("/api/embeddings", json=request_data)
                response.raise_for_status()
                return response.json()
            
            data = await self._retry_request(_make_request)
            embedding = data.get("embedding", [])
            
            logger.debug(
                "ollama_embed_success",
                model=model,
                embedding_dim=len(embedding)
            )
            
            return embedding
            
        except httpx.HTTPStatusError as e:
            logger.error(
                "ollama_embed_http_error",
                status_code=e.response.status_code,
                error=str(e)
            )
            raise OllamaServiceError(f"HTTP error: {e.response.status_code}")
        except Exception as e:
            logger.error("ollama_embed_failed", error=str(e))
            raise OllamaServiceError(f"Embedding generation failed: {e}")
    
    async def embed_batch(
        self,
        texts: List[str],
        model: Optional[str] = None,
        batch_size: int = 32
    ) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in batches
        
        Args:
            texts: List of texts to embed
            model: Embedding model name
            batch_size: Number of texts to process in parallel
            
        Returns:
            List of embedding vectors
        """
        model = model or self.embedding_model
        
        logger.info(
            "ollama_embed_batch_start",
            total_texts=len(texts),
            batch_size=batch_size,
            model=model
        )
        
        embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            # Process batch in parallel
            tasks = [self.embed(text, model) for text in batch]
            batch_embeddings = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Handle any errors
            for j, result in enumerate(batch_embeddings):
                if isinstance(result, Exception):
                    logger.error(
                        "ollama_embed_batch_item_failed",
                        batch_index=i + j,
                        error=str(result)
                    )
                    # Use zero vector as fallback
                    embeddings.append([0.0] * 768)  # nomic-embed-text dimension
                else:
                    embeddings.append(result)
        
        logger.info(
            "ollama_embed_batch_complete",
            total_embeddings=len(embeddings),
            successful=sum(1 for e in embeddings if sum(e) != 0)
        )
        
        return embeddings
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()
        logger.info("ollama_service_closed")


# Global instance
_ollama_service: Optional[OllamaService] = None


def get_ollama_service() -> OllamaService:
    """Get or create global Ollama service instance"""
    global _ollama_service
    if _ollama_service is None:
        _ollama_service = OllamaService()
    return _ollama_service
