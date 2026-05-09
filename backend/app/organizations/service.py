from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.organizations.repository import OrganizationRepository
from app.schemas.identity import (
    DepartmentCreate, DepartmentUpdate, 
    PositionCreate, PositionUpdate,
    OrganizationUpdate
)
from app.models.identity import Organization, Department, Position

class OrganizationService:
    def __init__(self, session: AsyncSession):
        self.repo = OrganizationRepository(session)

    # --- Organization ---
    async def get_organization_details(self, org_id: UUID) -> Organization:
        org = await self.repo.get_org_by_id(org_id)
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        return org

    async def update_organization(self, org_id: UUID, org_in: OrganizationUpdate) -> Organization:
        update_data = org_in.model_dump(exclude_unset=True)
        return await self.repo.update_org(org_id, update_data)

    # --- Departments ---
    async def create_new_department(self, org_id: UUID, dept_in: DepartmentCreate) -> Department:
        # Business Rule: Ensure dept name is unique within the organization
        existing_depts = await self.repo.get_departments(org_id)
        if any(d.name.lower() == dept_in.name.lower() for d in existing_depts):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Department with name '{dept_in.name}' already exists in this organization"
            )
        
        dept_data = dept_in.model_dump()
        dept_data["organization_id"] = org_id
        return await self.repo.create_department(dept_data)

    async def list_departments(self, org_id: UUID) -> List[Department]:
        return await self.repo.get_departments(org_id)

    # --- Positions ---
    async def create_new_position(self, org_id: UUID, pos_in: PositionCreate) -> Position:
        # Validate that department belongs to the organization
        dept = await self.repo.get_department_by_id(pos_in.department_id)
        if not dept or dept.organization_id != org_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found in your organization"
            )
            
        pos_data = pos_in.model_dump()
        return await self.repo.create_position(pos_data)

    async def list_positions(self, dept_id: UUID, org_id: UUID) -> List[Position]:
        dept = await self.repo.get_department_by_id(dept_id)
        if not dept or dept.organization_id != org_id:
            raise HTTPException(status_code=404, detail="Department not found")
        return await self.repo.get_positions(dept_id)
        
    async def delete_dept(self, dept_id: UUID, org_id: UUID) -> None:
        dept = await self.repo.get_department_by_id(dept_id)
        if not dept or dept.organization_id != org_id:
            raise HTTPException(status_code=404, detail="Department not found")
        await self.repo.delete_department(dept_id)

    async def delete_pos(self, pos_id: UUID, org_id: UUID) -> None:
        pos = await self.repo.get_position_by_id(pos_id)
        if not pos:
            raise HTTPException(status_code=404, detail="Position not found")
        
        dept = await self.repo.get_department_by_id(pos.department_id)
        if not dept or dept.organization_id != org_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this position")
            
        await self.repo.delete_position(pos_id)
