from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.enums import UserRole
from app.schemas.identity import UserResponse, OrganizationResponse

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    sub: Optional[str] = None
    type: Optional[str] = None

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str
    organization_name: str
    department_name: Optional[str] = None
    position_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class Msg(BaseModel):
    msg: str

class GenericResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)
