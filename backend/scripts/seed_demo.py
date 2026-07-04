"""
Seed a lot of realistic GRC demo data.

Targets whatever DATABASE_URL points to — run against a DEV/test database, not
production, unless you explicitly intend to. Scores/vulnerabilities are written
directly (no live LLM/NVD calls) so it is fast and deterministic.

Usage:
    DATABASE_URL="postgresql+psycopg://postgres:postgres@127.0.0.1:5432/amenly_dev" \
        PYTHONPATH="$PWD" .venv/bin/python scripts/seed_demo.py
"""
import asyncio
import random
from datetime import datetime, timedelta

import app.database.base  # noqa: F401 - register all mappers
from app.auth.security import get_password_hash
from app.database.session import AsyncSessionLocal
from app.models.assessments import Assessment, AssessmentAnswer, AssessmentSession
from app.models.chat import AssetConnection, InfrastructureAsset, Vulnerability
from app.models.compliance import AIQuestion, ControlPosition, Framework, FrameworkControl
from app.models.enums import (
    AssessmentPhase, AssessmentStatus, ControlStatus, RiskSeverity,
    UserRole, VulnerabilitySource,
)
from app.models.identity import Department, Organization, Position, User

random.seed(42)  # deterministic

ORGS = [
    ("Acme Financial", "Egypt", ["Engineering", "Security", "Compliance"]),
    ("Globex Health", "European Union", ["IT", "Privacy", "Operations"]),
    ("Initech Retail", "United States", ["Infrastructure", "Risk"]),
    ("Umbrella Energy", "Egypt", ["OT Security", "Network"]),
]
POSITIONS = ["Sysadmin", "Network Engineer", "Security Analyst", "DevOps Engineer", "Compliance Officer"]
FRAMEWORKS = [
    ("ISO 27001", "standard", "information_security"),
    ("NIST CSF", "standard", "cybersecurity"),
    ("PCI DSS", "standard", "payment_security"),
    ("GDPR", "regulation", "data_protection"),
]
CONTROLS = [
    ("A.9.4.3", "Password management", "server", "Password policy (length, complexity, MFA, lockout)"),
    ("A.13.1.1", "Network controls", "firewall", "Firewall rules, segmentation, default-deny"),
    ("A.12.6.1", "Vulnerability management", "server", "Patch cadence, scanning, remediation SLAs"),
    ("A.8.1.1", "Asset inventory", "workstation", "Asset register completeness and ownership"),
    ("A.12.4.1", "Event logging", "siem", "Log collection, retention, monitoring"),
]
ASSET_KINDS = [
    ("server", "Web Server", "Apache httpd 2.4 on Ubuntu 20.04", {"product": "apache", "version": "2.4"}),
    ("database", "Primary DB", "MySQL 5.7 database", {"product": "mysql", "version": "5.7"}),
    ("firewall", "Perimeter FW", "Fortigate edge firewall", {"product": "fortigate"}),
    ("workstation", "Staff Laptop", "Windows 10 workstation", {"product": "windows", "version": "10"}),
    ("server", "Mail Server", "Microsoft Exchange 2016", {"product": "microsoft exchange", "version": "2016"}),
    ("cloud", "S3 Bucket", "AWS S3 storage bucket", {"product": "aws s3"}),
]
CVE_POOL = [
    ("CVE-2021-44228", "Log4Shell RCE", 10.0, RiskSeverity.CRITICAL),
    ("CVE-2017-5638", "Struts RCE", 10.0, RiskSeverity.CRITICAL),
    ("CVE-2016-0504", "MySQL privilege issue", 6.8, RiskSeverity.MEDIUM),
    ("CVE-2014-0160", "Heartbleed", 7.5, RiskSeverity.HIGH),
    ("CVE-2019-0708", "BlueKeep RDP", 9.8, RiskSeverity.CRITICAL),
    ("CVE-2020-1472", "Zerologon", 10.0, RiskSeverity.CRITICAL),
]


async def main():
    async with AsyncSessionLocal() as db:
        counts = {k: 0 for k in ("orgs", "users", "frameworks", "assessments", "sessions", "answers", "assets", "vulns", "connections")}

        # Shared framework catalog (global, not org-specific).
        frameworks = {}
        for name, ftype, cat in FRAMEWORKS:
            fw = Framework(name=name, framework_type=ftype, category=cat,
                           region="Global", description=f"{name} controls")
            db.add(fw); await db.flush()
            frameworks[name] = fw
            counts["frameworks"] += 1
            for code, title, dev, focus in CONTROLS:
                ctrl = FrameworkControl(framework_id=fw.id, code=code, title=title,
                                        description=f"{title} for {name}", guidance=f"Implement {title}.")
                db.add(ctrl); await db.flush()
                fw._controls = getattr(fw, "_controls", [])
                fw._controls.append((ctrl, dev, focus))

        for oi, (oname, region, dept_names) in enumerate(ORGS):
            org = Organization(name=oname, region=region, profile_completed=True,
                               invite_code=f"DEMO{oi}{random.randint(100,999)}")
            db.add(org); await db.flush()
            counts["orgs"] += 1

            positions = []
            for dname in dept_names:
                dept = Department(organization_id=org.id, name=dname); db.add(dept); await db.flush()
                for pname in random.sample(POSITIONS, k=random.randint(2, 3)):
                    pos = Position(department_id=dept.id, name=pname); db.add(pos); await db.flush()
                    positions.append(pos)

            # Admin (oversight, no position) + members with positions.
            admin = User(organization_id=org.id, email=f"admin@{oname.split()[0].lower()}.com",
                         hashed_password=get_password_hash("Test@1234"), full_name=f"{oname} Admin",
                         role=UserRole.ORG_ADMIN, is_active=True)
            db.add(admin); await db.flush(); counts["users"] += 1
            members = []
            for mi in range(random.randint(4, 6)):
                pos = random.choice(positions)
                m = User(organization_id=org.id, email=f"user{mi}@{oname.split()[0].lower()}.com",
                         hashed_password=get_password_hash("Test@1234"), full_name=f"Member {mi}",
                         role=UserRole.ORG_MEMBER, is_active=True, position_id=pos.id)
                db.add(m); await db.flush(); members.append(m); counts["users"] += 1

            # Map controls -> positions + questions for the org's chosen framework.
            fw = frameworks[random.choice([f[0] for f in FRAMEWORKS])]
            questions = []
            for ctrl, dev, focus in fw._controls:
                for pos in random.sample(positions, k=min(2, len(positions))):
                    db.add(ControlPosition(control_id=ctrl.id, position_id=pos.id,
                                           importance_weight=round(random.uniform(1.0, 3.0), 1)))
                q = AIQuestion(control_id=ctrl.id, question_text=f"Describe how you implement {ctrl.title}.",
                               config_focus=focus, expected_evidence="Config/screenshots",
                               device_category=dev, order_index=len(questions))
                db.add(q); await db.flush()
                questions.append(q)

            # An assessment campaign with baseline + remediation answers (before/after).
            completed = oi < 2  # first two orgs fully completed
            assessment = Assessment(
                organization_id=org.id, framework_id=fw.id, name=f"{fw.name} Assessment 2026",
                status=AssessmentStatus.COMPLETED if completed else AssessmentStatus.IN_PROGRESS,
                current_phase=AssessmentPhase.COMPLETED if completed else AssessmentPhase.BASELINE,
                launched_by_id=admin.id, launched_at=datetime.utcnow() - timedelta(days=20),
            )
            db.add(assessment); await db.flush(); counts["assessments"] += 1

            baseline_scores, remediation_scores = [], []
            for m in members:
                sess = AssessmentSession(assessment_id=assessment.id, user_id=m.id,
                                         status=AssessmentStatus.COMPLETED,
                                         phase=AssessmentPhase.COMPLETED if completed else AssessmentPhase.BASELINE,
                                         completed_at=datetime.utcnow() - timedelta(days=random.randint(1, 15)))
                db.add(sess); await db.flush(); counts["sessions"] += 1
                for q in random.sample(questions, k=min(3, len(questions))):
                    base = random.randint(10, 55)
                    db.add(AssessmentAnswer(session_id=sess.id, question_id=q.id, position_id=m.position_id,
                                            phase=AssessmentPhase.BASELINE, answer_text="Initial state described.",
                                            compliance_score=base, status=ControlStatus.PARTIALLY_IMPLEMENTED,
                                            ai_feedback="Gaps found.", remediation="Harden the configuration."))
                    baseline_scores.append(base); counts["answers"] += 1
                    if completed:
                        rem = min(100, base + random.randint(30, 50))
                        db.add(AssessmentAnswer(session_id=sess.id, question_id=q.id, position_id=m.position_id,
                                                phase=AssessmentPhase.REMEDIATION, answer_text="Remediated with controls.",
                                                compliance_score=rem, status=ControlStatus.FULLY_IMPLEMENTED,
                                                ai_feedback="Now compliant."))
                        remediation_scores.append(rem); counts["answers"] += 1

            assessment.baseline_score = round(sum(baseline_scores) / len(baseline_scores), 1) if baseline_scores else None
            if remediation_scores:
                assessment.remediation_score = round(sum(remediation_scores) / len(remediation_scores), 1)
                assessment.overall_score = assessment.remediation_score
                assessment.closed_at = datetime.utcnow() - timedelta(days=1)

            # Infrastructure assets + connections + vulnerabilities.
            assets = []
            for atype, aname, adesc, ameta in random.sample(ASSET_KINDS, k=random.randint(4, 6)):
                risk = random.choice([25, 45, 65, 95])
                a = InfrastructureAsset(
                    organization_id=org.id, assessment_session_id=None, asset_type=atype,
                    asset_name=f"{aname} {random.randint(1,9)}", description=adesc, asset_metadata=ameta,
                    position_id=random.choice(positions).id, ip_address=f"10.0.{oi}.{random.randint(2,254)}",
                    risk_score=risk, compliance_score=100 - risk,
                    status="critical" if risk >= 70 else "warning" if risk >= 40 else "secure",
                )
                db.add(a); await db.flush(); assets.append(a); counts["assets"] += 1
                for cve_id, title, cvss, sev in random.sample(CVE_POOL, k=random.randint(0, 3)):
                    db.add(Vulnerability(organization_id=org.id, asset_id=a.id, cve_id=cve_id, title=title,
                                         description=f"{title} affecting {aname}", severity=sev, cvss_score=cvss,
                                         remediation="Apply vendor patch.", source=VulnerabilitySource.NVD,
                                         reference_url=f"https://nvd.nist.gov/vuln/detail/{cve_id}"))
                    counts["vulns"] += 1
            for i in range(len(assets) - 1):
                db.add(AssetConnection(organization_id=org.id, source_asset_id=assets[i].id,
                                       target_asset_id=assets[i + 1].id,
                                       connection_type=random.choice(["network", "dependency", "data_flow"])))
                counts["connections"] += 1

        await db.commit()
        print("Seed complete:")
        for k, v in counts.items():
            print(f"  {k:14} {v}")
        print("\nLogin for any org admin: admin@<org>.com / Test@1234  (members: user0@<org>.com ...)")


if __name__ == "__main__":
    asyncio.run(main())
