import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Column,
    DateTime,
    String,
    Boolean,
    ForeignKey,
    Table,
    Text,
    Enum as SQLEnum,
    Integer,
    Float,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.database.session import Base
from app.models.enums import (
    UserRole,
    AssessmentStatus,
    RiskSeverity,
    AssetType,
    ControlStatus,
)


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
    is_active = Column(Boolean, default=True)

    # Relationships
    departments = relationship(
        "Department", back_populates="organization", cascade="all, delete-orphan"
    )
    users = relationship(
        "User", back_populates="organization", cascade="all, delete-orphan"
    )
    assets = relationship(
        "Asset", back_populates="organization", cascade="all, delete-orphan"
    )
    frameworks = relationship(
        "Framework", back_populates="organization", cascade="all, delete-orphan"
    )


class Department(Base, TimestampMixin):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
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
        UUID(as_uuid=True), ForeignKey("departments.id"), nullable=False, index=True
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
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    position_id = Column(
        UUID(as_uuid=True), ForeignKey("positions.id"), nullable=True, index=True
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
