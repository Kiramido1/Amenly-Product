import pytest
from httpx import AsyncClient
from tests.utils.auth import AuthTestHelper
from tests.utils.client import TestClient

@pytest.mark.asyncio
async def test_get_my_organization(client: AsyncClient):
    auth_data = await AuthTestHelper.register_admin(client)
    authed_client = TestClient(client, auth_data["access_token"])
    
    response = await authed_client.get("/api/v1/orgs/me")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "departments" in data["data"]["organization"]

@pytest.mark.asyncio
async def test_create_department(client: AsyncClient):
    auth_data = await AuthTestHelper.register_admin(client)
    admin_client = TestClient(client, auth_data["access_token"])
    
    payload = {
        "name": "New Dept",
        "description": "Desc",
        "organization_id": auth_data["user"]["organization_id"]
    }
    
    response = await admin_client.post("/api/v1/orgs/departments", json=payload)
    assert response.status_code == 201
    assert response.json()["data"]["department"]["name"] == "New Dept"
