from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole

# --- Base Schemas ---


class OrganizationBase(BaseModel):
    name: str
    domain: str | None = None
    is_active: bool = True


class DepartmentBase(BaseModel):
    name: str
    description: str | None = None
    organization_id: UUID


class PositionBase(BaseModel):
    name: str
    level: str | None = None
    department_id: UUID


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None
    role: UserRole = UserRole.ORG_MEMBER
    is_active: bool = True
    organization_id: UUID
    position_id: UUID | None = None


# --- Create/Update Schemas ---


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: str | None = None
    domain: str | None = None
    is_active: bool | None = None


class OrganizationProfileUpdate(BaseModel):
    """Company profile completed by the org admin during onboarding."""
    name: str | None = Field(default=None, min_length=2, max_length=255)
    industry: str | None = None
    company_size: str | None = None
    region: str | None = None
    website: str | None = None
    description: str | None = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class PositionCreate(PositionBase):
    pass


class PositionUpdate(BaseModel):
    name: str | None = None
    level: str | None = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None
    position_id: UUID | None = None


class MemberCreate(BaseModel):
    """Payload for an org admin to add a member to their OWN organization.

    organization_id is intentionally omitted — it is derived from the admin's org.
    """
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str | None = None
    role: UserRole = UserRole.ORG_MEMBER
    position_id: UUID | None = None


class UserSelfUpdate(BaseModel):
    """Fields a user may change on their own profile (no role/is_active/org)."""
    full_name: str | None = None
    email: EmailStr | None = None


# --- Response Schemas ---


class OrganizationResponse(OrganizationBase):
    id: UUID
    invite_code: str | None = None
    industry: str | None = None
    company_size: str | None = None
    region: str | None = None
    website: str | None = None
    description: str | None = None
    profile_completed: bool = False
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
    last_login: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


# --- Nested / Detailed Responses ---


class DepartmentWithPositions(DepartmentResponse):
    positions: list[PositionResponse] = []


class OrganizationDetailResponse(OrganizationResponse):
    departments: list[DepartmentWithPositions] = []
