import secrets
import string
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy import (
    Enum as SQLEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.session import Base
from app.models.enums import (
    JoinRequestStatus,
    UserRole,
)

# Unambiguous alphabet for invite codes (no easily-confused O/0/I/1).
_INVITE_ALPHABET = "".join(
    c for c in (string.ascii_uppercase + string.digits) if c not in "O0I1"
)


def generate_invite_code(length: int = 8) -> str:
    """Generate a short, human-shareable organization invite code."""
    return "".join(secrets.choice(_INVITE_ALPHABET) for _ in range(length))


class TimestampMixin:
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class Organization(Base, TimestampMixin):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    domain = Column(String(255), unique=True, index=True)
    # Single-use code an admin gives out so a new user can request to join this org.
    # It is consumed (set to NULL) once someone submits a join request with it; the
    # admin generates a fresh code to invite the next person.
    invite_code = Column(
        String(12), unique=True, index=True, nullable=True, default=generate_invite_code
    )

    # Company profile — filled in by the org admin during onboarding (the first step
    # of the assessment). Members cannot start an assessment until this is completed.
    industry = Column(String(100), nullable=True)
    company_size = Column(String(50), nullable=True)
    region = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    profile_completed = Column(Boolean, default=False, nullable=False)

    is_active = Column(Boolean, default=True)

    # Relationships - Many-to-Many with Frameworks
    frameworks = relationship(
        "Framework",
        secondary="organization_frameworks",
        back_populates="organizations"
    )
    departments = relationship(
        "Department", back_populates="organization", cascade="all, delete-orphan"
    )
    users = relationship(
        "User", back_populates="organization", cascade="all, delete-orphan"
    )
    assets = relationship(
        "Asset", back_populates="organization", cascade="all, delete-orphan"
    )


class Department(Base, TimestampMixin):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="departments")
    positions = relationship(
        "Position", back_populates="department", cascade="all, delete-orphan"
    )


class Position(Base, TimestampMixin):
    __tablename__ = "positions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_id = Column(
        UUID(as_uuid=True), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = Column(String(255), nullable=False)
    level = Column(String(50), nullable=True)  # e.g., Junior, Senior, Head

    # Relationships
    department = relationship("Department", back_populates="positions")
    users = relationship("User", back_populates="position")
    control_mappings = relationship("ControlPosition", back_populates="position")
    assessment_answers = relationship("AssessmentAnswer", back_populates="position")


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    position_id = Column(
        UUID(as_uuid=True), ForeignKey("positions.id", ondelete="SET NULL"), nullable=True, index=True
    )

    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(SQLEnum(UserRole), default=UserRole.ORG_MEMBER, nullable=False)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="users")
    position = relationship("Position", back_populates="users")
    assessment_sessions = relationship("AssessmentSession", back_populates="user")
    custom_permissions = relationship("UserRolePermission", foreign_keys="[UserRolePermission.user_id]", back_populates="user", cascade="all, delete-orphan")


class OrganizationJoinRequest(Base, TimestampMixin):
    """A pending request from a new person to join an existing organization.

    The actual ``User`` row is NOT created until an admin approves the request, so
    the applicant cannot log in while pending. The credentials they chose at signup
    are stored here (password already hashed) and used to create the user on approval.
    """

    __tablename__ = "organization_join_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    email = Column(String(255), nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    status = Column(
        SQLEnum(JoinRequestStatus),
        default=JoinRequestStatus.PENDING,
        nullable=False,
        index=True,
    )
    reviewed_by_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_at = Column(DateTime, nullable=True)

    # Relationships
    organization = relationship("Organization")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
