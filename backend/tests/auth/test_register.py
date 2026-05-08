import pytest
from httpx import AsyncClient
from tests.utils.factories import TestDataFactory

@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    org_data = TestDataFactory.random_organization()
    user_data = TestDataFactory.random_user()
    
    payload = {
        "email": user_data["email"],
        "password": user_data["password"],
        "full_name": user_data["full_name"],
        "organization_name": org_data["name"],
        "department_name": "Engineering",
        "position_name": "Senior Developer"
    }
    
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["email"] == user_data["email"]

@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    # First registration
    user_data = TestDataFactory.random_user()
    payload = {
        "email": user_data["email"],
        "password": user_data["password"],
        "full_name": user_data["full_name"],
        "organization_name": "Org 1"
    }
    await client.post("/api/v1/auth/register", json=payload)
    
    # Second registration with same email
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "exists" in response.json()["detail"]

@pytest.mark.asyncio
async def test_register_invalid_data(client: AsyncClient):
    payload = {
        "email": "invalid-email",
        "password": "short",
        "full_name": "",
        "organization_name": ""
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
