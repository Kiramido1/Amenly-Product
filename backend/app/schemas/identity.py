from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.enums import UserRole

# --- Base Schemas ---


class OrganizationBase(BaseModel):
    name: str
    domain: Optional[str] = None
    is_active: bool = True


class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    organization_id: UUID


class PositionBase(BaseModel):
    name: str
    level: Optional[str] = None
    department_id: UUID


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.ORG_MEMBER
    is_active: bool = True
    organization_id: UUID
    position_id: Optional[UUID] = None


# --- Create/Update Schemas ---


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    is_active: Optional[bool] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class PositionCreate(PositionBase):
    pass


class PositionUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    position_id: Optional[UUID] = None


# --- Response Schemas ---


class OrganizationResponse(OrganizationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DepartmentResponse(DepartmentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PositionResponse(PositionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# --- Nested / Detailed Responses ---


class DepartmentWithPositions(DepartmentResponse):
    positions: List[PositionResponse] = []


class OrganizationDetailResponse(OrganizationResponse):
    departments: List[DepartmentWithPositions] = []
