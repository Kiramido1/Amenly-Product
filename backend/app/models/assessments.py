import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, String, Boolean, ForeignKey, Text, Enum as SQLEnum, Integer, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database.session import Base
from app.models.enums import AssessmentStatus, ControlStatus
from app.models.identity import TimestampMixin

class Assessment(Base, TimestampMixin):
    __tablename__ = "assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    framework_id = Column(UUID(as_uuid=True), ForeignKey("frameworks.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    status = Column(SQLEnum(AssessmentStatus), default=AssessmentStatus.PENDING, nullable=False)
    overall_score = Column(Float, nullable=True)

    # Relationships
    framework = relationship("Framework", back_populates="assessments")
    sessions = relationship("AssessmentSession", back_populates="assessment", cascade="all, delete-orphan")

class AssessmentSession(Base, TimestampMixin):
    """A session for a specific user to answer questions for an assessment."""
    __tablename__ = "assessment_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    status = Column(SQLEnum(AssessmentStatus), default=AssessmentStatus.PENDING, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    assessment = relationship("Assessment", back_populates="sessions")
    user = relationship("User", back_populates="assessment_sessions")
    answers = relationship("AssessmentAnswer", back_populates="session", cascade="all, delete-orphan")

class AssessmentAnswer(Base, TimestampMixin):
    __tablename__ = "assessment_answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("assessment_sessions.id"), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("ai_questions.id"), nullable=False, index=True)
    position_id = Column(UUID(as_uuid=True), ForeignKey("positions.id"), nullable=False, index=True)
    
    answer_text = Column(Text)
    compliance_score = Column(Float) # Calculated by AI
    evidence_urls = Column(JSONB) # List of document links
    ai_feedback = Column(Text)
    status = Column(SQLEnum(ControlStatus), default=ControlStatus.NOT_IMPLEMENTED)

    # Relationships
    session = relationship("AssessmentSession", back_populates="answers")
    question = relationship("AIQuestion", back_populates="answers")
    position = relationship("Position", back_populates="assessment_answers")
