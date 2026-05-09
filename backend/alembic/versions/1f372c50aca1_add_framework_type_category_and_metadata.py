"""add_framework_type_category_and_metadata

Revision ID: 1f372c50aca1
Revises: 952e97e2aa29
Create Date: 2026-05-09 07:42:11.710236

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1f372c50aca1'
down_revision: Union[str, None] = '952e97e2aa29'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types first
    frameworktype_enum = sa.Enum('STANDARD', 'REGULATION', 'GUIDELINE', name='frameworktype')
    frameworkcategory_enum = sa.Enum(
        'INFORMATION_SECURITY', 'CYBERSECURITY', 'DATA_PROTECTION', 'PRIVACY', 
        'FINANCIAL', 'HEALTHCARE', 'PAYMENT_SECURITY', 'IT_GOVERNANCE', 
        'CLOUD_SECURITY', 'AUTOMOTIVE', 'GENERAL', 
        name='frameworkcategory'
    )
    
    frameworktype_enum.create(op.get_bind(), checkfirst=True)
    frameworkcategory_enum.create(op.get_bind(), checkfirst=True)
    
    # Add columns with nullable=True first to handle existing rows
    op.add_column('frameworks', sa.Column('framework_type', frameworktype_enum, nullable=True))
    op.add_column('frameworks', sa.Column('category', frameworkcategory_enum, nullable=True))
    op.add_column('frameworks', sa.Column('region', sa.String(length=100), nullable=True))
    op.add_column('frameworks', sa.Column('industry', sa.String(length=100), nullable=True))
    op.add_column('frameworks', sa.Column('is_mandatory', sa.Boolean(), nullable=True))
    op.add_column('frameworks', sa.Column('official_url', sa.String(length=512), nullable=True))
    
    # Set default values for existing rows
    op.execute("UPDATE frameworks SET framework_type = 'STANDARD' WHERE framework_type IS NULL")
    op.execute("UPDATE frameworks SET category = 'GENERAL' WHERE category IS NULL")
    op.execute("UPDATE frameworks SET is_mandatory = false WHERE is_mandatory IS NULL")
    
    # Now make the columns non-nullable
    op.alter_column('frameworks', 'framework_type', nullable=False)
    op.alter_column('frameworks', 'category', nullable=False)
    
    # Create indexes
    op.create_index(op.f('ix_frameworks_category'), 'frameworks', ['category'], unique=False)
    op.create_index(op.f('ix_frameworks_framework_type'), 'frameworks', ['framework_type'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_frameworks_framework_type'), table_name='frameworks')
    op.drop_index(op.f('ix_frameworks_category'), table_name='frameworks')
    
    # Drop columns
    op.drop_column('frameworks', 'official_url')
    op.drop_column('frameworks', 'is_mandatory')
    op.drop_column('frameworks', 'industry')
    op.drop_column('frameworks', 'region')
    op.drop_column('frameworks', 'category')
    op.drop_column('frameworks', 'framework_type')
    
    # Drop enum types
    sa.Enum(name='frameworkcategory').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='frameworktype').drop(op.get_bind(), checkfirst=True)
