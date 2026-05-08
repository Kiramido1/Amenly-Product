import pytest
from httpx import AsyncClient
from tests.utils.auth import AuthTestHelper
from tests.utils.client import TestClient

@pytest.mark.asyncio
async def test_get_users_admin_only(client: AsyncClient):
    # Admin user
    admin_auth = await AuthTestHelper.register_admin(client)
    admin_client = TestClient(client, admin_auth["access_token"])
    
    response = await admin_client.get("/api/v1/users/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]["users"]) >= 1

@pytest.mark.asyncio
async def test_get_users_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/users/")
    assert response.status_code == 401
