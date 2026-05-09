"""remove organization_id from frameworks and create organization_frameworks junction table

Revision ID: a1b2c3d4e5f6
Revises: 1f372c50aca1
Create Date: 2026-05-09 17:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '1f372c50aca1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create organization_frameworks junction table
    op.create_table(
        'organization_frameworks',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('framework_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['framework_id'], ['frameworks.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('organization_id', 'framework_id', name='uq_org_framework')
    )
    
    # Create indexes
    op.create_index('ix_organization_frameworks_organization_id', 'organization_frameworks', ['organization_id'])
    op.create_index('ix_organization_frameworks_framework_id', 'organization_frameworks', ['framework_id'])
    
    # Migrate existing data from frameworks.organization_id to organization_frameworks
    # This SQL will copy all existing framework-organization relationships
    op.execute("""
        INSERT INTO organization_frameworks (id, organization_id, framework_id, created_at, updated_at)
        SELECT 
            gen_random_uuid(),
            organization_id,
            id as framework_id,
            created_at,
            updated_at
        FROM frameworks
        WHERE organization_id IS NOT NULL
    """)
    
    # Drop the foreign key constraint first
    op.drop_constraint('frameworks_organization_id_fkey', 'frameworks', type_='foreignkey')
    
    # Drop the index
    op.drop_index('ix_frameworks_organization_id', table_name='frameworks')
    
    # Drop the organization_id column from frameworks
    op.drop_column('frameworks', 'organization_id')


def downgrade() -> None:
    # Add organization_id column back to frameworks
    op.add_column('frameworks', sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Migrate data back from organization_frameworks to frameworks
    # This will take the first organization for each framework
    op.execute("""
        UPDATE frameworks f
        SET organization_id = (
            SELECT organization_id 
            FROM organization_frameworks 
            WHERE framework_id = f.id 
            LIMIT 1
        )
    """)
    
    # Make organization_id NOT NULL after migration
    op.alter_column('frameworks', 'organization_id', nullable=False)
    
    # Recreate the index
    op.create_index('ix_frameworks_organization_id', 'frameworks', ['organization_id'])
    
    # Recreate the foreign key constraint
    op.create_foreign_key('frameworks_organization_id_fkey', 'frameworks', 'organizations', ['organization_id'], ['id'])
    
    # Drop indexes from organization_frameworks
    op.drop_index('ix_organization_frameworks_framework_id', table_name='organization_frameworks')
    op.drop_index('ix_organization_frameworks_organization_id', table_name='organization_frameworks')
    
    # Drop organization_frameworks table
    op.drop_table('organization_frameworks')
