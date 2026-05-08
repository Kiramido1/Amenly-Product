from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.enums import AssessmentStatus, ControlStatus

# --- Framework ---
class FrameworkBase(BaseModel):
    name: str
    version: Optional[str] = None
    description: Optional[str] = None
    organization_id: UUID

class FrameworkCreate(FrameworkBase):
    pass

class FrameworkUpdate(BaseModel):
    name: Optional[str] = None
    version: Optional[str] = None
    description: Optional[str] = None

class FrameworkResponse(FrameworkBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- FrameworkControl ---
class FrameworkControlBase(BaseModel):
    code: str
    title: str
    description: Optional[str] = None
    guidance: Optional[str] = None
    framework_id: UUID

class FrameworkControlCreate(FrameworkControlBase):
    pass

class FrameworkControlUpdate(BaseModel):
    code: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    guidance: Optional[str] = None

class FrameworkControlResponse(FrameworkControlBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- AIQuestion ---
class AIQuestionBase(BaseModel):
    control_id: UUID
    question_text: str
    logic_type: Optional[str] = None
    expected_evidence: Optional[str] = None

class AIQuestionCreate(AIQuestionBase):
    pass

class AIQuestionResponse(AIQuestionBase):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Assessment ---
class AssessmentBase(BaseModel):
    name: str
    organization_id: UUID
    framework_id: UUID
    status: AssessmentStatus = AssessmentStatus.PENDING

class AssessmentCreate(AssessmentBase):
    pass

class AssessmentResponse(AssessmentBase):
    id: UUID
    overall_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- AssessmentAnswer ---
class AssessmentAnswerBase(BaseModel):
    session_id: UUID
    question_id: UUID
    position_id: UUID
    answer_text: Optional[str] = None
    compliance_score: Optional[float] = None
    evidence_urls: Optional[List[str]] = None
    ai_feedback: Optional[str] = None
    status: ControlStatus = ControlStatus.NOT_IMPLEMENTED

class AssessmentAnswerCreate(AssessmentAnswerBase):
    pass

class AssessmentAnswerResponse(AssessmentAnswerBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
