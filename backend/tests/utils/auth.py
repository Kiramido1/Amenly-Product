from httpx import AsyncClient
from typing import Any, Dict
from tests.utils.factories import TestDataFactory


class AuthTestHelper:
    @staticmethod
    async def register_admin(client: AsyncClient) -> dict:
        org_data = TestDataFactory.random_organization()
        user_data = TestDataFactory.random_user()

        payload = {
            "email": user_data["email"],
            "password": user_data["password"],
            "full_name": user_data["full_name"],
            "organization_name": org_data["name"],
            "department_name": "Engineering",
            "position_name": "CTO",
        }

        response = await client.post("/api/v1/auth/register", json=payload)
        return response.json()["data"]

    @staticmethod
    async def login_user(client: AsyncClient, email: str, password: str) -> dict:
        payload = {"email": email, "password": password}
        response = await client.post("/api/v1/auth/login", json=payload)
        return response.json()
