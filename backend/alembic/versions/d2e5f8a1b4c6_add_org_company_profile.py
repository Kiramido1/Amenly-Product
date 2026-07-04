"""add organization company profile fields

Revision ID: d2e5f8a1b4c6
Revises: c1d4e7f2a9b3
Create Date: 2026-06-27 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = 'd2e5f8a1b4c6'
down_revision = 'c1d4e7f2a9b3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('organizations', sa.Column('industry', sa.String(100), nullable=True))
    op.add_column('organizations', sa.Column('company_size', sa.String(50), nullable=True))
    op.add_column('organizations', sa.Column('region', sa.String(100), nullable=True))
    op.add_column('organizations', sa.Column('website', sa.String(255), nullable=True))
    op.add_column('organizations', sa.Column('description', sa.Text(), nullable=True))
    op.add_column(
        'organizations',
        sa.Column('profile_completed', sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    for col in ('profile_completed', 'description', 'website', 'region', 'company_size', 'industry'):
        op.drop_column('organizations', col)
