"""add permissions and chat system

Revision ID: add_permissions_chat
Revises: dfdc0978922d
Create Date: 2026-05-12 05:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from uuid import uuid4

# revision identifiers, used by Alembic.
revision = 'add_permissions_chat'
down_revision = 'dfdc0978922d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create permissions table
    op.create_table(
        'permissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid4),
        sa.Column('name', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
    )

    # Create role_permissions table
    op.create_table(
        'role_permissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid4),
        sa.Column('role', sa.String(50), nullable=False),
        sa.Column('permission_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('role', 'permission_id', name='uq_role_permission')
    )
    op.create_index('ix_role_permissions_role', 'role_permissions', ['role'])

    # Add new columns to existing ai_questions table
    op.add_column('ai_questions', sa.Column('position_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('ai_questions', sa.Column('framework_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('ai_questions', sa.Column('question_type', sa.String(50), nullable=True))
    op.add_column('ai_questions', sa.Column('priority', sa.Integer, default=0))
    op.create_foreign_key('fk_ai_questions_position', 'ai_questions', 'positions', ['position_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_ai_questions_framework', 'ai_questions', 'frameworks', ['framework_id'], ['id'], ondelete='CASCADE')

    # Create infrastructure_assets table
    op.create_table(
        'infrastructure_assets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid4),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('assessment_session_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('asset_type', sa.String(100), nullable=False),
        sa.Column('asset_name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('extracted_from_message_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('asset_metadata', postgresql.JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assessment_session_id'], ['assessment_sessions.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_infrastructure_assets_org', 'infrastructure_assets', ['organization_id'])
    op.create_index('ix_infrastructure_assets_type', 'infrastructure_assets', ['asset_type'])

    # Create chat_messages table
    op.create_table(
        'chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid4),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sender_type', sa.String(20), nullable=False),  # 'user' or 'ai'
        sa.Column('message_text', sa.Text, nullable=False),
        sa.Column('message_metadata', postgresql.JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['assessment_sessions.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_chat_messages_session', 'chat_messages', ['session_id'])
    op.create_index('ix_chat_messages_created', 'chat_messages', ['created_at'])


def downgrade() -> None:
    # Drop in reverse order
    op.drop_table('chat_messages')
    op.drop_table('infrastructure_assets')
    
    # Remove added columns from ai_questions
    op.drop_constraint('fk_ai_questions_framework', 'ai_questions', type_='foreignkey')
    op.drop_constraint('fk_ai_questions_position', 'ai_questions', type_='foreignkey')
    op.drop_column('ai_questions', 'priority')
    op.drop_column('ai_questions', 'question_type')
    op.drop_column('ai_questions', 'framework_id')
    op.drop_column('ai_questions', 'position_id')
    
    op.drop_table('role_permissions')
    op.drop_table('permissions')
