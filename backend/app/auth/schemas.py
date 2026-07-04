from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import JoinRequestStatus
from app.schemas.identity import UserResponse


def _normalize_email(v):
    """Trim surrounding whitespace and lowercase emails so accidental spaces/case
    (e.g. a copy-paste leading space) don't cause spurious auth failures."""
    return v.strip().lower() if isinstance(v, str) else v


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    sub: str | None = None
    type: str | None = None

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str
    organization_name: str
    department_name: str | None = None
    position_name: str | None = None

    _norm_email = field_validator("email", mode="before")(_normalize_email)

class JoinRequestCreate(BaseModel):
    """Public payload to request joining an existing organization via its invite code."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str
    invite_code: str = Field(..., min_length=4, max_length=12)

    _norm_email = field_validator("email", mode="before")(_normalize_email)

    @field_validator("invite_code", mode="before")
    @classmethod
    def _norm_code(cls, v):
        return v.strip().upper() if isinstance(v, str) else v


class JoinRequestResponse(BaseModel):
    """Admin-facing view of a pending join request."""
    id: UUID
    email: EmailStr
    full_name: str | None = None
    status: JoinRequestStatus
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    _norm_email = field_validator("email", mode="before")(_normalize_email)

class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class Msg(BaseModel):
    msg: str

class GenericResponse(BaseModel):
    success: bool
    message: str
    data: dict | None = None

    model_config = ConfigDict(from_attributes=True)
