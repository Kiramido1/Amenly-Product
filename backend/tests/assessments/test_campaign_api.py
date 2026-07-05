"""
API/integration tests for the admin-driven assessment campaign.

The AI evaluation is mocked (deterministic score from answer length) so these
tests exercise the HTTP/permission/lifecycle behaviour, not the LLM.
"""
from uuid import UUID

import pytest
from sqlalchemy import select

from app.assessments import service as service_module
from app.assessments.evaluation import AnswerEvaluation
from app.auth.security import get_password_hash
from app.models.compliance import AIQuestion, ControlPosition, Framework, FrameworkControl
from app.models.enums import ControlStatus, UserRole
from app.models.identity import Department, Organization, Position, User
from tests.utils.auth import AuthTestHelper
from tests.utils.client import TestClient


@pytest.fixture(autouse=True)
def mock_ai(monkeypatch):
    """Deterministic evaluation + a stubbed greeting so tests avoid the LLM."""
    class _FakeEval:
        async def evaluate(self, *, answer_text, **kwargs):
            score = min(100.0, len(answer_text or "") * 2.0)
            status = ControlStatus.FULLY_IMPLEMENTED if score >= 80 else (
                ControlStatus.PARTIALLY_IMPLEMENTED if score >= 40 else ControlStatus.NOT_IMPLEMENTED)
            return AnswerEvaluation(
                compliance_score=score, status=status,
                feedback="mock feedback", remediation="do X", regulation_note="PDPL note",
            )
    monkeypatch.setattr(service_module, "get_evaluation_service", lambda: _FakeEval())

    async def _fake_greeting(self, session):
        return "Welcome to your assessment."
    monkeypatch.setattr(service_module.AssessmentService, "ensure_session_greeting", _fake_greeting)


async def _complete_profile(db, org_id):
    org = (await db.execute(select(Organization).where(Organization.id == org_id))).scalar_one()
    org.profile_completed = True
    await db.commit()


async def _seed_member_and_framework(db, org_id):
    """Add a member (with position), framework, control, mapping and a question."""
    org = (await db.execute(select(Organization).where(Organization.id == org_id))).scalar_one()
    org.profile_completed = True
    dept = Department(organization_id=org_id, name="Engineering")
    db.add(dept); await db.flush()
    pos = Position(department_id=dept.id, name="Sysadmin")
    db.add(pos); await db.flush()
    member = User(organization_id=org_id, email=f"member_{org_id.hex[:6]}@t.co",
                  hashed_password=get_password_hash("MemberPass123!"),
                  full_name="Member One", role=UserRole.ORG_MEMBER, is_active=True, position_id=pos.id)
    db.add(member); await db.flush()
    fw = Framework(name="ISO 27001 Test")
    db.add(fw); await db.flush()
    ctrl = FrameworkControl(framework_id=fw.id, code="A.9.4.3", title="Passwords",
                            description="quality passwords", guidance="enforce policy")
    db.add(ctrl); await db.flush()
    db.add(ControlPosition(control_id=ctrl.id, position_id=pos.id, importance_weight=2.0))
    q = AIQuestion(control_id=ctrl.id, question_text="How are passwords enforced?",
                   config_focus="policy", expected_evidence="GPO", device_category="server")
    db.add(q); await db.flush()
    await db.commit()
    return dict(member_email=member.email, member_pw="MemberPass123!", pos_id=pos.id,
                fw_id=fw.id, q_id=q.id)


@pytest.mark.asyncio
async def test_full_campaign_lifecycle(client, db):
    admin = await AuthTestHelper.register_admin(client)
    admin_c = TestClient(client, admin["access_token"])
    org_id = UUID(admin["user"]["organization_id"])
    seed = await _seed_member_and_framework(db, org_id)

    # Make the admin oversight-only (no position) so the member is the sole
    # participant and auto-close fires when they finish.
    admin_user = (await db.execute(select(User).where(User.id == UUID(admin["user"]["id"])))).scalar_one()
    admin_user.position_id = None
    await db.commit()

    # Admin creates + launches
    r = await admin_c.post("/api/v1/assessments", json={"name": "Q3", "framework_id": str(seed["fw_id"])})
    assert r.status_code == 201, r.text
    aid = r.json()["data"]["assessment"]["id"]

    r = await admin_c.post(f"/api/v1/assessments/{aid}/launch")
    assert r.status_code == 200
    assert r.json()["data"]["assessment"]["status"] == "in_progress"

    # Member logs in, starts a session, answers, completes
    member_login = await AuthTestHelper.login_user(client, seed["member_email"], seed["member_pw"])
    member_c = TestClient(client, member_login["access_token"])

    r = await member_c.post(f"/api/v1/assessments/{aid}/sessions/start")
    assert r.status_code == 201, r.text
    body = r.json()["data"]
    session_id = body["session"]["id"]
    assert len(body["questions"]) >= 1  # position-scoped questions returned

    r = await member_c.post("/api/v1/assessments/answers", json={
        "session_id": session_id, "question_id": str(seed["q_id"]),
        "answer_text": "We enforce a very strong password policy with MFA and lockout everywhere.",
    })
    assert r.status_code == 201, r.text
    ans = r.json()["data"]["answer"]
    assert ans["compliance_score"] is not None and ans["compliance_score"] > 0
    assert ans["remediation"] == "do X" and ans["phase"] == "baseline"

    r = await member_c.post(f"/api/v1/assessments/sessions/{session_id}/complete")
    assert r.status_code == 200

    # Admin sees all sessions + overview (baseline auto-scored since all done)
    r = await admin_c.get(f"/api/v1/assessments/{aid}/sessions")
    assert r.status_code == 200
    sessions = r.json()["data"]["sessions"]
    assert len(sessions) == 1 and sessions[0]["status"] == "completed"
    assert sessions[0]["avg_score"] is not None

    r = await admin_c.get(f"/api/v1/assessments/{aid}/overview")
    assert r.status_code == 200
    ov = r.json()["data"]["overview"]
    assert ov["baseline_score"] is not None
    assert ov["participants_total"] == 1 and ov["completed_sessions"] == 1

    # Advance to remediation, re-answer, close -> improvement present
    r = await admin_c.post(f"/api/v1/assessments/{aid}/advance-phase")
    assert r.status_code == 200 and r.json()["data"]["assessment"]["current_phase"] == "remediation"

    r = await member_c.post(f"/api/v1/assessments/{aid}/sessions/start")
    session2 = r.json()["data"]["session"]["id"]
    await member_c.post("/api/v1/assessments/answers", json={
        "session_id": session2, "question_id": str(seed["q_id"]),
        "answer_text": "x" * 60})  # long answer -> high mock score
    await member_c.post(f"/api/v1/assessments/sessions/{session2}/complete")

    r = await admin_c.post(f"/api/v1/assessments/{aid}/close")
    assert r.status_code == 200
    r = await admin_c.get(f"/api/v1/assessments/{aid}/overview")
    ov = r.json()["data"]["overview"]
    assert ov["status"] == "completed"
    assert ov["baseline_score"] is not None and ov["remediation_score"] is not None
    assert ov["improvement"] is not None


@pytest.mark.asyncio
async def test_member_cannot_control_campaign(client, db):
    admin = await AuthTestHelper.register_admin(client)
    admin_c = TestClient(client, admin["access_token"])
    org_id = UUID(admin["user"]["organization_id"])
    seed = await _seed_member_and_framework(db, org_id)
    r = await admin_c.post("/api/v1/assessments", json={"name": "Q3", "framework_id": str(seed["fw_id"])})
    aid = r.json()["data"]["assessment"]["id"]

    member_login = await AuthTestHelper.login_user(client, seed["member_email"], seed["member_pw"])
    member_c = TestClient(client, member_login["access_token"])

    # Members must NOT be able to launch/close or view all sessions.
    assert (await member_c.post(f"/api/v1/assessments/{aid}/launch")).status_code == 403
    assert (await member_c.post(f"/api/v1/assessments/{aid}/close")).status_code == 403
    assert (await member_c.get(f"/api/v1/assessments/{aid}/sessions")).status_code == 403


@pytest.mark.asyncio
async def test_cross_org_isolation(client, db):
    # Org A creates an assessment; Org B admin must not touch it (404, not 403 leak).
    admin_a = await AuthTestHelper.register_admin(client)
    admin_a_c = TestClient(client, admin_a["access_token"])
    org_a = UUID(admin_a["user"]["organization_id"])
    seed_a = await _seed_member_and_framework(db, org_a)
    r = await admin_a_c.post("/api/v1/assessments", json={"name": "A", "framework_id": str(seed_a["fw_id"])})
    aid_a = r.json()["data"]["assessment"]["id"]

    admin_b = await AuthTestHelper.register_admin(client)
    admin_b_c = TestClient(client, admin_b["access_token"])
    # Complete org B's profile so `launch` reaches the ownership check (else the
    # profile gate would 403 before isolation is even evaluated).
    await _complete_profile(db, UUID(admin_b["user"]["organization_id"]))

    assert (await admin_b_c.post(f"/api/v1/assessments/{aid_a}/launch")).status_code == 404
    assert (await admin_b_c.get(f"/api/v1/assessments/{aid_a}/overview")).status_code == 404
    assert (await admin_b_c.get(f"/api/v1/assessments/{aid_a}/sessions")).status_code == 404


@pytest.mark.asyncio
async def test_start_session_is_safe_with_multiple_prior_sessions(client, db):
    """Regression: a user who accumulates >1 session for an assessment must not
    trigger a 500 (get_user_session used scalar_one_or_none -> MultipleResults)."""
    admin = await AuthTestHelper.register_admin(client)
    admin_c = TestClient(client, admin["access_token"])
    org_id = UUID(admin["user"]["organization_id"])
    seed = await _seed_member_and_framework(db, org_id)
    r = await admin_c.post("/api/v1/assessments", json={"name": "Q", "framework_id": str(seed["fw_id"])})
    aid = r.json()["data"]["assessment"]["id"]
    await admin_c.post(f"/api/v1/assessments/{aid}/launch")

    member_login = await AuthTestHelper.login_user(client, seed["member_email"], seed["member_pw"])
    member_c = TestClient(client, member_login["access_token"])

    # 1st session, complete it -> then starting again creates a 2nd session.
    s1 = (await member_c.post(f"/api/v1/assessments/{aid}/sessions/start")).json()["data"]["session"]["id"]
    await member_c.post(f"/api/v1/assessments/sessions/{s1}/complete")
    r2 = await member_c.post(f"/api/v1/assessments/{aid}/sessions/start")  # creates session #2
    assert r2.status_code == 201
    # With two sessions on record, starting yet again must still succeed (not 500).
    r3 = await member_c.post(f"/api/v1/assessments/{aid}/sessions/start")
    assert r3.status_code == 201, r3.text


@pytest.mark.asyncio
async def test_unauthenticated_rejected(client):
    r = await client.get("/api/v1/assessments/00000000-0000-0000-0000-000000000000/overview")
    assert r.status_code == 401
