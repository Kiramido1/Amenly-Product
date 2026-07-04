"""add organization invite codes and join requests

Revision ID: b7f3a1c2d9e4
Revises: add_permissions_chat
Create Date: 2026-06-26 00:00:00.000000

"""
from uuid import uuid4

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from app.models.identity import generate_invite_code

# revision identifiers, used by Alembic.
revision = 'b7f3a1c2d9e4'
down_revision = 'add_permissions_chat'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add invite_code to organizations (nullable first so we can backfill).
    op.add_column('organizations', sa.Column('invite_code', sa.String(12), nullable=True))

    # Backfill a unique code for every existing organization.
    conn = op.get_bind()
    org_ids = conn.execute(sa.text("SELECT id FROM organizations")).fetchall()
    used: set[str] = set()
    for (org_id,) in org_ids:
        code = generate_invite_code()
        while code in used:
            code = generate_invite_code()
        used.add(code)
        conn.execute(
            sa.text("UPDATE organizations SET invite_code = :code WHERE id = :id"),
            {"code": code, "id": org_id},
        )

    # Enforce presence + uniqueness now that existing rows are populated.
    op.alter_column('organizations', 'invite_code', nullable=False)
    op.create_index(
        'ix_organizations_invite_code', 'organizations', ['invite_code'], unique=True
    )

    # 2. Create the join requests table (its enum type is created with it).
    join_status = postgresql.ENUM(
        'pending', 'approved', 'rejected', name='joinrequeststatus'
    )
    join_status.create(conn, checkfirst=True)

    op.create_table(
        'organization_join_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid4),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=True),
        sa.Column(
            'status',
            sa.Enum('pending', 'approved', 'rejected', name='joinrequeststatus'),
            nullable=False,
            server_default='pending',
        ),
        sa.Column('reviewed_by_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reviewed_at', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewed_by_id'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index(
        'ix_org_join_requests_org', 'organization_join_requests', ['organization_id']
    )
    op.create_index(
        'ix_org_join_requests_email', 'organization_join_requests', ['email']
    )
    op.create_index(
        'ix_org_join_requests_status', 'organization_join_requests', ['status']
    )


def downgrade() -> None:
    op.drop_table('organization_join_requests')
    postgresql.ENUM(name='joinrequeststatus').drop(op.get_bind(), checkfirst=True)

    op.drop_index('ix_organizations_invite_code', table_name='organizations')
    op.drop_column('organizations', 'invite_code')
