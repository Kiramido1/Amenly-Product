# Import all models here for Alembic to detect them
from app.database.session import Base  # noqa
from app.models.identity import Organization, Department, Position, User  # noqa
from app.models.compliance import (
    Framework,
    FrameworkControl,
    ControlPosition,
    AIQuestion,
)  # noqa
from app.models.assessments import (
    Assessment,
    AssessmentSession,
    AssessmentAnswer,
)  # noqa
from app.models.assets_risks import Asset, Risk, Document, DocumentChunk  # noqa
