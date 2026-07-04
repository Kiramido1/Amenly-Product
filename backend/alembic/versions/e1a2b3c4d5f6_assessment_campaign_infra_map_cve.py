"""assessment campaign lifecycle, before/after scoring, infra map + CVE vulnerabilities

Additive migration for the admin-driven assessment product:
- Assessment campaign lifecycle + baseline/remediation/regulation score snapshots
- Before/after phase tracking on sessions and answers, plus AI remediation fields
- Device/config dimension on AI questions
- Infrastructure-map fields on assets (ownership, ip, risk/compliance, layout)
- New tables: vulnerabilities (CVE/NVD) and asset_connections (topology edges)

Revision ID: e1a2b3c4d5f6
Revises: d2e5f8a1b4c6
Create Date: 2026-07-04

All operations are additive and use IF NOT EXISTS / server defaults, so the
migration is safe to apply to a populated database.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "e1a2b3c4d5f6"
down_revision = "d2e5f8a1b4c6"
branch_labels = None
depends_on = None


# New enum types created by this migration.
# create_type=False so ONLY the explicit .create() below emits CREATE TYPE —
# otherwise op.add_column/create_table would also try to create them (dupes).
assessmentphase = postgresql.ENUM(
    "BASELINE", "REMEDIATION", "COMPLETED", name="assessmentphase", create_type=False
)
vulnerabilitysource = postgresql.ENUM(
    "NVD", "AI", "MANUAL", name="vulnerabilitysource", create_type=False
)
# Existing enum type — referenced, NOT re-created
riskseverity = postgresql.ENUM(
    "low", "medium", "high", "critical", name="riskseverity", create_type=False
)


def upgrade() -> None:
    bind = op.get_bind()
    assessmentphase.create(bind, checkfirst=True)
    vulnerabilitysource.create(bind, checkfirst=True)

    phase_col = lambda: sa.Column(  # noqa: E731
        "phase", assessmentphase, nullable=False, server_default="BASELINE"
    )

    # ---- assessments: campaign lifecycle + before/after snapshots ----
    op.add_column("assessments", sa.Column("current_phase", assessmentphase, nullable=False, server_default="BASELINE"))
    op.add_column("assessments", sa.Column("launched_by_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("assessments", sa.Column("launched_at", sa.DateTime(), nullable=True))
    op.add_column("assessments", sa.Column("closed_at", sa.DateTime(), nullable=True))
    op.add_column("assessments", sa.Column("baseline_score", sa.Float(), nullable=True))
    op.add_column("assessments", sa.Column("remediation_score", sa.Float(), nullable=True))
    op.add_column("assessments", sa.Column("regulation_score", sa.Float(), nullable=True))
    op.create_foreign_key(
        "fk_assessments_launched_by", "assessments", "users",
        ["launched_by_id"], ["id"], ondelete="SET NULL",
    )

    # ---- assessment_sessions: before/after phase ----
    op.add_column("assessment_sessions", phase_col())

    # ---- assessment_answers: phase + AI remediation guidance ----
    op.add_column("assessment_answers", sa.Column("phase", assessmentphase, nullable=False, server_default="BASELINE"))
    op.add_column("assessment_answers", sa.Column("remediation", sa.Text(), nullable=True))
    op.add_column("assessment_answers", sa.Column("regulation_note", sa.Text(), nullable=True))
    op.create_index("ix_assessment_answers_phase", "assessment_answers", ["phase"])

    # ---- ai_questions: device / configuration dimension ----
    op.add_column("ai_questions", sa.Column("device_category", sa.String(length=100), nullable=True))
    op.add_column("ai_questions", sa.Column("config_focus", sa.Text(), nullable=True))
    op.add_column("ai_questions", sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"))
    op.create_index("ix_ai_questions_device_category", "ai_questions", ["device_category"])

    # ---- infrastructure_assets: map + analytics fields ----
    op.add_column("infrastructure_assets", sa.Column("position_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("infrastructure_assets", sa.Column("department_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("infrastructure_assets", sa.Column("ip_address", sa.String(length=64), nullable=True))
    op.add_column("infrastructure_assets", sa.Column("risk_score", sa.Float(), nullable=True))
    op.add_column("infrastructure_assets", sa.Column("compliance_score", sa.Float(), nullable=True))
    op.add_column("infrastructure_assets", sa.Column("status", sa.String(length=30), nullable=True))
    op.add_column("infrastructure_assets", sa.Column("grid_x", sa.Float(), nullable=True))
    op.add_column("infrastructure_assets", sa.Column("grid_y", sa.Float(), nullable=True))
    op.create_index("ix_infrastructure_assets_position_id", "infrastructure_assets", ["position_id"])
    op.create_index("ix_infrastructure_assets_department_id", "infrastructure_assets", ["department_id"])
    op.create_foreign_key(
        "fk_infra_assets_position", "infrastructure_assets", "positions",
        ["position_id"], ["id"], ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_infra_assets_department", "infrastructure_assets", "departments",
        ["department_id"], ["id"], ondelete="SET NULL",
    )

    # ---- vulnerabilities ----
    op.create_table(
        "vulnerabilities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("asset_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("cve_id", sa.String(length=30), nullable=True),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("severity", riskseverity, nullable=False, server_default="MEDIUM"),
        sa.Column("cvss_score", sa.Float(), nullable=True),
        sa.Column("remediation", sa.Text(), nullable=True),
        sa.Column("reference_url", sa.String(length=1024), nullable=True),
        sa.Column("source", vulnerabilitysource, nullable=False, server_default="NVD"),
        sa.Column("is_resolved", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["asset_id"], ["infrastructure_assets.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_vulnerabilities_organization_id", "vulnerabilities", ["organization_id"])
    op.create_index("ix_vulnerabilities_asset_id", "vulnerabilities", ["asset_id"])
    op.create_index("ix_vulnerabilities_cve_id", "vulnerabilities", ["cve_id"])

    # ---- asset_connections (topology edges) ----
    op.create_table(
        "asset_connections",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_asset_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("target_asset_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("connection_type", sa.String(length=30), nullable=False, server_default="network"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_asset_id"], ["infrastructure_assets.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_asset_id"], ["infrastructure_assets.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_asset_connections_organization_id", "asset_connections", ["organization_id"])
    op.create_index("ix_asset_connections_source_asset_id", "asset_connections", ["source_asset_id"])
    op.create_index("ix_asset_connections_target_asset_id", "asset_connections", ["target_asset_id"])


def downgrade() -> None:
    op.drop_table("asset_connections")
    op.drop_table("vulnerabilities")

    op.drop_constraint("fk_infra_assets_department", "infrastructure_assets", type_="foreignkey")
    op.drop_constraint("fk_infra_assets_position", "infrastructure_assets", type_="foreignkey")
    op.drop_index("ix_infrastructure_assets_department_id", table_name="infrastructure_assets")
    op.drop_index("ix_infrastructure_assets_position_id", table_name="infrastructure_assets")
    for col in ("grid_y", "grid_x", "status", "compliance_score", "risk_score", "ip_address", "department_id", "position_id"):
        op.drop_column("infrastructure_assets", col)

    op.drop_index("ix_ai_questions_device_category", table_name="ai_questions")
    for col in ("order_index", "config_focus", "device_category"):
        op.drop_column("ai_questions", col)

    op.drop_index("ix_assessment_answers_phase", table_name="assessment_answers")
    for col in ("regulation_note", "remediation", "phase"):
        op.drop_column("assessment_answers", col)

    op.drop_column("assessment_sessions", "phase")

    op.drop_constraint("fk_assessments_launched_by", "assessments", type_="foreignkey")
    for col in ("regulation_score", "remediation_score", "baseline_score", "closed_at", "launched_at", "launched_by_id", "current_phase"):
        op.drop_column("assessments", col)

    bind = op.get_bind()
    vulnerabilitysource.drop(bind, checkfirst=True)
    assessmentphase.drop(bind, checkfirst=True)
