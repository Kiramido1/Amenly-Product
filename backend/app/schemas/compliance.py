from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import AssessmentStatus, ControlStatus, FrameworkType, FrameworkCategory

# --- Framework ---
class FrameworkBase(BaseModel):
    name: str = Field(..., description="Framework name (e.g., ISO 27001, GDPR)")
    version: Optional[str] = Field(None, description="Framework version (e.g., 2022, 4.0.1)")
    description: Optional[str] = Field(None, description="Detailed description of the framework")

class FrameworkCreate(FrameworkBase):
    organization_id: UUID = Field(..., description="Organization ID")
    framework_type: FrameworkType = Field(..., description="Type: STANDARD, REGULATION, or GUIDELINE")
    category: FrameworkCategory = Field(..., description="Primary category of the framework")
    region: Optional[str] = Field(None, max_length=100, description="Geographic region (e.g., 'Global', 'United States', 'European Union')")
    industry: Optional[str] = Field(None, max_length=100, description="Target industry (e.g., 'Healthcare', 'Financial', 'General')")
    is_mandatory: bool = Field(False, description="Whether compliance is legally required")
    official_url: Optional[str] = Field(None, max_length=512, description="Official documentation URL")

class FrameworkUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Framework name")
    version: Optional[str] = Field(None, description="Framework version")
    description: Optional[str] = Field(None, description="Framework description")
    framework_type: Optional[FrameworkType] = Field(None, description="Framework type")
    category: Optional[FrameworkCategory] = Field(None, description="Framework category")
    region: Optional[str] = Field(None, max_length=100, description="Geographic region")
    industry: Optional[str] = Field(None, max_length=100, description="Target industry")
    is_mandatory: Optional[bool] = Field(None, description="Is legally required?")
    official_url: Optional[str] = Field(None, max_length=512, description="Official URL")

class FrameworkResponse(FrameworkBase):
    id: UUID
    organization_id: UUID
    framework_type: FrameworkType = Field(..., description="Type: STANDARD, REGULATION, or GUIDELINE")
    category: FrameworkCategory = Field(..., description="Primary category")
    region: Optional[str] = Field(None, description="Geographic region")
    industry: Optional[str] = Field(None, description="Target industry")
    is_mandatory: bool = Field(..., description="Is legally required?")
    official_url: Optional[str] = Field(None, description="Official documentation URL")
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class FrameworkListResponse(BaseModel):
    """Response for framework list with metadata"""
    id: UUID
    name: str
    version: Optional[str]
    framework_type: FrameworkType
    category: FrameworkCategory
    region: Optional[str]
    is_mandatory: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class FrameworkStatsResponse(BaseModel):
    """Statistics about frameworks"""
    total: int = Field(..., description="Total number of frameworks")
    by_type: dict = Field(..., description="Count by framework type")
    by_category: dict = Field(..., description="Count by category")
    by_region: dict = Field(..., description="Count by region")
    mandatory_count: int = Field(..., description="Number of mandatory frameworks")
    optional_count: int = Field(..., description="Number of optional frameworks")

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
