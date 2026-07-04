# Import all models here for Alembic to detect them
from app.database.session import Base  # noqa
from app.models.identity import Organization, Department, Position, User, OrganizationJoinRequest  # noqa
from app.models.assets_risks import Asset, Risk, Document, DocumentChunk  # noqa
from app.models.permissions import UserRolePermission, PermissionModel, RolePermission  # noqa
from app.models.chat import ChatMessage, InfrastructureAsset  # noqa
