import asyncio
import json
import uuid
from faker import Faker
from sqlalchemy import select
import bcrypt
from app.database.session import AsyncSessionLocal
from app.database.base import Base  # Import all models to register them with SQLAlchemy
from app.models.identity import Organization, User
from app.models.enums import UserRole


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


fake = Faker()


async def seed_first_org():
    async with AsyncSessionLocal() as session:
        # 1. Create Organization "first"
        org_name = "first"
        result = await session.execute(
            select(Organization).where(Organization.name == org_name)
        )
        db_org = result.scalar_one_or_none()

        if not db_org:
            db_org = Organization(name=org_name, domain="first.com")
            session.add(db_org)
            await session.flush()
            print(f"Organization '{org_name}' created.")
        else:
            print(f"Organization '{org_name}' already exists.")

        credentials = {"organization": org_name, "admin": [], "members": []}

        # 2. Create 1 Org Admin
        admin_email = "admin@first.com"
        admin_password = "AdminPassword123!"

        result = await session.execute(select(User).where(User.email == admin_email))
        admin_user = result.scalar_one_or_none()
        if not admin_user:
            admin_user = User(
                email=admin_email,
                hashed_password=get_password_hash(admin_password),
                full_name="First Org Admin",
                role=UserRole.ORG_ADMIN,
                organization_id=db_org.id,
                is_active=True,
            )
            session.add(admin_user)
            print(f"Admin user {admin_email} created.")
        else:
            print(f"Admin user {admin_email} already exists.")

        credentials["admin"].append(
            {
                "email": admin_email,
                "password": admin_password,
                "full_name": admin_user.full_name,
                "role": "ORG_ADMIN",
            }
        )

        # 3. Create 5 Org Members
        for i in range(1, 6):
            member_email = f"member{i}@first.com"
            member_password = f"MemberPass{i}!"

            result = await session.execute(
                select(User).where(User.email == member_email)
            )
            member_user = result.scalar_one_or_none()
            if not member_user:
                member_name = fake.name()
                member_user = User(
                    email=member_email,
                    hashed_password=get_password_hash(member_password),
                    full_name=member_name,
                    role=UserRole.ORG_MEMBER,
                    organization_id=db_org.id,
                    is_active=True,
                )
                session.add(member_user)
                print(f"Member user {member_email} created.")
            else:
                member_name = member_user.full_name
                print(f"Member user {member_email} already exists.")

            credentials["members"].append(
                {
                    "email": member_email,
                    "password": member_password,
                    "full_name": member_name,
                    "role": "ORG_MEMBER",
                }
            )

        await session.commit()

        # 4. Save to JSON
        with open("first_org_credentials.json", "w") as f:
            json.dump(credentials, f, indent=4)

        print("\nSuccess! Credentials saved to 'first_org_credentials.json'")


if __name__ == "__main__":
    asyncio.run(seed_first_org())
