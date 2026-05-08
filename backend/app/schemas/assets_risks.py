from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.enums import RiskSeverity, AssetType

# --- Asset ---
class AssetBase(BaseModel):
    name: str
    type: AssetType
    criticality: RiskSeverity = RiskSeverity.MEDIUM
    organization_id: UUID
    owner_id: Optional[UUID] = None
    properties: Optional[dict] = None

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[AssetType] = None
    criticality: Optional[RiskSeverity] = None
    owner_id: Optional[UUID] = None
    properties: Optional[dict] = None

class AssetResponse(AssetBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Risk ---
class RiskBase(BaseModel):
    asset_id: UUID
    title: str
    description: Optional[str] = None
    probability: Optional[float] = None
    impact: Optional[float] = None
    severity: RiskSeverity
    mitigation_plan: Optional[str] = None

class RiskCreate(RiskBase):
    pass

class RiskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    probability: Optional[float] = None
    impact: Optional[float] = None
    severity: Optional[RiskSeverity] = None
    mitigation_plan: Optional[str] = None

class RiskResponse(RiskBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Document ---
class DocumentBase(BaseModel):
    filename: str
    file_type: Optional[str] = None
    organization_id: UUID

class DocumentResponse(DocumentBase):
    id: UUID
    s3_key: Optional[str] = None
    is_processed: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
