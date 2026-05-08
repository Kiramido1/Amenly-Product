from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.enums import UserRole

# --- Organization ---
class OrganizationBase(BaseModel):
    name: str
    domain: Optional[str] = None
    is_active: bool = True

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    is_active: Optional[bool] = None

class OrganizationResponse(OrganizationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Department ---
class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    organization_id: UUID

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class DepartmentResponse(DepartmentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Position ---
class PositionBase(BaseModel):
    name: str
    level: Optional[str] = None
    department_id: UUID

class PositionCreate(PositionBase):
    pass

class PositionUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[str] = None

class PositionResponse(PositionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- User ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.ORG_MEMBER
    is_active: bool = True
    organization_id: UUID
    position_id: Optional[UUID] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    position_id: Optional[UUID] = None

class UserResponse(UserBase):
    id: UUID
    is_superuser: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
