import pytest
from httpx import AsyncClient
from tests.utils.auth import AuthTestHelper

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    # Register first
    auth_data = await AuthTestHelper.register_admin(client)
    email = auth_data["user"]["email"]
    
    # Login
    response = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "StrongPassword123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == email

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    response = await client.post("/api/v1/auth/login", json={
        "email": "wrong@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
