"""
Chat and Assessment Communication Models
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database.session import Base
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
    """Infrastructure assets extracted from conversations"""
    __tablename__ = "infrastructure_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_session_id = Column(UUID(as_uuid=True), ForeignKey("assessment_sessions.id", ondelete="SET NULL"), nullable=True)
    asset_type = Column(String(100), nullable=False, index=True)  # 'server', 'database', 'firewall', etc.
    asset_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    extracted_from_message_id = Column(UUID(as_uuid=True), nullable=True)  # Link to chat message
    asset_metadata = Column(JSONB, nullable=True)  # Store additional details

    # Relationships
    organization = relationship("Organization")
    assessment_session = relationship("AssessmentSession")
