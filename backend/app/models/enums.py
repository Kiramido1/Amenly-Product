from enum import Enum

class UserRole(str, Enum):
    ORG_ADMIN = "org_admin"
    ORG_MEMBER = "org_member"

class AssessmentStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EXPIRED = "expired"

class RiskSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AssetType(str, Enum):
    HARDWARE = "hardware"
    SOFTWARE = "software"
    DATA = "data"
    PEOPLE = "people"
    SERVICE = "service"

class ControlStatus(str, Enum):
    NOT_IMPLEMENTED = "not_implemented"
    PARTIALLY_IMPLEMENTED = "partially_implemented"
    FULLY_IMPLEMENTED = "fully_implemented"
    NOT_APPLICABLE = "not_applicable"
