<div align="center">

# 🛡️ Amenly

### AI-Powered Governance, Risk & Compliance Platform

*Enterprise-grade GRC, reimagined with Retrieval-Augmented Generation.*

<br/>

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-DC244C?style=flat-square&logo=qdrant&logoColor=white)](https://qdrant.tech)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](#-license)

[Overview](#-overview) • [Architecture](#-architecture) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [API](#-api-reference) • [Project Structure](#-project-structure) • [Testing](#-testing)

</div>

---

## 📋 Overview

**Amenly** is a full-stack, multi-tenant **Governance, Risk & Compliance (GRC)** platform that helps organizations achieve and maintain regulatory compliance with the assistance of a **Retrieval-Augmented Generation (RAG)** engine grounded in real compliance frameworks.

Instead of static checklists, Amenly conducts **AI-driven, conversational assessments** — generating context-aware questions from framework controls, scoring answers, surfacing gaps, and citing the exact clauses behind every recommendation.

| Capability | Description |
|---|---|
| 📚 **Framework Management** | Model and track 20+ frameworks — ISO 27001, SOC 2, GDPR, HIPAA, NIST CSF — down to individual controls. |
| 🤖 **RAG Compliance Assistant** | Ask compliance questions and receive structured, **source-cited** answers grounded strictly in ingested framework documents. |
| 📝 **AI-Driven Assessments** | Dynamically generated, control-mapped questions with automatic scoring and evidence tracking, delivered over real-time chat. |
| 🎯 **Risk & Asset Register** | Catalog infrastructure assets, link risks, and quantify severity (probability × impact). |
| 📊 **Compliance Dashboards** | Real-time posture, gap analysis, and analytics with an interactive infrastructure map. |
| 🏢 **Multi-Tenancy & RBAC** | Organization-scoped data isolation, invite/approval onboarding, and fine-grained role-based permissions. |

> **Why it stands out:** every RAG answer is filtered by organization *and* validated against retrieved context — the model is explicitly instructed to answer **only** from grounded sources, eliminating hallucinated compliance advice.

---

## 🏗️ Architecture

Amenly is a decoupled full-stack system: a **React SPA** talking to an **async FastAPI** API, backed by relational, cache, and vector stores, with a local/cloud **LLM** powering the AI layer.

```
                        ┌──────────────────────────────────────────┐
                        │            React 18 SPA (Vite)            │
                        │  Landing · Auth · Dashboard · AI Chat     │
                        │  axios client  ·  JWT auto-refresh        │
                        └───────────────┬──────────────────────────┘
                                        │  REST /api/v1  +  WebSocket /ws
                                        ▼
        ┌───────────────────────────────────────────────────────────────┐
        │                      FastAPI  (async)                          │
        │                                                                │
        │   Auth/RBAC │ Organizations │ Frameworks │ Assessments         │
        │   Assets/Risks │ Dashboard │ Permissions │ RAG                 │
        └──────┬───────────────┬───────────────┬───────────────┬────────┘
               │               │               │               │
               ▼               ▼               ▼               ▼
        ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
        │ PostgreSQL │  │   Redis    │  │   Qdrant   │  │   Ollama   │
        │ (Supabase) │  │  tokens &  │  │  vector    │  │  LLM +     │
        │ relational │  │  caching   │  │  search    │  │ embeddings │
        └────────────┘  └────────────┘  └────────────┘  └────────────┘
```

### RAG Pipeline

```
Query ─▶ Embed (nomic-embed-text, 768-d) ─▶ Qdrant retrieval
      ─▶ Org-isolation filter (org_id OR "PUBLIC")
      ─▶ Context builder (~3k tokens, dedup + rank)
      ─▶ Prompt (answer ONLY from context) ─▶ Ollama (gpt-oss:120b-cloud)
      ─▶ Structured response (sections · sources · confidence)
```

### Design Highlights

- **Feature-sliced backend** — each domain (`auth`, `organizations`, `assessments`, …) owns its `router` / `service` / `repository`, keeping business logic testable and isolated from transport.
- **Stateless auth with revocation** — JWT access/refresh tokens with a Redis-backed blacklist, so logout and rotation are honored despite JWT being stateless.
- **pgbouncer-safe async DB** — `NullPool` + disabled server-side prepared statements for compatibility with the Supabase transaction pooler.
- **Grounded AI** — retrieval is always scoped to the caller's organization, and the LLM is constrained to cited context with an explicit "no context" fallback.

---

## 🧰 Tech Stack

<table>
<tr><td valign="top" width="50%">

**Backend**
- Python 3.12+ · FastAPI · Uvicorn/Gunicorn
- SQLAlchemy 2 (async) · psycopg 3 · Alembic
- PostgreSQL 16 (Supabase) · Redis 7
- Qdrant (vector store) · Ollama (LLM)
- LangChain · tiktoken · PyMuPDF · python-docx
- Celery + Flower (async tasks)
- JWT (python-jose) · bcrypt / passlib
- structlog · Prometheus client
- Poetry · pytest · black · ruff · mypy

</td><td valign="top" width="50%">

**Frontend**
- React 18 · Vite 6 · React Router 6
- axios (interceptor-based auth + auto-refresh)
- Framer Motion (animation) · Recharts (charts)
- Tailwind CSS · PostCSS
- Vitest + Testing Library (unit)
- Playwright (E2E) · MSW (API mocking)

**AI / Models**
- LLM: `gpt-oss:120b-cloud` (via Ollama)
- Embeddings: `nomic-embed-text` (768-dim)

</td></tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.12+** and **[Poetry](https://python-poetry.org)**
- **Node.js 18+** and **npm**
- **Docker** (for Qdrant, Redis, PostgreSQL) — or Supabase for the database
- **[Ollama](https://ollama.com)** running locally for the AI features

### One-Command Launch

From the repository root, this starts **both** the backend (`:8001`) and frontend (`:5173`), fully wired together:

```bash
make run
```

| Service | URL |
|---|---|
| 🖥️ Frontend (SPA) | http://localhost:5173 |
| 🌐 Backend API | http://localhost:8001 |
| 📚 API Docs (Swagger) | http://localhost:8001/docs |
| 📖 ReDoc | http://localhost:8001/redoc |
| ❤️ Health Check | http://localhost:8001/health |

Useful companions: `make run-backend`, `make run-frontend`, `make status`, `make stop-all`.

### Manual Setup

<details>
<summary><b>Backend</b></summary>

```bash
cd backend
cp .env.example .env               # then fill in your secrets
poetry install                     # install dependencies
poetry run alembic upgrade head    # apply migrations
make dev                           # run with hot reload on :8001
```
</details>

<details>
<summary><b>Frontend</b></summary>

```bash
cd frontend
npm install
# .env.local already points to http://localhost:8001/api/v1
npm run dev                        # Vite dev server on :5173
```
</details>

<details>
<summary><b>Docker Compose (infrastructure)</b></summary>

```bash
docker compose up -d               # PostgreSQL, Redis, Qdrant, Ollama, backend, nginx
```
</details>

### Configuration

Backend configuration lives in `backend/.env` (see `.env.example`). Key variables:

```ini
# Application
SECRET_KEY=<32+ char secret>          # required; weak keys rejected outside DEBUG
ACCESS_TOKEN_EXPIRE_MINUTES=100
REFRESH_TOKEN_EXPIRE_DAYS=7

# Data stores
DATABASE_URL=postgresql+psycopg://...   # Supabase pooler or local Postgres
REDIS_URL=redis://redis:6379/0
QDRANT_URL=http://qdrant:6333

# AI
OLLAMA_URL=http://ollama:11434
AI_MODEL=gpt-oss:120b-cloud
EMBEDDING_MODEL=nomic-embed-text
```

> 🔒 Secrets (`backend/.env`, `frontend/.env.local`) are git-ignored and never committed.

---

## 📚 API Reference

Interactive documentation is served at **`/docs`** (Swagger UI) and **`/redoc`**. All endpoints are versioned under **`/api/v1`**; the real-time assessment chat runs over **`/ws`**.

| Group | Prefix | Responsibility |
|---|---|---|
| **Auth** | `/auth` | Register (join-request), login, refresh, logout, change password, current user. |
| **Users** | `/users` | User management and self-profile updates. |
| **Organizations** | `/orgs` | Org profile, invite codes, departments & positions, join-request approval. |
| **Frameworks** | `/frameworks` | Framework & control catalog, stats, org ↔ framework association. |
| **Permissions** | `/permissions` | Role/user permission listing, grant, and revoke (RBAC). |
| **Assessments** | `/assessments` | Create assessments, run sessions, submit answers, view scores. |
| **Assets** | `/assets` | Infrastructure asset register. |
| **Dashboard** | `/dashboard` | Compliance analytics, posture, and vulnerability views. |
| **RAG** | `/rag` | `POST /query` (grounded Q&A), `POST /search` (semantic search), `GET /health`. |
| **WebSocket** | `/ws` | `/ws/assessments/{session_id}/chat` — live assessment conversation. |

<details>
<summary><b>Example — grounded RAG query</b></summary>

```bash
curl -X POST http://localhost:8001/api/v1/rag/query \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "What does ISO 27001 require for access control?"}'
```

Returns a structured answer with parsed sections, source references (framework, section, control ID, similarity score), and a computed confidence score.
</details>

---

## 📁 Project Structure

```
Amenly_Grad_project/
├── backend/                       # FastAPI application
│   └── app/
│       ├── main.py                # App factory: middleware, handlers, routers
│       ├── core/                  # Config, logging, rate limiting
│       ├── database/              # Async engine & session
│       ├── models/                # SQLAlchemy ORM (GRC domain)
│       ├── schemas/               # Pydantic request/response models
│       ├── auth/                  # JWT auth, RBAC, token revocation
│       ├── organizations/         # Orgs, departments, positions, onboarding
│       ├── assessments/           # AI questions, sessions, scoring
│       ├── assets/                # Asset & risk register
│       ├── dashboard/             # Compliance analytics
│       ├── websocket/             # Real-time assessment chat
│       ├── ai/                    # RAG: embeddings · ingestion · llm · rag
│       └── api/v1/                # Aggregated routers (frameworks, users, …)
│
├── frontend/                      # React + Vite SPA
│   └── src/
│       ├── pages/                 # Landing, Auth, Dashboard, AI Chat, Admin…
│       ├── components/            # UI, chat, dashboard, compliance widgets
│       ├── api/                   # axios client + per-domain services
│       ├── context/               # Auth & dashboard state
│       ├── hooks/                 # useAuth, useFrameworks, useWebSocket
│       └── __tests__/             # Vitest unit + Playwright E2E
│
├── docker-compose.yml             # Postgres · Redis · Qdrant · Ollama · nginx
├── Makefile                       # One-command full-stack orchestration
└── README.md
```

### Core Domain Model

```
Organization ─┬─ Department ── Position ── User
              ├─ Framework (M2M) ── FrameworkControl ── AIQuestion
              ├─ Assessment ── AssessmentSession ── AssessmentAnswer
              └─ Asset ── Risk
```

---

## 🔐 Security

- **Authentication** — JWT access/refresh tokens (HS256), bcrypt-hashed passwords, Redis-backed token revocation and rotation.
- **Authorization** — two-tier RBAC: static role permissions plus per-user database overrides with expiry.
- **Multi-tenant isolation** — every query, including vector retrieval, is scoped to the caller's organization.
- **Hardening** — enforced strong `SECRET_KEY`, sanitized validation errors (never leaks passwords), security headers (CSP, HSTS, X-Frame-Options), and rate limiting on sensitive endpoints.
- **Onboarding by approval** — new members submit a join-request that an org admin must approve before an account is provisioned.

---

## 🧪 Testing

**Backend** — `pytest` with coverage:

```bash
cd backend
make test            # full suite with coverage
make lint            # ruff + flake8
make type-check      # mypy
make check           # format-check + lint + test
```

**Frontend** — Vitest (unit) + Playwright (E2E):

```bash
cd frontend
npm test             # unit tests (Vitest)
npm run test:coverage
npm run test:e2e     # end-to-end (Playwright)
npm run test:all     # unit + E2E
```

---

## 🗺️ Roadmap

- [ ] Automated document ingestion pipeline for new frameworks
- [ ] Evidence upload & attestation workflows
- [ ] Exportable compliance reports (PDF)
- [ ] Streaming RAG responses in the chat UI
- [ ] Notification & remediation task tracking

---

## 📄 License

**Proprietary.** All rights reserved. This project was developed as a graduation project; contact the maintainers for usage terms.

<div align="center">

---

**Amenly** — *Compliance, grounded in intelligence.*

</div>
