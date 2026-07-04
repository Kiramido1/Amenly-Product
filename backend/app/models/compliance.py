import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Table, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.session import Base
from app.models.enums import FrameworkCategory, FrameworkType
from app.models.identity import TimestampMixin

# Junction table for Many-to-Many relationship between Organizations and Frameworks
organization_frameworks = Table(
    'organization_frameworks',
    Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column('organization_id', UUID(as_uuid=True), ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
    Column('framework_id', UUID(as_uuid=True), ForeignKey('frameworks.id', ondelete='CASCADE'), nullable=False, index=True),
    Column('created_at', DateTime, default=datetime.utcnow, nullable=False),
    Column('updated_at', DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False),
)

class Framework(Base, TimestampMixin):
    __tablename__ = "frameworks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False) # e.g., ISO 27001, NIST CSF
    version = Column(String(50))
    description = Column(Text)

    # Professional columns
    framework_type = Column(SQLEnum(FrameworkType), nullable=False, default=FrameworkType.STANDARD, index=True)
    category = Column(SQLEnum(FrameworkCategory), nullable=False, default=FrameworkCategory.GENERAL, index=True)
    region = Column(String(100), nullable=True)  # e.g., "United States", "European Union", "Global"
    industry = Column(String(100), nullable=True)  # e.g., "Healthcare", "Financial", "General"
    is_mandatory = Column(Boolean, default=False)  # Is it legally required?
    official_url = Column(String(512), nullable=True)  # Official documentation URL

    # Relationships - Many-to-Many with Organizations
    organizations = relationship(
        "Organization",
        secondary=organization_frameworks,
        back_populates="frameworks"
    )
    controls = relationship("FrameworkControl", back_populates="framework", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="framework")

class FrameworkControl(Base, TimestampMixin):
    __tablename__ = "framework_controls"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    framework_id = Column(UUID(as_uuid=True), ForeignKey("frameworks.id", ondelete="CASCADE"), nullable=False, index=True)
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
    control_id = Column(UUID(as_uuid=True), ForeignKey("framework_controls.id", ondelete="CASCADE"), nullable=False, index=True)
    position_id = Column(UUID(as_uuid=True), ForeignKey("positions.id", ondelete="CASCADE"), nullable=False, index=True)
    importance_weight = Column(Float, default=1.0) # Weight for scoring

    # Relationships
    control = relationship("FrameworkControl", back_populates="position_mappings")
    position = relationship("Position", back_populates="control_mappings")

class AIQuestion(Base, TimestampMixin):
    """AI-generated questions for specific controls and positions."""
    __tablename__ = "ai_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    control_id = Column(UUID(as_uuid=True), ForeignKey("framework_controls.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    logic_type = Column(String(50)) # e.g., 'evidence-based', 'process-based'
    expected_evidence = Column(Text)

    # Device / configuration dimension — lets questions target specific assets
    # (servers, firewalls, workstations, network gear) and the exact settings to probe.
    device_category = Column(String(100), nullable=True, index=True)  # e.g. 'server', 'firewall', 'workstation', 'network', 'cloud'
    config_focus = Column(Text, nullable=True)   # the specific configuration detail this question inspects
    order_index = Column(Integer, default=0, nullable=False)  # ordering within a position's question set

    # Relationships
    control = relationship("FrameworkControl", back_populates="ai_questions")
    answers = relationship("AssessmentAnswer", back_populates="question")
