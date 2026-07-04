from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AssessmentStatus, ControlStatus, FrameworkCategory, FrameworkType


# --- Framework ---
class FrameworkBase(BaseModel):
    name: str = Field(..., description="Framework name (e.g., ISO 27001, GDPR)")
    version: str | None = Field(None, description="Framework version (e.g., 2022, 4.0.1)")
    description: str | None = Field(None, description="Detailed description of the framework")

class FrameworkCreate(FrameworkBase):
    framework_type: FrameworkType = Field(..., description="Type: STANDARD, REGULATION, or GUIDELINE")
    category: FrameworkCategory = Field(..., description="Primary category of the framework")
    region: str | None = Field(None, max_length=100, description="Geographic region (e.g., 'Global', 'United States', 'European Union')")
    industry: str | None = Field(None, max_length=100, description="Target industry (e.g., 'Healthcare', 'Financial', 'General')")
    is_mandatory: bool = Field(False, description="Whether compliance is legally required")
    official_url: str | None = Field(None, max_length=512, description="Official documentation URL")

class FrameworkUpdate(BaseModel):
    name: str | None = Field(None, description="Framework name")
    version: str | None = Field(None, description="Framework version")
    description: str | None = Field(None, description="Framework description")
    framework_type: FrameworkType | None = Field(None, description="Framework type")
    category: FrameworkCategory | None = Field(None, description="Framework category")
    region: str | None = Field(None, max_length=100, description="Geographic region")
    industry: str | None = Field(None, max_length=100, description="Target industry")
    is_mandatory: bool | None = Field(None, description="Is legally required?")
    official_url: str | None = Field(None, max_length=512, description="Official URL")

class FrameworkResponse(FrameworkBase):
    id: UUID
    framework_type: FrameworkType = Field(..., description="Type: STANDARD, REGULATION, or GUIDELINE")
    category: FrameworkCategory = Field(..., description="Primary category")
    region: str | None = Field(None, description="Geographic region")
    industry: str | None = Field(None, description="Target industry")
    is_mandatory: bool = Field(..., description="Is legally required?")
    official_url: str | None = Field(None, description="Official documentation URL")
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class FrameworkListResponse(BaseModel):
    """Response for framework list with metadata"""
    id: UUID
    name: str
    version: str | None
    framework_type: FrameworkType
    category: FrameworkCategory
    region: str | None
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

# --- Organization Framework Association ---
class AddFrameworksRequest(BaseModel):
    """Request to add frameworks to organization"""
    framework_ids: list[UUID] | None = Field(None, description="List of specific framework IDs to add")
    framework_types: list[FrameworkType] | None = Field(None, description="Add all frameworks of these types")
    add_all: bool = Field(False, description="Add all available frameworks")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "framework_ids": ["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
                "framework_types": ["standard"],
                "add_all": False
            }
        }
    )

class AddFrameworksResponse(BaseModel):
    """Response after adding frameworks"""
    added_count: int = Field(..., description="Number of frameworks added")
    skipped_count: int = Field(..., description="Number of frameworks already associated")
    total_frameworks: int = Field(..., description="Total frameworks now associated with organization")
    added_frameworks: list[FrameworkListResponse] = Field(..., description="List of newly added frameworks")

# --- FrameworkControl ---
class FrameworkControlBase(BaseModel):
    code: str
    title: str
    description: str | None = None
    guidance: str | None = None
    framework_id: UUID

class FrameworkControlCreate(FrameworkControlBase):
    pass

class FrameworkControlUpdate(BaseModel):
    code: str | None = None
    title: str | None = None
    description: str | None = None
    guidance: str | None = None

class FrameworkControlResponse(FrameworkControlBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- AIQuestion ---
class AIQuestionBase(BaseModel):
    control_id: UUID
    question_text: str
    logic_type: str | None = None
    expected_evidence: str | None = None

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
    overall_score: float | None = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- AssessmentAnswer ---
class AssessmentAnswerBase(BaseModel):
    session_id: UUID
    question_id: UUID
    position_id: UUID
    answer_text: str | None = None
    compliance_score: float | None = None
    evidence_urls: list[str] | None = None
    ai_feedback: str | None = None
    status: ControlStatus = ControlStatus.NOT_IMPLEMENTED

class AssessmentAnswerCreate(AssessmentAnswerBase):
    pass

class AssessmentAnswerResponse(AssessmentAnswerBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
