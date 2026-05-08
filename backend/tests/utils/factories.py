from faker import Faker
from typing import Any, Dict
import uuid

fake = Faker()


class TestDataFactory:
    @staticmethod
    def random_organization() -> dict:
        return {
            "name": fake.company(),
            "domain": f"{fake.domain_name()}_{uuid.uuid4().hex[:8]}",
        }

    @staticmethod
    def random_user(org_id: uuid.UUID = None, pos_id: uuid.UUID = None) -> dict:
        return {
            "email": fake.email(),
            "password": "StrongPassword123!",
            "full_name": fake.name(),
            "organization_id": org_id,
            "position_id": pos_id,
        }

    @staticmethod
    def random_department(org_id: uuid.UUID) -> dict:
        return {
            "name": fake.department(),
            "description": fake.catch_phrase(),
            "organization_id": org_id,
        }

    @staticmethod
    def random_position(dept_id: uuid.UUID) -> dict:
        return {"name": fake.job(), "level": "Senior", "department_id": dept_id}
