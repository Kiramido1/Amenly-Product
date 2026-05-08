from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.identity import User, Organization, Department, Position
from app.auth.security import get_password_hash
from app.models.enums import UserRole

class AuthRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user_by_email(self, email: str) -> Optional[User]:
        result = await self.session.execute(
            select(User).where(User.email == email).options(
                selectinload(User.organization),
                selectinload(User.position).selectinload(Position.department)
            )
        )
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        result = await self.session.execute(
            select(User).where(User.id == user_id).options(
                selectinload(User.organization),
                selectinload(User.position).selectinload(Position.department)
            )
        )
        return result.scalar_one_or_none()

    async def create_organization(self, name: str) -> Organization:
        db_org = Organization(name=name)
        self.session.add(db_org)
        await self.session.flush()
        return db_org

    async def get_or_create_department(self, org_id: UUID, name: str) -> Department:
        result = await self.session.execute(
            select(Department).where(
                Department.organization_id == org_id,
                Department.name == name
            )
        )
        db_dept = result.scalar_one_or_none()
        if not db_dept:
            db_dept = Department(organization_id=org_id, name=name)
            self.session.add(db_dept)
            await self.session.flush()
        return db_dept

    async def get_or_create_position(self, dept_id: UUID, name: str) -> Position:
        result = await self.session.execute(
            select(Position).where(
                Position.department_id == dept_id,
                Position.name == name
            )
        )
        db_pos = result.scalar_one_or_none()
        if not db_pos:
            db_pos = Position(department_id=dept_id, name=name)
            self.session.add(db_pos)
            await self.session.flush()
        return db_pos

    async def create_user(self, user_data: dict) -> User:
        user_data["hashed_password"] = get_password_hash(user_data.pop("password"))
        db_user = User(**user_data)
        self.session.add(db_user)
        await self.session.commit()
        await self.session.refresh(db_user)
        return db_user

    async def get_users(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        org_id: Optional[UUID] = None
    ) -> Tuple[List[User], int]:
        query = select(User).options(
            selectinload(User.organization),
            selectinload(User.position).selectinload(Position.department)
        )
        if org_id:
            query = query.where(User.organization_id == org_id)
        
        # Count total
        count_query = select(func.count()).select_from(User)
        if org_id:
            count_query = count_query.where(User.organization_id == org_id)
        
        total = await self.session.execute(count_query)
        total_count = total.scalar() or 0
        
        result = await self.session.execute(query.offset(skip).limit(limit))
        return list(result.scalars().all()), total_count

    async def delete_user(self, user: User) -> None:
        user.is_active = False # Soft delete
        self.session.add(user)
        await self.session.commit()
