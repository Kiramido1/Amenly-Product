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


class FrameworkType(str, Enum):
    """Type of compliance framework"""
    STANDARD = "standard"  # ISO 27001, NIST CSF, SOC 2, PCI DSS, COBIT, TISAX
    REGULATION = "regulation"  # GDPR, HIPAA, CCPA, SOX, etc.
    GUIDELINE = "guideline"  # Best practices, recommendations


class FrameworkCategory(str, Enum):
    """Category of compliance framework"""
    INFORMATION_SECURITY = "information_security"
    CYBERSECURITY = "cybersecurity"
    DATA_PROTECTION = "data_protection"
    PRIVACY = "privacy"
    FINANCIAL = "financial"
    HEALTHCARE = "healthcare"
    PAYMENT_SECURITY = "payment_security"
    IT_GOVERNANCE = "it_governance"
    CLOUD_SECURITY = "cloud_security"
    AUTOMOTIVE = "automotive"
    GENERAL = "general"
