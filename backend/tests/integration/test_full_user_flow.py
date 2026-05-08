import pytest
from httpx import AsyncClient
from tests.utils.factories import TestDataFactory
from tests.utils.client import TestClient

@pytest.mark.asyncio
async def test_full_admin_onboarding_flow(client: AsyncClient):
    # 1. Register Admin
    org_data = TestDataFactory.random_organization()
    user_data = TestDataFactory.random_user()
    
    reg_payload = {
        "email": user_data["email"],
        "password": user_data["password"],
        "full_name": user_data["full_name"],
        "organization_name": org_data["name"]
    }
    
    reg_resp = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    token = reg_resp.json()["data"]["access_token"]
    admin_client = TestClient(client, token)
    
    # 2. Create Department
    dept_payload = {
        "name": "Security",
        "organization_id": reg_resp.json()["data"]["user"]["organization_id"]
    }
    dept_resp = await admin_client.post("/api/v1/organizations/departments", json=dept_payload)
    assert dept_resp.status_code == 201
    dept_id = dept_resp.json()["data"]["department"]["id"]
    
    # 3. Create Position
    pos_payload = {
        "name": "CISO",
        "department_id": dept_id
    }
    pos_resp = await admin_client.post("/api/v1/organizations/positions", json=pos_payload)
    assert pos_resp.status_code == 201
    
    # 4. Verify Org Structure
    me_resp = await admin_client.get("/api/v1/organizations/me")
    assert me_resp.status_code == 200
    org_details = me_resp.json()["data"]["organization"]
    assert len(org_details["departments"]) >= 1
