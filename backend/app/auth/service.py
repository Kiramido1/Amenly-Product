from typing import Optional, List, Tuple
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.repository import AuthRepository
from app.auth.schemas import UserRegister, UserLogin, Token
from app.auth.security import verify_password, create_access_token, create_refresh_token
from app.models.enums import UserRole
from app.models.identity import User

class AuthService:
    def __init__(self, session: AsyncSession):
        self.repo = AuthRepository(session)

    async def register_user(self, user_in: UserRegister) -> User:
        user = await self.repo.get_user_by_email(user_in.email)
        if user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists",
            )
        
        # Create organization
        org = await self.repo.create_organization(user_in.organization_name)
        
        # Create dept and position if provided
        dept_id = None
        pos_id = None
        if user_in.department_name:
            dept = await self.repo.get_or_create_department(org.id, user_in.department_name)
            dept_id = dept.id
            if user_in.position_name:
                pos = await self.repo.get_or_create_position(dept.id, user_in.position_name)
                pos_id = pos.id

        user_data = {
            "email": user_in.email,
            "password": user_in.password,
            "full_name": user_in.full_name,
            "organization_id": org.id,
            "position_id": pos_id,
            "role": UserRole.ORG_ADMIN, # First user is admin
            "is_active": True
        }
        
        return await self.repo.create_user(user_data)

    async def authenticate_user(self, login_in: UserLogin) -> User:
        user = await self.repo.get_user_by_email(login_in.email)
        if not user or not verify_password(login_in.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user",
            )
        return user

    def create_tokens(self, user_id: UUID) -> dict:
        return {
            "access_token": create_access_token(user_id),
            "refresh_token": create_refresh_token(user_id),
            "token_type": "bearer"
        }

    async def get_users_list(
        self, skip: int, limit: int, org_id: Optional[UUID] = None
    ) -> Tuple[List[User], int]:
        return await self.repo.get_users(skip=skip, limit=limit, org_id=org_id)

    async def get_user_by_id(self, user_id: UUID) -> User:
        user = await self.repo.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user
