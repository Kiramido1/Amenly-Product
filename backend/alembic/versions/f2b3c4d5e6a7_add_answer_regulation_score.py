"""add regulation_score to assessment_answers

Additive: a nullable Float for how well an answer aligns with the region's
regulations, so the dashboard can show a separate regulation compliance score.

Revision ID: f2b3c4d5e6a7
Revises: e1a2b3c4d5f6
Create Date: 2026-07-05
"""
from alembic import op
import sqlalchemy as sa

revision = "f2b3c4d5e6a7"
down_revision = "e1a2b3c4d5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("assessment_answers", sa.Column("regulation_score", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("assessment_answers", "regulation_score")
