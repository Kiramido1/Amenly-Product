"""create_user_role_permissions_table_manual

Revision ID: 5cbae36f3596
Revises: f377d337324f
Create Date: 2026-05-09 19:14:17.944506

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5cbae36f3596'
down_revision: Union[str, None] = 'f377d337324f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create user_role_permissions table
    op.create_table(
        'user_role_permissions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('permissions', sa.ARRAY(sa.String()), nullable=False),
        sa.Column('granted_by_id', sa.UUID(), nullable=True),
        sa.Column('granted_at', sa.DateTime(), nullable=True, server_default=sa.text('now()')),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default=sa.text('true')),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['granted_by_id'], ['users.id'], ondelete='SET NULL')
    )
    
    # Create indexes
    op.create_index('ix_user_role_permissions_user_id', 'user_role_permissions', ['user_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_user_role_permissions_user_id', table_name='user_role_permissions')
    
    # Drop table
    op.drop_table('user_role_permissions')
