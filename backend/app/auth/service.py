from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.repository import AuthRepository
from app.auth.schemas import JoinRequestCreate, UserLogin, UserRegister
from app.auth.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
)
from app.auth.token_manager import token_manager
from app.database.session import AsyncSessionLocal
from app.models.enums import JoinRequestStatus, UserRole
from app.models.identity import (
    Department,
    OrganizationJoinRequest,
    Position,
    User,
)
from app.schemas.identity import MemberCreate


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
            dept = await self.repo.get_or_create_department(
                org.id, user_in.department_name
            )
            dept_id = dept.id
            if user_in.position_name:
                pos = await self.repo.get_or_create_position(
                    dept.id, user_in.position_name
                )
                pos_id = pos.id

        user_data = {
            "email": user_in.email,
            "password": user_in.password,
            "full_name": user_in.full_name,
            "organization_id": org.id,
            "position_id": pos_id,
            "role": UserRole.ORG_ADMIN,  # First user is admin
            "is_active": True,
        }

        user = await self.repo.create_user(user_data)

        # Auto-assign role permissions in a separate session
        await self._assign_role_permissions(user)

        return user

    async def _assign_role_permissions(self, user: User) -> None:
        """Assign default role permissions using UserRolePermission model"""
        from app.models.permissions import UserRolePermission, get_role_permissions

        role_perms = get_role_permissions(user.role.value if hasattr(user.role, 'value') else user.role)
        perm_values = [p.value for p in role_perms]

        if not perm_values:
            return

        async with AsyncSessionLocal() as db:
            # Check if record already exists
            result = await db.execute(
                select(UserRolePermission).where(UserRolePermission.user_id == user.id)
            )
            user_perm = result.scalar_one_or_none()

            if user_perm:
                # Merge permissions
                existing = set(user_perm.permissions or [])
                user_perm.permissions = list(existing | set(perm_values))
            else:
                # Create new record
                user_perm = UserRolePermission(
                    user_id=user.id,
                    permissions=perm_values,
                    is_active=True,
                    notes="Auto-assigned on registration"
                )
                db.add(user_perm)

            await db.commit()

    # --- Organization join requests ---

    async def request_join(self, data: JoinRequestCreate) -> OrganizationJoinRequest:
        """A new person asks to join an existing organization using its invite code.

        Creates a PENDING request only — no user is created and no login is possible
        until an org admin approves it.
        """
        org = await self.repo.get_organization_by_invite_code(data.invite_code)
        if not org or not org.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid invite code",
            )

        # Email must not already belong to an active account.
        if await self.repo.get_user_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists",
            )

        # Avoid duplicate pending requests for the same email.
        if await self.repo.get_pending_join_request_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A join request for this email is already pending approval",
            )

        # The invite code is single-use: consume it now so it cannot be reused. The
        # admin generates a fresh code to invite the next person.
        org.invite_code = None
        self.repo.session.add(org)

        return await self.repo.create_join_request({
            "organization_id": org.id,
            "email": data.email,
            "hashed_password": get_password_hash(data.password),
            "full_name": data.full_name,
            "status": JoinRequestStatus.PENDING,
        })

    async def list_join_requests(self, org_id: UUID) -> list[OrganizationJoinRequest]:
        return await self.repo.get_join_requests(org_id, JoinRequestStatus.PENDING)

    async def _get_pending_request_for_org(
        self, request_id: UUID, org_id: UUID
    ) -> OrganizationJoinRequest:
        req = await self.repo.get_join_request_by_id(request_id)
        if not req or req.organization_id != org_id:
            raise HTTPException(status_code=404, detail="Join request not found")
        if req.status != JoinRequestStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This request has already been reviewed",
            )
        return req

    async def approve_join_request(
        self, request_id: UUID, org_id: UUID, reviewer: User
    ) -> User:
        """Approve a pending request: create the member user and close the request."""
        req = await self._get_pending_request_for_org(request_id, org_id)

        # Guard against the email being taken between request and approval.
        if await self.repo.get_user_by_email(req.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists",
            )

        user = await self.repo.create_user_prehashed({
            "email": req.email,
            "hashed_password": req.hashed_password,
            "full_name": req.full_name,
            "organization_id": org_id,
            "role": UserRole.ORG_MEMBER,
            "is_active": True,
        })
        await self._assign_role_permissions(user)

        req.status = JoinRequestStatus.APPROVED
        req.reviewed_by_id = reviewer.id
        req.reviewed_at = datetime.utcnow()
        self.repo.session.add(req)
        await self.repo.session.commit()
        return user

    async def reject_join_request(
        self, request_id: UUID, org_id: UUID, reviewer: User
    ) -> None:
        req = await self._get_pending_request_for_org(request_id, org_id)
        req.status = JoinRequestStatus.REJECTED
        req.reviewed_by_id = reviewer.id
        req.reviewed_at = datetime.utcnow()
        self.repo.session.add(req)
        await self.repo.session.commit()

    async def create_member(self, org_id: UUID, data: MemberCreate) -> User:
        """Create a new user inside an EXISTING organization (admin action)."""
        existing = await self.repo.get_user_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists",
            )

        # If a position is supplied, it must belong to the admin's organization.
        if data.position_id is not None:
            result = await self.repo.session.execute(
                select(Position.id)
                .join(Department, Position.department_id == Department.id)
                .where(Position.id == data.position_id, Department.organization_id == org_id)
            )
            if result.scalar_one_or_none() is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="position_id does not belong to your organization",
                )

        user = await self.repo.create_user({
            "email": data.email,
            "password": data.password,
            "full_name": data.full_name,
            "organization_id": org_id,
            "position_id": data.position_id,
            "role": data.role,
            "is_active": True,
        })
        await self._assign_role_permissions(user)
        return user

    async def change_password(self, user: User, current_password: str, new_password: str) -> None:
        """Change a user's password after verifying the current one; revokes tokens."""
        if not verify_password(current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )
        user.hashed_password = get_password_hash(new_password)
        self.repo.session.add(user)
        await self.repo.session.commit()
        # Invalidate existing sessions so the old password's tokens stop working.
        await token_manager.revoke_user_tokens(user.id)

    async def authenticate_user(self, login_in: UserLogin) -> User:
        user = await self.repo.get_user_by_email(login_in.email)
        if not user:
            # Give applicants whose request is still pending a clear message instead
            # of a generic credentials error.
            pending = await self.repo.get_pending_join_request_by_email(login_in.email)
            if pending:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your request to join is pending approval by an organization admin",
                )
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

    async def create_tokens(self, user_id: UUID, revoke_old: bool = True) -> dict:
        """
        Create new access and refresh tokens
        
        Args:
            user_id: User UUID
            revoke_old: If True, revoke old access token when creating new one
            
        Returns:
            Dictionary with access_token, refresh_token, and token_type
        """
        access_token = create_access_token(user_id)
        refresh_token = create_refresh_token(user_id)

        # Revoke old access token and store new one
        if revoke_old:
            await token_manager.revoke_old_access_token(user_id, access_token)
        else:
            await token_manager.store_active_token(user_id, access_token, "access")

        # Store refresh token
        await token_manager.store_active_token(user_id, refresh_token, "refresh")

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    async def get_users_list(
        self, skip: int, limit: int, org_id: UUID | None = None
    ) -> tuple[list[User], int]:
        return await self.repo.get_users(skip=skip, limit=limit, org_id=org_id)

    async def get_user_by_id(self, user_id: UUID) -> User:
        user = await self.repo.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user",
            )
        return user
