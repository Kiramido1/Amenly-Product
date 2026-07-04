"""
API tests for vulnerability scanning + infrastructure map.
The NVD detector is mocked so results are deterministic and offline.
"""
from uuid import UUID

import pytest
from sqlalchemy import select

from app.assets import vulnerability_service as vs_module
from app.ai.cve.nvd_service import CVERecord
from app.auth.security import get_password_hash
from app.models.chat import AssetConnection, InfrastructureAsset, Vulnerability
from app.models.enums import RiskSeverity, UserRole
from app.models.identity import Department, Position, User
from tests.utils.auth import AuthTestHelper
from tests.utils.client import TestClient


@pytest.fixture(autouse=True)
def mock_detector(monkeypatch):
    """Return a fixed critical + medium CVE for every asset scanned."""
    class _FakeDetector:
        async def detect_for_asset(self, *, asset_name=None, **kwargs):
            return [
                CVERecord(cve_id="CVE-2021-9999", title="Critical RCE", description="bad",
                          cvss_score=9.8, severity=RiskSeverity.CRITICAL,
                          reference_url="https://nvd.nist.gov/vuln/detail/CVE-2021-9999"),
                CVERecord(cve_id="CVE-2020-1111", title="Medium issue", description="meh",
                          cvss_score=5.0, severity=RiskSeverity.MEDIUM, reference_url=None),
            ]
    monkeypatch.setattr(vs_module, "get_detection_service", lambda: _FakeDetector())


async def _seed_assets(db, org_id):
    a = InfrastructureAsset(organization_id=org_id, asset_type="server",
                            asset_name="Web", description="apache")
    b = InfrastructureAsset(organization_id=org_id, asset_type="database",
                            asset_name="DB", description="mysql")
    db.add_all([a, b]); await db.flush()
    db.add(AssetConnection(organization_id=org_id, source_asset_id=a.id,
                           target_asset_id=b.id, connection_type="dependency"))
    await db.commit()
    return a.id, b.id


async def _make_member(db, org_id):
    dept = Department(organization_id=org_id, name="Ops"); db.add(dept); await db.flush()
    pos = Position(department_id=dept.id, name="Analyst"); db.add(pos); await db.flush()
    m = User(organization_id=org_id, email=f"vmember_{org_id.hex[:6]}@t.co",
             hashed_password=get_password_hash("MemberPass123!"), full_name="V M",
             role=UserRole.ORG_MEMBER, is_active=True, position_id=pos.id)
    db.add(m); await db.flush(); await db.commit()
    return m.email, "MemberPass123!"


@pytest.mark.asyncio
async def test_scan_persists_and_scores(client, db):
    admin = await AuthTestHelper.register_admin(client)
    admin_c = TestClient(client, admin["access_token"])
    org_id = UUID(admin["user"]["organization_id"])
    await _seed_assets(db, org_id)

    r = await admin_c.post("/api/v1/assets/scan-vulnerabilities")
    assert r.status_code == 200, r.text
    data = r.json()["data"]
    assert data["assets_scanned"] == 2
    assert data["new_vulnerabilities"] == 4  # 2 CVEs x 2 assets

    # Assets scored critical (worst CVE is 9.8 -> critical).
    for res in data["results"]:
        assert res["status"] == "critical" and res["risk_score"] >= 70

    # Re-scan is idempotent (dedupe by CVE id -> no new rows).
    r2 = await admin_c.post("/api/v1/assets/scan-vulnerabilities")
    assert r2.json()["data"]["new_vulnerabilities"] == 0


@pytest.mark.asyncio
async def test_list_vulnerabilities(client, db):
    admin = await AuthTestHelper.register_admin(client)
    admin_c = TestClient(client, admin["access_token"])
    org_id = UUID(admin["user"]["organization_id"])
    await _seed_assets(db, org_id)
    await admin_c.post("/api/v1/assets/scan-vulnerabilities")

    r = await admin_c.get("/api/v1/assets/vulnerabilities")
    assert r.status_code == 200
    vulns = r.json()["data"]["vulnerabilities"]
    assert len(vulns) == 4
    # Sorted by CVSS desc — the critical one is first.
    assert vulns[0]["cve_id"] == "CVE-2021-9999" and vulns[0]["severity"] == "critical"
    assert vulns[0]["asset_name"] in {"Web", "DB"}


@pytest.mark.asyncio
async def test_infrastructure_map(client, db):
    admin = await AuthTestHelper.register_admin(client)
    admin_c = TestClient(client, admin["access_token"])
    org_id = UUID(admin["user"]["organization_id"])
    await _seed_assets(db, org_id)
    await admin_c.post("/api/v1/assets/scan-vulnerabilities")

    r = await admin_c.get("/api/v1/assets/map")
    assert r.status_code == 200
    graph = r.json()["data"]
    assert graph["node_count"] == 2 and graph["edge_count"] == 1
    node = graph["nodes"][0]
    assert {"id", "name", "risk_score", "status", "vulnerability_count", "grid_x"} <= set(node)
    assert node["vulnerability_count"] == 2
    assert graph["edges"][0]["type"] == "dependency"


@pytest.mark.asyncio
async def test_member_denied_vuln_and_map(client, db):
    admin = await AuthTestHelper.register_admin(client)
    org_id = UUID(admin["user"]["organization_id"])
    email, pw = await _make_member(db, org_id)
    member_login = await AuthTestHelper.login_user(client, email, pw)
    member_c = TestClient(client, member_login["access_token"])

    assert (await member_c.post("/api/v1/assets/scan-vulnerabilities")).status_code == 403
    assert (await member_c.get("/api/v1/assets/vulnerabilities")).status_code == 403
    assert (await member_c.get("/api/v1/assets/map")).status_code == 403


@pytest.mark.asyncio
async def test_scan_isolated_per_org(client, db):
    # Org A scans; org B sees none of A's vulnerabilities.
    admin_a = await AuthTestHelper.register_admin(client)
    admin_a_c = TestClient(client, admin_a["access_token"])
    org_a = UUID(admin_a["user"]["organization_id"])
    await _seed_assets(db, org_a)
    await admin_a_c.post("/api/v1/assets/scan-vulnerabilities")

    admin_b = await AuthTestHelper.register_admin(client)
    admin_b_c = TestClient(client, admin_b["access_token"])
    r = await admin_b_c.get("/api/v1/assets/vulnerabilities")
    assert r.status_code == 200 and r.json()["data"]["count"] == 0
    r = await admin_b_c.get("/api/v1/assets/map")
    assert r.json()["data"]["node_count"] == 0
