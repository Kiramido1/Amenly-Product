import uuid

from sqlalchemy import (
    Boolean,
    Column,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy import (
    Enum as SQLEnum,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database.session import Base
from app.models.enums import AssetType, RiskSeverity
from app.models.identity import TimestampMixin


class Asset(Base, TimestampMixin):
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = Column(String(255), nullable=False)
    type = Column(SQLEnum(AssetType), nullable=False)
    criticality = Column(SQLEnum(RiskSeverity), default=RiskSeverity.MEDIUM)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    properties = Column(JSONB)  # Additional metadata

    # Relationships
    organization = relationship("Organization", back_populates="assets")
    risks = relationship("Risk", back_populates="asset", cascade="all, delete-orphan")


class Risk(Base, TimestampMixin):
    __tablename__ = "risks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(
        UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title = Column(String(255), nullable=False)
    description = Column(Text)
    probability = Column(Float)  # 0.0 to 1.0
    impact = Column(Float)  # 0.0 to 1.0
    severity = Column(SQLEnum(RiskSeverity), nullable=False)
    mitigation_plan = Column(Text)

    # Relationships
    asset = relationship("Asset", back_populates="risks")


class Document(Base, TimestampMixin):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50))
    s3_key = Column(String(512))
    is_processed = Column(Boolean, default=False)

    # Relationships
    chunks = relationship(
        "DocumentChunk", back_populates="document", cascade="all, delete-orphan"
    )


class DocumentChunk(Base, TimestampMixin):
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content = Column(Text, nullable=False)
    # Note: Vector embedding will be stored in Qdrant,
    # but we can store a reference or the embedding if pgvector is used.
    # For now, we follow the architecture which uses Qdrant.
    chunk_index = Column(Integer)
    metadata_json = Column(JSONB)

    # Relationships
    document = relationship("Document", back_populates="chunks")
