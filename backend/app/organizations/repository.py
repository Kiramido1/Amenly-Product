from uuid import UUID

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.identity import Department, Organization, Position


class OrganizationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # --- Organization ---
    async def get_org_by_id(self, org_id: UUID) -> Organization | None:
        result = await self.session.execute(
            select(Organization).where(Organization.id == org_id)
            .options(selectinload(Organization.departments).selectinload(Department.positions))
        )
        return result.scalar_one_or_none()

    async def update_org(self, org_id: UUID, data: dict) -> Organization | None:
        await self.session.execute(
            update(Organization).where(Organization.id == org_id).values(**data)
        )
        await self.session.commit()
        return await self.get_org_by_id(org_id)

    # --- Department ---
    async def create_department(self, data: dict) -> Department:
        db_dept = Department(**data)
        self.session.add(db_dept)
        await self.session.commit()
        await self.session.refresh(db_dept)
        return db_dept

    async def get_departments(self, org_id: UUID) -> list[Department]:
        result = await self.session.execute(
            select(Department).where(Department.organization_id == org_id)
            .options(selectinload(Department.positions))
        )
        return list(result.scalars().all())

    async def get_department_by_id(self, dept_id: UUID) -> Department | None:
        result = await self.session.execute(
            select(Department).where(Department.id == dept_id)
            .options(selectinload(Department.positions))
        )
        return result.scalar_one_or_none()

    # --- Position ---
    async def create_position(self, data: dict) -> Position:
        db_pos = Position(**data)
        self.session.add(db_pos)
        await self.session.commit()
        await self.session.refresh(db_pos)
        return db_pos

    async def get_positions(self, dept_id: UUID) -> list[Position]:
        result = await self.session.execute(
            select(Position).where(Position.department_id == dept_id)
        )
        return list(result.scalars().all())

    async def get_position_by_id(self, pos_id: UUID) -> Position | None:
        result = await self.session.execute(
            select(Position).where(Position.id == pos_id)
        )
        return result.scalar_one_or_none()

    async def delete_department(self, dept_id: UUID) -> None:
        await self.session.execute(delete(Department).where(Department.id == dept_id))
        await self.session.commit()

    async def delete_position(self, pos_id: UUID) -> None:
        await self.session.execute(delete(Position).where(Position.id == pos_id))
        await self.session.commit()
