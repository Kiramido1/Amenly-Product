import httpx
from app.core.config import settings

class LLMService:
    def __init__(self):
        self.ollama_url = settings.OLLAMA_URL
        self.model = settings.AI_MODEL

    async def generate_response(self, prompt: str) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=60.0
            )
            response.raise_for_status()
            return response.json().get("response", "")

llm_service = LLMService()
