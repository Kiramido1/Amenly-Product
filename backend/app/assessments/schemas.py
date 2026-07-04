"""
Assessment Schemas
Pydantic models for assessment API
"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import AssessmentStatus, ControlStatus


# Base Schemas
class AssessmentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class AssessmentCreate(AssessmentBase):
    framework_id: UUID


class AssessmentUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    status: AssessmentStatus | None = None


class AssessmentResponse(BaseModel):
    id: UUID
    organization_id: UUID
    framework_id: UUID
    name: str
    status: AssessmentStatus
    overall_score: float | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AssessmentDetailResponse(AssessmentResponse):
    framework_name: str | None = None
    framework_version: str | None = None

    class Config:
        from_attributes = True


# Session Schemas
class AssessmentSessionResponse(BaseModel):
    id: UUID
    assessment_id: UUID
    user_id: UUID
    status: AssessmentStatus
    started_at: datetime
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AssessmentSessionDetailResponse(AssessmentSessionResponse):
    assessment_name: str | None = None
    user_email: str | None = None
    user_full_name: str | None = None

    class Config:
        from_attributes = True


# Answer Schemas
class AssessmentAnswerBase(BaseModel):
    answer_text: str = Field(..., min_length=1)
    evidence_urls: list[str] | None = None


class AssessmentAnswerCreate(AssessmentAnswerBase):
    session_id: UUID
    question_id: UUID
    position_id: UUID | None = None


class AssessmentAnswerUpdate(BaseModel):
    answer_text: str | None = Field(None, min_length=1)
    compliance_score: float | None = Field(None, ge=0.0, le=1.0)
    evidence_urls: list[str] | None = None
    ai_feedback: str | None = None
    status: ControlStatus | None = None


class AssessmentAnswerResponse(BaseModel):
    id: UUID
    session_id: UUID
    question_id: UUID
    position_id: UUID
    answer_text: str
    compliance_score: float | None
    evidence_urls: list[str] | None
    ai_feedback: str | None
    status: ControlStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Chat Message Schemas
class ChatMessageBase(BaseModel):
    message_text: str = Field(..., min_length=1)


class ChatMessageCreate(ChatMessageBase):
    session_id: UUID | None = None


class ChatMessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    sender_type: str
    message_text: str
    message_metadata: dict | None
    created_at: datetime

    class Config:
        from_attributes = True


# Question Schemas
class AIQuestionResponse(BaseModel):
    id: UUID
    control_id: UUID
    question_text: str
    logic_type: str | None
    expected_evidence: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QuestionWithControlResponse(AIQuestionResponse):
    control_code: str | None = None
    control_title: str | None = None

    class Config:
        from_attributes = True


# Combined Response Schemas
class StartSessionResponse(BaseModel):
    session: AssessmentSessionResponse
    questions: list[QuestionWithControlResponse]


class ChatHistoryResponse(BaseModel):
    session_id: UUID
    messages: list[ChatMessageResponse]
