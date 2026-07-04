"""
Chat and Assessment Communication Models
"""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database.session import Base
from app.models.enums import RiskSeverity, VulnerabilitySource
from app.models.identity import TimestampMixin


class ChatMessage(Base):
    """Messages in assessment chat sessions"""
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("assessment_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_type = Column(String(20), nullable=False)  # 'user' or 'ai'
    message_text = Column(Text, nullable=False)
    message_metadata = Column(JSONB, nullable=True)  # Store sources, confidence, etc.
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    session = relationship("AssessmentSession", back_populates="chat_messages")


class InfrastructureAsset(Base, TimestampMixin):
    """Infrastructure assets extracted from conversations / assessment answers.

    These are the nodes of the infrastructure map. Risk/compliance/status and
    topology position are populated by the assessment analysis pipeline rather
    than being faked in the frontend.
    """
    __tablename__ = "infrastructure_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_session_id = Column(UUID(as_uuid=True), ForeignKey("assessment_sessions.id", ondelete="SET NULL"), nullable=True)
    asset_type = Column(String(100), nullable=False, index=True)  # 'server', 'database', 'firewall', etc.
    asset_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    extracted_from_message_id = Column(UUID(as_uuid=True), nullable=True)  # Link to chat message
    asset_metadata = Column(JSONB, nullable=True)  # Store additional details (OS, version, config, ports…)

    # Ownership / placement in the org (who is responsible → risk per position)
    position_id = Column(UUID(as_uuid=True), ForeignKey("positions.id", ondelete="SET NULL"), nullable=True, index=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)

    # Map + analytics fields (computed by the analysis pipeline)
    ip_address = Column(String(64), nullable=True)
    risk_score = Column(Float, nullable=True)         # 0-100
    compliance_score = Column(Float, nullable=True)   # 0-100
    status = Column(String(30), nullable=True)        # 'secure' | 'warning' | 'critical'
    grid_x = Column(Float, nullable=True)             # map layout position
    grid_y = Column(Float, nullable=True)

    # Relationships
    organization = relationship("Organization")
    assessment_session = relationship("AssessmentSession")
    position = relationship("Position")
    department = relationship("Department")
    vulnerabilities = relationship("Vulnerability", back_populates="asset", cascade="all, delete-orphan")


class Vulnerability(Base, TimestampMixin):
    """A vulnerability detected on an infrastructure asset.

    Populated from the NIST NVD CVE feed (by matching the asset/config
    description) and/or inferred by the AI. Drives the per-device vulnerability
    view and risk scoring on the dashboard.
    """
    __tablename__ = "vulnerabilities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("infrastructure_assets.id", ondelete="CASCADE"), nullable=False, index=True)

    cve_id = Column(String(30), nullable=True, index=True)   # e.g. CVE-2023-1234 (nullable for AI-only findings)
    title = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(SQLEnum(RiskSeverity), default=RiskSeverity.MEDIUM, nullable=False)
    cvss_score = Column(Float, nullable=True)                # 0.0 - 10.0
    remediation = Column(Text, nullable=True)                # how to fix it
    reference_url = Column(String(1024), nullable=True)
    source = Column(SQLEnum(VulnerabilitySource), default=VulnerabilitySource.NVD, nullable=False)
    is_resolved = Column(Boolean, default=False, nullable=False)

    # Relationships
    asset = relationship("InfrastructureAsset", back_populates="vulnerabilities")
    organization = relationship("Organization")


class AssetConnection(Base):
    """An edge between two infrastructure assets — the topology of the map."""
    __tablename__ = "asset_connections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    source_asset_id = Column(UUID(as_uuid=True), ForeignKey("infrastructure_assets.id", ondelete="CASCADE"), nullable=False, index=True)
    target_asset_id = Column(UUID(as_uuid=True), ForeignKey("infrastructure_assets.id", ondelete="CASCADE"), nullable=False, index=True)
    connection_type = Column(String(30), default="network", nullable=False)  # ConnectionType value
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    source_asset = relationship("InfrastructureAsset", foreign_keys=[source_asset_id])
    target_asset = relationship("InfrastructureAsset", foreign_keys=[target_asset_id])
