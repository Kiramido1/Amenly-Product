import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database.session import Base
from app.models.enums import AssessmentPhase, AssessmentStatus, ControlStatus
from app.models.identity import TimestampMixin


class Assessment(Base, TimestampMixin):
    """
    An assessment campaign for one organization against one framework.

    Lifecycle is admin-driven: the org admin launches it, members complete
    their position-scoped sessions, and it auto-closes when everyone is done.
    The before/after (run-twice) flow is tracked via ``current_phase`` and the
    ``baseline_score`` / ``remediation_score`` snapshots.
    """
    __tablename__ = "assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    framework_id = Column(UUID(as_uuid=True), ForeignKey("frameworks.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    status = Column(SQLEnum(AssessmentStatus), default=AssessmentStatus.PENDING, nullable=False)
    overall_score = Column(Float, nullable=True)

    # Campaign lifecycle (admin-driven)
    current_phase = Column(SQLEnum(AssessmentPhase), default=AssessmentPhase.BASELINE, nullable=False)
    launched_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    launched_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)

    # Before/after score snapshots
    baseline_score = Column(Float, nullable=True)       # avg compliance after the first pass
    remediation_score = Column(Float, nullable=True)    # avg compliance after the second pass
    regulation_score = Column(Float, nullable=True)     # region-regulation alignment score

    # Relationships
    framework = relationship("Framework", back_populates="assessments")
    launched_by = relationship("User", foreign_keys=[launched_by_id])
    sessions = relationship("AssessmentSession", back_populates="assessment", cascade="all, delete-orphan")

class AssessmentSession(Base, TimestampMixin):
    """A session for a specific user to answer questions for an assessment."""
    __tablename__ = "assessment_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(SQLEnum(AssessmentStatus), default=AssessmentStatus.PENDING, nullable=False)
    phase = Column(SQLEnum(AssessmentPhase), default=AssessmentPhase.BASELINE, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    assessment = relationship("Assessment", back_populates="sessions")
    user = relationship("User", back_populates="assessment_sessions")
    answers = relationship("AssessmentAnswer", back_populates="session", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")

class AssessmentAnswer(Base, TimestampMixin):
    __tablename__ = "assessment_answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("assessment_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("ai_questions.id"), nullable=False, index=True)
    position_id = Column(UUID(as_uuid=True), ForeignKey("positions.id"), nullable=False, index=True)

    phase = Column(SQLEnum(AssessmentPhase), default=AssessmentPhase.BASELINE, nullable=False, index=True)
    answer_text = Column(Text)
    compliance_score = Column(Float) # 0-100, calculated by the AI evaluation engine
    regulation_score = Column(Float) # 0-100, alignment with the region's regulations
    evidence_urls = Column(JSONB) # List of document links
    ai_feedback = Column(Text)               # AI assessment of the answer
    remediation = Column(Text)               # concrete steps to become compliant
    regulation_note = Column(Text)           # region-specific regulatory guidance
    status = Column(SQLEnum(ControlStatus), default=ControlStatus.NOT_IMPLEMENTED)

    # Relationships
    session = relationship("AssessmentSession", back_populates="answers")
    question = relationship("AIQuestion", back_populates="answers")
    position = relationship("Position", back_populates="assessment_answers")
