# Amenly GRC Platform — Pre-Release Security & QA Audit

**Audit type:** Manual pass + multi-agent code audit (96 agents, adversarially verified)
**Date:** 2026-06-26
**Scope:** Backend (FastAPI), Frontend (React SPA), DB/migrations, RAG/AI subsystem, auth/session lifecycle
**Verification:** 81 findings raised → 50 confirmed → 31 refuted by skeptic agents.

---

## 1. Executive Summary

The platform contained a **catastrophic cross-tenant data-destruction flaw** (any org admin could permanently delete shared framework rows and cascade-wipe every other tenant's assessments) alongside multiple **authentication-bypass and cross-tenant authorization defects** (forgeable JWTs via a committed default secret, plaintext password logging, refresh-token replay, WebSocket revocation bypass, assessment-session IDOR). The release-blocking Critical and High issues have since been remediated and verified (see §6).

### Severity Tally (as found)

| Severity | Count |
|----------|------:|
| Critical | 1 |
| High | 8 |
| Medium | 12 |
| Low | 25 |
| Info | 2 |
| **Total** | **48** |

---

## 2. CRITICAL

### C-1. Cross-tenant framework deletion cascade-wipes all organizations' assessment data
- **Category:** Authorization / Multi-tenancy
- **Location:** `backend/app/api/v1/frameworks.py` `delete_framework` (models `compliance.py`, `assessments.py`)
- **Description:** `Framework` is global (no `organization_id`); tenants link via `organization_frameworks`. `delete_framework` authorized only by association then called `db.delete(framework)` on the shared row. With `cascade="all, delete-orphan"` on controls and `ondelete="CASCADE"` on `Assessment.framework_id`, this destroyed controls + all orgs' Assessments → Sessions → Answers.
- **Fix:** Tenant DELETE removes only the org's association; the catalog row is hard-deleted only when no other org references it. **[FIXED]**

---

## 3. HIGH

- **H-1. Hardcoded default JWT `SECRET_KEY`, no startup enforcement** — `core/config.py`. Defaulted to `"your-secret-key-here"`; committed `.env` used `yoursecretkeyhere`. Anyone with the default forges tokens for any user/org. **Fix:** startup validator rejects placeholder/short keys when `DEBUG=False`; strong key set in `.env`. **[FIXED]**
- **H-2. Plaintext passwords leaked to logs + response body** — `main.py`. Validation handler copied Pydantic's raw `input`. **Fix:** sanitized handler emits only `loc`/`type`/`msg`. **[FIXED]**
- **H-3. Cross-tenant assessment-session IDOR** — `assessments/router.py`. Session/greeting committed before the org check. **Fix:** org-ownership check moved before any writes. **[FIXED]**
- **H-4. WebSocket chat accepts revoked/logged-out JWTs** — `websocket/router.py`. WS auth never checked the revocation blacklist. **Fix:** added `is_token_revoked` check. **[FIXED]**
- **H-5. Cross-tenant framework tampering via shared-row update** — `frameworks.py` `update_framework`. **Fix:** edits rejected when the framework is associated with more than one org. **[FIXED]**
- **H-6. Refresh tokens never rotated/invalidated on `/refresh` (replay)** — `auth/service.py`, `token_manager.py`. **Fix:** presented refresh token is blacklisted on rotation; reuse of a rotated-out token revokes the whole session. **[FIXED]**
- **H-7. No rate limiting on auth endpoints** — `auth/router.py`. **Fix:** Redis-backed limiter on login (10/min), register (10/min), refresh (20/min). **[FIXED]**
- **H-8. Assessment answer `position_id` IDOR** — `assessments/router.py`. **Fix:** `position_id` is now always derived from `current_user`; the client value is ignored. **[FIXED]**

---

## 4. MEDIUM (12)

| # | Title | Location | Status |
|---|---|---|---|
| M-1 | Token revocation fails open when Redis down (errors via `print`) | `token_manager.py` | Open |
| M-2 | Answers can be saved to completed sessions (no state guard) | `assessments/router.py` | **Fixed** (409 guard) |
| M-3 | Session completion not idempotent (re-scores, resets `completed_at`) | `assessments/router.py` | **Fixed** (idempotent) |
| M-4 | Priv-esc via `/permissions/grant` (no self-grant/ceiling check) | `api/v1/permissions.py` | Open |
| M-5 | Last-admin guard bypassed via `is_active=false` | `api/v1/users.py` | **Fixed** |
| M-6 | `delete_user` has no last-admin / self-delete guard | `api/v1/users.py` | **Fixed** |
| M-7 | Access token in WebSocket URL query string (leaks to logs) | `websocket/router.py`, `useWebSocket.js` | Open |
| M-8 | Refresh token in `sessionStorage` (XSS-stealable) | `frontend/src/api/client.js` | Open |
| M-9 | `DEBUG=True` in `.env` → raw exception strings to clients | `main.py`, `.env` | **Fixed** (`DEBUG=False`) |
| M-10 | `sanitize_input` blacklist rejects valid data ("AT&T", "Children's") | `frameworks.py` | **Fixed** (strip not reject) |
| M-11 | No password-reset / email-verification flows | `auth/router.py` | Open (feature) |
| M-12 | Public `/rag/health` leaks model + infra | `ai/rag/router.py` | **Fixed** (minimal status) |

---

## 5. LOW (25) & INFO (2) — summary

User enumeration (register msg L-1 / login timing L-2); `GET /users/{id}` missing `VIEW_MEMBERS` (L-3); `update_user` foreign `position_id` (L-4); `save_answer` arbitrary `question_id`/no dedup (L-5); asset write gated by read perm (L-6); unbounded asset list/stats (L-7); dept/position delete 500s on FK RESTRICT (L-8); RAG prompt injection (L-9); raw exception strings to RAG clients (L-10); WS content persisted before length check (L-11); unbounded `message_text` to LLM (L-12); FE permission cache not cleared on logout (L-13); stale permission modal (L-14); swallowed user-fetch error (L-15); false "No Assets" during load (L-16); non-semantic + dead "Remember me" (L-17); dropped-and-not-recreated `ai_questions.control_id` FK (L-18); soft-deleted users leak into listings (L-19); `ai_questions` model/DB drift (L-20); **Swagger/OpenAPI exposed unauthenticated (L-21 — Fixed)**; fat frameworks router/dup logic (L-22); **missing security headers (L-23 — Fixed)**; **403-vs-401 (L-24 — Fixed)**; org self-deactivation (L-25).
Info: I-1 framework field length bounds; **I-2 `X-Process-Time` header on every response (Fixed — debug-only)**.

---

## 6. Remediation Status (this release)

**Fixed & verified (16/16 backend tests green + live endpoint sweep on a running server):**
C-1, **all High (H-1…H-8)**, M-2, M-3, M-5, M-6, M-9, M-10, M-12, L-3, L-10, L-21, L-23, L-24, I-2.

Live verification (running server, `tools` sweep of 43 calls): every happy path returns 200/201;
cross-tenant framework read/delete by another org → 404 with the victim's data intact (C-1);
cross-tenant user read → 403; refresh-token replay → 401 (H-6); validation errors no longer
echo submitted values (H-2); RAG errors return a generic message (L-10); `"AT&T …"` framework
names now accepted (M-10).

**Test infrastructure restored** (was reported non-functional):
- Backend suite ran against the **live Supabase prod DB** with no isolation. Now points at a disposable local Postgres, bootstraps schema from the models (the Alembic chain is not reproducible from empty — see L-18/L-20), and added regression tests in `tests/security/`.
- Frontend `vitest` was uninstalled and misconfigured (pulled in Playwright e2e, JSX-in-`.js`, invalid `window.location` URL in `setup.js`). Config fixed; suite now collects and runs (**45/117 pass**; remaining failures are pre-existing UI/a11y assertion mismatches).

**Still open (recommended next):** M-1 (fail-closed revocation), M-4 (grant ceiling/self-grant),
M-7 & M-8 (move tokens off URL/web-storage — needs client + server change), M-11 (password-reset
feature), and the remaining Low/Info items (frontend UX/a11y, migration drift L-18/L-20, prompt-injection
hardening L-9, enumeration L-1/L-2).

---

## 7. Scores (0–100, as found)

| Dimension | Score |
|---|--:|
| Backend | 38 |
| Frontend | 55 |
| API Quality | 48 |
| Security | 25 |
| Performance | 65 |
| UX | 58 |
| Code Quality | 48 |
| Test Coverage (est.) | 5 → ~46% backend measured after restore |
| **Overall Production-Readiness** | **30** (rising after Critical/High remediation) |

---

## 8. Top 5 Must-Fix Before Release

1. **[P0]** Cross-tenant framework destruction (C-1) + update/associate lockdown (H-5). **[DONE]**
2. **[P0]** Default `SECRET_KEY` enforcement + rotation (H-1). **[DONE]**
3. **[P0]** Stop logging/echoing plaintext passwords (H-2). **[DONE]**
4. **[P1]** Assessment-session IDOR (H-3) + WS revocation (H-4). **[DONE]**
5. **[P1]** Auth rate limiting (H-7) + refresh rotation/reuse detection (H-6). **[DONE]**

> ⚠️ The committed `backend/.env` contains live Supabase database credentials. Rotate them and ensure `.env` is never committed.
