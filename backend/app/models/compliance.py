import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, String, Boolean, ForeignKey, Text, Enum as SQLEnum, Integer, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database.session import Base
from app.models.enums import AssessmentStatus, ControlStatus
from app.models.identity import TimestampMixin

class Framework(Base, TimestampMixin):
    __tablename__ = "frameworks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False) # e.g., ISO 27001, NIST CSF
    version = Column(String(50))
    description = Column(Text)

    # Relationships
    organization = relationship("Organization", back_populates="frameworks")
    controls = relationship("FrameworkControl", back_populates="framework", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="framework")

class FrameworkControl(Base, TimestampMixin):
    __tablename__ = "framework_controls"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    framework_id = Column(UUID(as_uuid=True), ForeignKey("frameworks.id"), nullable=False, index=True)
    code = Column(String(50), nullable=False, index=True) # e.g., A.5.1
    title = Column(String(255), nullable=False)
    description = Column(Text)
    guidance = Column(Text)

    # Relationships
    framework = relationship("Framework", back_populates="controls")
    position_mappings = relationship("ControlPosition", back_populates="control", cascade="all, delete-orphan")
    ai_questions = relationship("AIQuestion", back_populates="control", cascade="all, delete-orphan")

class ControlPosition(Base, TimestampMixin):
    """Mapping between controls and positions to determine relevance."""
    __tablename__ = "control_positions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    control_id = Column(UUID(as_uuid=True), ForeignKey("framework_controls.id"), nullable=False, index=True)
    position_id = Column(UUID(as_uuid=True), ForeignKey("positions.id"), nullable=False, index=True)
    importance_weight = Column(Float, default=1.0) # Weight for scoring

    # Relationships
    control = relationship("FrameworkControl", back_populates="position_mappings")
    position = relationship("Position", back_populates="control_mappings")

class AIQuestion(Base, TimestampMixin):
    """AI-generated questions for specific controls and positions."""
    __tablename__ = "ai_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    control_id = Column(UUID(as_uuid=True), ForeignKey("framework_controls.id"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    logic_type = Column(String(50)) # e.g., 'evidence-based', 'process-based'
    expected_evidence = Column(Text)

    # Relationships
    control = relationship("FrameworkControl", back_populates="ai_questions")
    answers = relationship("AssessmentAnswer", back_populates="question")
