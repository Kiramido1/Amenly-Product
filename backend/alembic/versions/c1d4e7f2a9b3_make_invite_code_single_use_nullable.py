"""make organization invite_code nullable (single-use, consumed on join request)

Revision ID: c1d4e7f2a9b3
Revises: b7f3a1c2d9e4
Create Date: 2026-06-27 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = 'c1d4e7f2a9b3'
down_revision = 'b7f3a1c2d9e4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Codes are now single-use: consumed (set NULL) once a join request uses one.
    op.alter_column('organizations', 'invite_code', existing_type=sa.String(12), nullable=True)


def downgrade() -> None:
    op.alter_column('organizations', 'invite_code', existing_type=sa.String(12), nullable=False)
