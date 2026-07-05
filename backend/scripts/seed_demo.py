"""
Seed realistic GRC demo data with POSITION-BASED question sets.

Each SME position (HR, IT, Network, Security, Compliance/DPO, Finance,
Operations, Developer …) is mapped to the controls relevant to its role, across
EVERY framework — so a member only sees the questions that concern their job.

Idempotent: it first removes any prior demo data (orgs with a DEMO* invite code
and frameworks tagged "(Demo)") so re-running never accumulates duplicates. It
never touches real (non-demo) data. The global permission catalog is seeded only
if empty.

Targets whatever DATABASE_URL points to. Usage:
    DATABASE_URL="postgresql+psycopg://postgres:postgres@127.0.0.1:5432/amenly_dev" \
        PYTHONPATH="$PWD" .venv/bin/python scripts/seed_demo.py
"""
import asyncio
import random
from datetime import datetime, timedelta

from sqlalchemy import select, text

import app.database.base  # noqa: F401 - register all mappers
from app.auth.security import get_password_hash
from app.database.session import AsyncSessionLocal
from app.models.assessments import Assessment, AssessmentAnswer, AssessmentSession
from app.models.assets_risks import Asset, Document, DocumentChunk, Risk
from app.models.chat import AssetConnection, ChatMessage, InfrastructureAsset, Vulnerability
from app.models.compliance import (
    AIQuestion, ControlPosition, Framework, FrameworkControl, organization_frameworks,
)
from app.models.enums import (
    AssessmentPhase, AssessmentStatus, AssetType, ControlStatus, JoinRequestStatus,
    Permission, RiskSeverity, UserRole, VulnerabilitySource,
)
from app.models.identity import Department, Organization, OrganizationJoinRequest, Position, User
from app.models.permissions import PermissionModel, ROLE_PERMISSIONS, RolePermission, UserRolePermission

random.seed(42)  # deterministic

ORGS = [
    ("Acme Financial", "Egypt", "acme"),
    ("Globex Health", "European Union", "globex"),
    ("Initech Retail", "United States", "initech"),
    ("Umbrella Energy", "Egypt", "umbrella"),
]

# Standard positions in small/medium companies: (title, department, domain, email-slug)
POSITION_CATALOG = [
    ("IT Administrator", "IT", "it", "it"),
    ("Network Engineer", "IT", "network", "network"),
    ("Software Developer", "Engineering", "dev", "dev"),
    ("Security Officer", "Security", "security", "security"),
    ("SOC Analyst", "Security", "security", "soc"),
    ("Compliance Officer", "Compliance", "compliance", "compliance"),
    ("Data Protection Officer", "Compliance", "privacy", "dpo"),
    ("HR Manager", "Human Resources", "hr", "hr"),
    ("Finance Manager", "Finance", "finance", "finance"),
    ("Operations Manager", "Operations", "operations", "ops"),
]

FRAMEWORKS = [
    ("ISO 27001", "standard", "information_security"),
    ("NIST CSF", "standard", "cybersecurity"),
    ("PCI DSS", "standard", "payment_security"),
    ("GDPR", "regulation", "data_protection"),
]

# Controls tagged with the position DOMAINS they apply to. A control shows up in
# a member's assessment only if their position's domain is in this list.
# (code, title, [domains], device_category, config_focus)
CONTROL_CATALOG = [
    ("AC-2", "User access management", ["it", "security"], "server",
     "Account provisioning, least privilege, periodic access reviews"),
    ("SI-2", "Patch & vulnerability management", ["it"], "server",
     "Patch cadence, scanning coverage, remediation SLAs"),
    ("CP-9", "Backup & recovery", ["it", "operations"], "server",
     "Backup schedule, encryption, tested restores"),
    ("SC-7", "Network segmentation & firewalls", ["network"], "firewall",
     "Firewall rules, VLAN segmentation, default-deny"),
    ("SC-8", "Encryption in transit / remote access", ["network", "dev"], "network",
     "TLS everywhere, VPN and MFA for remote access"),
    ("SA-11", "Secure development lifecycle", ["dev"], "application",
     "Code review, SAST/DAST, secrets handling"),
    ("SA-15", "Third-party & dependency security", ["dev", "security"], "application",
     "Software composition analysis, dependency updates, SBOM"),
    ("IR-4", "Incident response", ["security", "operations"], "siem",
     "IR plan, defined roles, tabletop exercises"),
    ("AU-6", "Logging & monitoring", ["security", "it"], "siem",
     "Central logging, retention, alerting"),
    ("RA-3", "Risk assessment", ["security", "compliance"], None,
     "Risk register, likelihood/impact scoring, treatment plans"),
    ("PL-2", "Policies & governance", ["compliance", "security"], None,
     "Approved policies, review cadence, clear ownership"),
    ("AT-2", "Security awareness training", ["hr", "compliance"], None,
     "Onboarding training, phishing simulations, completion records"),
    ("PS-3", "Personnel screening", ["hr"], None,
     "Background checks, references, confidentiality agreements"),
    ("PS-4", "Joiners / movers / leavers", ["hr", "it"], None,
     "Timely access provisioning and revocation on role change or exit"),
    ("DP-1", "Data protection & privacy", ["privacy", "compliance"], None,
     "Lawful basis, data mapping, DPIAs"),
    ("DP-2", "Data retention & disposal", ["privacy"], None,
     "Retention schedule, secure disposal"),
    ("DP-3", "Data subject rights & consent", ["privacy"], None,
     "Consent capture, DSAR handling within deadlines"),
    ("FI-1", "Segregation of duties", ["finance", "compliance"], None,
     "SoD matrix, approval limits, conflict checks"),
    ("FI-2", "Financial controls & fraud prevention", ["finance"], None,
     "Reconciliations, dual approvals, audit trail"),
    ("OP-1", "Business continuity & disaster recovery", ["operations", "it"], None,
     "BCP/DR plan, RTO/RPO targets, DR tests"),
    ("OP-3", "Vendor & third-party risk", ["operations", "compliance"], None,
     "Vendor due diligence, contract clauses, ongoing monitoring"),
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


async def clear_prior_demo(db):
    """Remove data from a previous demo run so re-running is idempotent.
    Only demo-tagged rows are touched (DEMO* invite codes, '(Demo)' frameworks)."""
    await db.execute(text("DELETE FROM organizations WHERE invite_code LIKE 'DEMO%'"))
    await db.execute(text("DELETE FROM frameworks WHERE name LIKE '% (Demo)'"))
    await db.commit()


async def main():
    async with AsyncSessionLocal() as db:
        await clear_prior_demo(db)

        counts = {k: 0 for k in (
            "orgs", "users", "join_requests", "frameworks", "assessments", "sessions",
            "answers", "chat_messages", "infra_assets", "vulns", "connections",
            "assets", "risks", "documents", "doc_chunks",
            "permissions", "role_permissions", "user_permissions", "control_positions",
        )}

        # ── Permission catalog (global, idempotent) ──────────────────
        existing = set((await db.execute(select(PermissionModel.name))).scalars().all())
        perm_models = {}
        for p in Permission:
            if p.value in existing:
                continue
            pm = PermissionModel(name=p.value, description=p.value.replace("_", " ").title(),
                                 category=p.value.split("_")[0])
            db.add(pm); await db.flush()
            perm_models[p.value] = pm
            counts["permissions"] += 1
        if perm_models:  # only seed role map when we just created the catalog
            for role, perms in ROLE_PERMISSIONS.items():
                for p in perms:
                    if p.value in perm_models:
                        db.add(RolePermission(role=role, permission_id=perm_models[p.value].id))
                        counts["role_permissions"] += 1

        # ── Framework catalog (global): controls + one AI question each ──
        frameworks = {}
        for name, ftype, cat in FRAMEWORKS:
            fw = Framework(name=f"{name} (Demo)", framework_type=ftype, category=cat,
                           region="Global", description=f"{name} demo control set")
            db.add(fw); await db.flush()
            frameworks[name] = fw
            counts["frameworks"] += 1
            fw._controls = []
            for order, (code, title, domains, device, focus) in enumerate(CONTROL_CATALOG):
                ctrl = FrameworkControl(framework_id=fw.id, code=code, title=title,
                                        description=f"{title} — {name}", guidance=f"Implement {title}.")
                db.add(ctrl); await db.flush()
                q = AIQuestion(
                    control_id=ctrl.id,
                    question_text=f"For {title}: describe how your team implements and evidences this control.",
                    config_focus=focus, expected_evidence="Config, policy, or screenshots",
                    device_category=device, order_index=order)
                db.add(q); await db.flush()
                fw._controls.append({"ctrl": ctrl, "q": q, "domains": domains})

        # ── Organizations ────────────────────────────────────────────
        for oi, (oname, region, slug) in enumerate(ORGS):
            org = Organization(name=oname, region=region, profile_completed=True,
                               invite_code=f"DEMO{oi}{random.randint(100, 999)}")
            db.add(org); await db.flush()
            counts["orgs"] += 1

            # Departments (distinct) + one position per catalog entry.
            depts = {}
            for dname in {d for _, d, _, _ in POSITION_CATALOG}:
                dep = Department(organization_id=org.id, name=dname)
                db.add(dep); await db.flush()
                depts[dname] = dep

            admin = User(organization_id=org.id, email=f"admin@{slug}-demo.com",
                         hashed_password=get_password_hash("Test@1234"), full_name=f"{oname} Admin",
                         role=UserRole.ORG_ADMIN, is_active=True)
            db.add(admin); await db.flush(); counts["users"] += 1

            # One member per position (email = role slug) so each role is covered.
            members = []  # (user, domain)
            for title, dname, domain, pslug in POSITION_CATALOG:
                pos = Position(department_id=depts[dname].id, name=title, level="Senior")
                db.add(pos); await db.flush()
                m = User(organization_id=org.id, email=f"{pslug}@{slug}-demo.com",
                         hashed_password=get_password_hash("Test@1234"), full_name=f"{title}",
                         role=UserRole.ORG_MEMBER, is_active=True, position_id=pos.id)
                db.add(m); await db.flush()
                members.append((m, domain, pos))
                counts["users"] += 1

            # Pending join requests + custom permission grants.
            for ri in range(random.randint(1, 3)):
                db.add(OrganizationJoinRequest(
                    organization_id=org.id, email=f"applicant{ri}@{slug}-demo.com",
                    hashed_password=get_password_hash("Test@1234"), full_name=f"Applicant {ri}",
                    status=random.choice([JoinRequestStatus.PENDING, JoinRequestStatus.PENDING,
                                          JoinRequestStatus.APPROVED, JoinRequestStatus.REJECTED])))
                counts["join_requests"] += 1
            for m, _, _ in random.sample(members, k=2):
                db.add(UserRolePermission(user_id=m.id, permissions=[Permission.VIEW_DASHBOARD.value],
                                          granted_by_id=admin.id, is_active=True,
                                          notes="Granted dashboard visibility."))
                counts["user_permissions"] += 1

            # Framework for this org + association of a small catalog.
            fw_key = random.choice([f[0] for f in FRAMEWORKS])
            fw = frameworks[fw_key]
            for fname in {fw_key} | set(random.sample([f[0] for f in FRAMEWORKS], k=2)):
                await db.execute(organization_frameworks.insert().values(
                    organization_id=org.id, framework_id=frameworks[fname].id))

            # POSITION-BASED control mapping: each control -> only the positions
            # whose domain matches. This is what ties question sets to roles.
            for c in fw._controls:
                for m, domain, pos in members:
                    if domain in c["domains"]:
                        weight = 3.0 if domain == c["domains"][0] else 1.5
                        db.add(ControlPosition(control_id=c["ctrl"].id, position_id=pos.id,
                                               importance_weight=weight))
                        counts["control_positions"] += 1

            # Assessment campaign with position-scoped before/after answers.
            completed = oi < 2
            assessment = Assessment(
                organization_id=org.id, framework_id=fw.id, name=f"{fw_key} Assessment 2026",
                status=AssessmentStatus.COMPLETED if completed else AssessmentStatus.IN_PROGRESS,
                current_phase=AssessmentPhase.COMPLETED if completed else AssessmentPhase.BASELINE,
                launched_by_id=admin.id, launched_at=datetime.utcnow() - timedelta(days=20))
            db.add(assessment); await db.flush(); counts["assessments"] += 1

            base_scores, rem_scores = [], []
            for m, domain, pos in members:
                # Questions for THIS member = controls mapped to their domain.
                my_controls = [c for c in fw._controls if domain in c["domains"]]
                if not my_controls:
                    continue
                sess = AssessmentSession(
                    assessment_id=assessment.id, user_id=m.id, status=AssessmentStatus.COMPLETED,
                    phase=AssessmentPhase.COMPLETED if completed else AssessmentPhase.BASELINE,
                    completed_at=datetime.utcnow() - timedelta(days=random.randint(1, 15)))
                db.add(sess); await db.flush(); counts["sessions"] += 1

                db.add(ChatMessage(session_id=sess.id, sender_type="ai",
                                   message_text=f"Welcome. This assessment covers your {pos.name} responsibilities.",
                                   message_metadata={"source": "assessment_greeting"}))
                counts["chat_messages"] += 1

                for c in my_controls:
                    base = random.randint(10, 55)
                    db.add(AssessmentAnswer(
                        session_id=sess.id, question_id=c["q"].id, position_id=pos.id,
                        phase=AssessmentPhase.BASELINE, answer_text="Current state described.",
                        compliance_score=base, status=ControlStatus.PARTIALLY_IMPLEMENTED,
                        ai_feedback="Gaps identified for this control.",
                        remediation="Harden the configuration and document evidence."))
                    base_scores.append(base); counts["answers"] += 1
                    db.add(ChatMessage(session_id=sess.id, sender_type="user",
                                       message_text=f"For {c['ctrl'].title}, our current setup is documented."))
                    db.add(ChatMessage(session_id=sess.id, sender_type="ai",
                                       message_text="Noted — here is how to strengthen it.",
                                       message_metadata={"confidence": round(random.uniform(0.6, 0.95), 2)}))
                    counts["chat_messages"] += 2
                    if completed:
                        rem = min(100, base + random.randint(30, 50))
                        db.add(AssessmentAnswer(
                            session_id=sess.id, question_id=c["q"].id, position_id=pos.id,
                            phase=AssessmentPhase.REMEDIATION, answer_text="Remediated with controls in place.",
                            compliance_score=rem, status=ControlStatus.FULLY_IMPLEMENTED,
                            ai_feedback="Now compliant."))
                        rem_scores.append(rem); counts["answers"] += 1

            assessment.baseline_score = round(sum(base_scores) / len(base_scores), 1) if base_scores else None
            if rem_scores:
                assessment.remediation_score = round(sum(rem_scores) / len(rem_scores), 1)
                assessment.overall_score = assessment.remediation_score
                assessment.closed_at = datetime.utcnow() - timedelta(days=1)

            # Infrastructure map: assets + vulnerabilities + connections.
            pos_objs = [p for _, _, p in members]
            infra = []
            for atype, aname, adesc, ameta in random.sample(ASSET_KINDS, k=random.randint(4, 6)):
                risk = random.choice([25, 45, 65, 95])
                a = InfrastructureAsset(
                    organization_id=org.id, asset_type=atype, asset_name=f"{aname} {random.randint(1, 9)}",
                    description=adesc, asset_metadata=ameta, position_id=random.choice(pos_objs).id,
                    ip_address=f"10.0.{oi}.{random.randint(2, 254)}", risk_score=risk,
                    compliance_score=100 - risk,
                    status="critical" if risk >= 70 else "warning" if risk >= 40 else "secure")
                db.add(a); await db.flush(); infra.append(a); counts["infra_assets"] += 1
                for cve_id, title, cvss, sev in random.sample(CVE_POOL, k=random.randint(0, 3)):
                    db.add(Vulnerability(
                        organization_id=org.id, asset_id=a.id, cve_id=cve_id, title=title,
                        description=f"{title} affecting {aname}", severity=sev, cvss_score=cvss,
                        remediation="Apply vendor patch.", source=VulnerabilitySource.NVD,
                        reference_url=f"https://nvd.nist.gov/vuln/detail/{cve_id}"))
                    counts["vulns"] += 1
            for i in range(len(infra) - 1):
                db.add(AssetConnection(organization_id=org.id, source_asset_id=infra[i].id,
                                       target_asset_id=infra[i + 1].id,
                                       connection_type=random.choice(["network", "dependency", "data_flow"])))
                counts["connections"] += 1

            # Governance asset register + risks.
            for atype in random.sample(list(AssetType), k=random.randint(3, 5)):
                crit = random.choice(list(RiskSeverity))
                asset = Asset(organization_id=org.id, name=f"{atype.value.title()} Asset {random.randint(1, 99)}",
                              type=atype, criticality=crit, owner_id=random.choice(members)[0].id,
                              properties={"location": region})
                db.add(asset); await db.flush(); counts["assets"] += 1
                for _ in range(random.randint(1, 3)):
                    prob, imp = round(random.uniform(0.2, 0.95), 2), round(random.uniform(0.3, 0.98), 2)
                    sev = (RiskSeverity.CRITICAL if prob * imp > 0.6 else RiskSeverity.HIGH if prob * imp > 0.4
                           else RiskSeverity.MEDIUM if prob * imp > 0.2 else RiskSeverity.LOW)
                    db.add(Risk(asset_id=asset.id, title=f"Risk on {asset.name}",
                                description="Identified during assessment review.",
                                probability=prob, impact=imp, severity=sev,
                                mitigation_plan="Apply compensating controls and monitor."))
                    counts["risks"] += 1

            # RAG documents + chunks.
            for di in range(random.randint(2, 4)):
                doc = Document(organization_id=org.id, filename=f"{fw_key}_policy_{di}.pdf",
                               file_type="application/pdf", s3_key=f"org/{org.id}/doc_{di}.pdf",
                               is_processed=True)
                db.add(doc); await db.flush(); counts["documents"] += 1
                for ci in range(random.randint(3, 6)):
                    db.add(DocumentChunk(document_id=doc.id, chunk_index=ci,
                                         content=f"Policy section {ci}: controls for {fw_key}.",
                                         metadata_json={"page": ci + 1, "framework": fw_key}))
                    counts["doc_chunks"] += 1

        await db.commit()
        print("Seed complete (position-based question sets):")
        for k, v in counts.items():
            print(f"  {k:18} {v}")
        print("\nDemo logins (password Test@1234):")
        print("  admin@<org>-demo.com   e.g. admin@acme-demo.com")
        print("  role members:  it@ / network@ / dev@ / security@ / soc@ / compliance@ /")
        print("                 dpo@ / hr@ / finance@ / ops@  + <org>-demo.com")


if __name__ == "__main__":
    asyncio.run(main())
