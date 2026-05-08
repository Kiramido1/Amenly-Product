from httpx import AsyncClient
from typing import Optional


class TestClient:
    def __init__(self, client: AsyncClient, token: Optional[str] = None):
        self.client = client
        self.token = token

    def set_token(self, token: str):
        self.token = token

    def _get_headers(self):
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}

    async def get(self, url: str, params: Optional[dict] = None):
        return await self.client.get(url, params=params, headers=self._get_headers())

    async def post(self, url: str, json: Optional[dict] = None):
        return await self.client.post(url, json=json, headers=self._get_headers())

    async def patch(self, url: str, json: Optional[dict] = None):
        return await self.client.patch(url, json=json, headers=self._get_headers())

    async def delete(self, url: str):
        return await self.client.delete(url, headers=self._get_headers())
