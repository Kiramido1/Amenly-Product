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


class Permission(str, Enum):
    """User permissions for fine-grained access control"""
    # Assessment Permissions
    START_ASSESSMENT = "start_assessment"
    VIEW_OWN_SESSIONS = "view_own_sessions"
    VIEW_ALL_SESSIONS = "view_all_sessions"
    VIEW_OWN_SCORE = "view_own_score"
    VIEW_ALL_SCORES = "view_all_scores"
    VIEW_ORG_TOTAL_SCORE = "view_org_total_score"
    
    # Framework Permissions
    SELECT_FRAMEWORK = "select_framework"
    MANAGE_FRAMEWORKS = "manage_frameworks"
    
    # Dashboard Permissions
    VIEW_DASHBOARD = "view_dashboard"
    VIEW_ASSETS = "view_assets"
    VIEW_VULNERABILITIES = "view_vulnerabilities"
    MANAGE_DASHBOARD_ACCESS = "manage_dashboard_access"
    
    # Member Management
    VIEW_MEMBERS = "view_members"
    MANAGE_MEMBERS = "manage_members"
    GRANT_PERMISSIONS = "grant_permissions"
