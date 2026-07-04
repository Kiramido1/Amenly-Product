from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import AssetType, RiskSeverity


# --- Asset ---
class AssetBase(BaseModel):
    name: str
    type: AssetType
    criticality: RiskSeverity = RiskSeverity.MEDIUM
    organization_id: UUID
    owner_id: UUID | None = None
    properties: dict | None = None

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: str | None = None
    type: AssetType | None = None
    criticality: RiskSeverity | None = None
    owner_id: UUID | None = None
    properties: dict | None = None

class AssetResponse(AssetBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Risk ---
class RiskBase(BaseModel):
    asset_id: UUID
    title: str
    description: str | None = None
    probability: float | None = None
    impact: float | None = None
    severity: RiskSeverity
    mitigation_plan: str | None = None

class RiskCreate(RiskBase):
    pass

class RiskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    probability: float | None = None
    impact: float | None = None
    severity: RiskSeverity | None = None
    mitigation_plan: str | None = None

class RiskResponse(RiskBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Document ---
class DocumentBase(BaseModel):
    filename: str
    file_type: str | None = None
    organization_id: UUID

class DocumentResponse(DocumentBase):
    id: UUID
    s3_key: str | None = None
    is_processed: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
