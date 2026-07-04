<div align="center">

<img src="docs/assets/amenly-logo.png" alt="Amenly Logo" width="180"/>

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
[![Ollama](https://img.shields.io/badge/Ollama-LLM-000000?style=flat-square&logo=ollama&logoColor=white)](https://ollama.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](#-license)

</div>

---

## 📑 Table of Contents

1. [Overview](#-overview)
2. [Key Features](#-key-features)
3. [Architecture](#-architecture)
4. [The RAG Engine](#-the-rag-engine)
5. [Technology Stack](#-technology-stack)
6. [Project Structure](#-project-structure)
7. [Domain Model](#-domain-model)
8. [Quick Start](#-quick-start)
9. [Configuration](#-configuration)
10. [Command Reference (Makefile)](#-command-reference-makefile)
11. [API Reference](#-api-reference)
12. [Authentication & Permissions](#-authentication--permissions)
13. [Frontend](#-frontend)
14. [Testing](#-testing)
15. [Security](#-security)
16. [Deployment](#-deployment)
17. [Troubleshooting](#-troubleshooting)
18. [Roadmap](#-roadmap)
19. [Contributing](#-contributing)
20. [License](#-license)

---

## 📋 Overview

**Amenly** is a full-stack, multi-tenant **Governance, Risk & Compliance (GRC)** platform that helps organizations achieve and maintain regulatory compliance with the assistance of a **Retrieval-Augmented Generation (RAG)** engine grounded in real compliance frameworks.

Traditional GRC tools rely on static spreadsheets and manual checklists. Amenly replaces them with **AI-driven, conversational assessments**: it generates context-aware questions directly from framework controls, scores the answers, surfaces compliance gaps, and cites the exact clauses behind every recommendation — so guidance is always **traceable and auditable**, never hallucinated.

The platform is organized around a clean separation of concerns:

- A **React 18 single-page application** delivers the landing experience, authentication, the compliance dashboard, and the AI chat interface.
- An **asynchronous FastAPI backend** exposes a versioned REST API plus a WebSocket channel, structured as independent, testable feature modules.
- A set of **purpose-built data stores** — PostgreSQL for relational data, Redis for tokens and caching, Qdrant for vector search, and Ollama for LLM inference and embeddings.

> **The core idea:** every RAG answer is filtered by organization *and* validated against retrieved context. The language model is explicitly instructed to answer **only** from grounded sources, with an explicit fallback when no relevant context exists — eliminating hallucinated compliance advice.

### At a Glance

| | |
|---|---|
| **Domain** | Governance, Risk & Compliance (GRC) |
| **Backend** | Python 3.12+ · FastAPI · async SQLAlchemy 2 |
| **Frontend** | React 18 · Vite 6 · Tailwind CSS |
| **AI** | RAG over Qdrant · Ollama (`gpt-oss:120b-cloud`, `nomic-embed-text`) |
| **Data** | PostgreSQL 16 (Supabase) · Redis 7 · Qdrant |
| **Auth** | JWT (access/refresh) + Redis revocation · RBAC |
| **Tenancy** | Organization-scoped isolation across all data & AI retrieval |

---

## ✨ Key Features

### 🔐 Authentication & Security
- JWT-based authentication with separate **access and refresh** tokens (HS256).
- **Redis-backed token revocation** — logout and token rotation are honored despite JWT being stateless.
- **bcrypt** password hashing via passlib.
- Approval-based onboarding: new members submit a **join-request** that an org admin must approve before an account is created.
- Strong-secret enforcement, sanitized validation errors, security headers (CSP, HSTS, X-Frame-Options), and rate limiting on sensitive endpoints.

### 📊 Compliance Management
- Catalog of **20+ frameworks** (ISO 27001, SOC 2, GDPR, HIPAA, NIST CSF, and more) modeled down to individual **controls**.
- Frameworks classified by **type, category, region, industry**, and mandatory status.
- Many-to-many **organization ↔ framework** association, so each org tracks only the frameworks it cares about.
- Controls mapped to organizational **positions** with importance weights that drive relevance and scoring.

### 🤖 AI & RAG System
- **Grounded question answering** — semantic retrieval from Qdrant, strictly organization-isolated, feeding a constrained LLM prompt.
- **Structured responses** — answers parsed into sections with **source references** (framework, section, control ID, similarity score) and a computed **confidence score**.
- **Semantic search** endpoint for retrieval without generation.
- **AI-generated assessment questions** derived dynamically from framework controls, including greetings and contextual follow-ups.

### 📝 AI-Driven Assessments
- Conversational assessments delivered over a **real-time WebSocket** channel.
- Automatic **scoring** of answers with per-control compliance status and evidence tracking.
- Session-based flow: assessment → session (per user) → answers → aggregated scores.

### 🎯 Risk & Asset Management
- Infrastructure **asset register** (asset type, criticality, owner, JSON properties).
- **Risk** records linked to assets, quantified by probability × impact and severity.

### 📈 Analytics & Dashboards
- Real-time **compliance posture** and gap analysis.
- Interactive **infrastructure map**, stat cards, compliance charts, and a regulation tracker.
- Organization-scoped analytics for assets and vulnerabilities.

### 🏢 Multi-Tenancy & RBAC
- Full **organization-based data isolation** — including vector retrieval.
- Two-tier **role-based access control**: static role permissions plus per-user database overrides with expiry.
- Organizational hierarchy: **Organization → Department → Position → User**.

### 🛠️ Developer Experience
- **One-command** full-stack launch (`make run`).
- Comprehensive Makefile targets for both root and backend.
- Auto-generated **OpenAPI docs** (Swagger + ReDoc).
- Async-first, type-safe codebase with linting, formatting, and type-checking configured.

---

## 🏗️ Architecture

Amenly is a decoupled full-stack system: a React SPA talking to an async FastAPI API, backed by relational, cache, and vector stores, with a local/cloud LLM powering the AI layer.

### System Topology

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
        │  ┌──────────┐ ┌──────────────┐ ┌────────────┐ ┌─────────────┐  │
        │  │ Auth/RBAC│ │ Organizations│ │ Frameworks │ │ Assessments │  │
        │  └──────────┘ └──────────────┘ └────────────┘ └─────────────┘  │
        │  ┌──────────┐ ┌──────────────┐ ┌────────────┐ ┌─────────────┐  │
        │  │  Assets  │ │  Dashboard   │ │Permissions │ │     RAG     │  │
        │  └──────────┘ └──────────────┘ └────────────┘ └─────────────┘  │
        └──────┬───────────────┬───────────────┬───────────────┬────────┘
               │               │               │               │
               ▼               ▼               ▼               ▼
        ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
        │ PostgreSQL │  │   Redis    │  │   Qdrant   │  │   Ollama   │
        │ (Supabase) │  │  tokens &  │  │  vector    │  │  LLM +     │
        │ relational │  │  caching   │  │  search    │  │ embeddings │
        └────────────┘  └────────────┘  └────────────┘  └────────────┘
```

### Architectural Layers

The backend follows a **layered, feature-sliced** design. Each domain module owns its own transport, business logic, and data-access layers:

```
Router  (transport)   →  FastAPI endpoints, request validation, auth dependencies
   │
Service (business)    →  domain logic, orchestration, scoring, AI calls
   │
Repository (data)     →  SQLAlchemy queries, persistence, transactions
   │
Model / Schema        →  ORM entities (SQLAlchemy)  +  DTOs (Pydantic)
```

### Design Patterns

- **Feature slicing** — `auth/`, `organizations/`, `assessments/`, etc. each bundle `router` / `service` / `repository`, keeping modules independent and testable.
- **Dependency injection** — FastAPI dependencies provide the DB session, current user, and permission guards.
- **Repository pattern** — data access is isolated from business logic.
- **DTO separation** — Pydantic schemas decouple the API contract from ORM models.
- **Guard factories** — `require_permission()`, `require_any_permission()`, `require_all_permissions()` generate reusable authorization dependencies.

### Request Lifecycle

```
Client → CORS + security-headers middleware → auth dependency (JWT decode + revocation check)
       → permission guard → router → service → repository → PostgreSQL
       → response schema → sanitized error handling → JSON
```

---

## 🧠 The RAG Engine

The Retrieval-Augmented Generation pipeline is the heart of Amenly's AI. It turns a natural-language compliance question into a grounded, cited answer.

```
 ┌─────────┐   ┌──────────────┐   ┌───────────────┐   ┌──────────────────┐
 │  Query  │──▶│    Embed     │──▶│    Retrieve   │──▶│  Org-isolation   │
 │  (user) │   │ nomic-embed  │   │    Qdrant     │   │  filter (org_id  │
 │         │   │ text · 768-d │   │ query_points  │   │  OR "PUBLIC")    │
 └─────────┘   └──────────────┘   └───────────────┘   └────────┬─────────┘
                                                               │
 ┌────────────────────┐   ┌───────────────────┐   ┌────────────▼─────────┐
 │  Structured answer │◀──│  Ollama generate  │◀──│   Context builder    │
 │  sections · sources│   │ gpt-oss:120b-cloud│   │  ~3k tokens · dedup  │
 │  confidence score  │   │  temp 0.2         │   │  rank · truncate     │
 └────────────────────┘   └───────────────────┘   └──────────────────────┘
```

**Step by step:**

1. **Embed** — the query is normalized and embedded with `nomic-embed-text` (768 dimensions) via Ollama's `/api/embeddings`.
2. **Retrieve** — Qdrant's `query_points` runs a similarity search against the `compliance_frameworks` collection with a score threshold and optional framework filter.
3. **Isolate** — results are filtered so only chunks belonging to the caller's organization (or marked `PUBLIC`) are returned, then deduplicated and truncated to `top_k`.
4. **Build context** — the context builder assembles the top chunks into a bounded (~3,000-token) prompt context, ranked by relevance.
5. **Prompt** — a compliance-analyst system prompt instructs the model to answer **only** from the provided context, with a defined "no context" fallback.
6. **Generate** — `gpt-oss:120b-cloud` produces the answer via Ollama's `/api/generate` at temperature 0.2 / top-p 0.9, with retries, backoff, model validation, and health checks.
7. **Structure** — the markdown answer is parsed into sections; source references (framework, section, control ID, score) are built from the top chunks; a heuristic confidence score and metadata (word count, reading time) are attached.

| Component | Technology / Model |
|---|---|
| Embeddings | Ollama · `nomic-embed-text` (768-dim) |
| Vector store | Qdrant · collection `compliance_frameworks` |
| LLM | Ollama · `gpt-oss:120b-cloud` |
| Generation params | temperature 0.2 · top-p 0.9 · num_ctx 8192 · up to 2048 tokens |
| Isolation | per-organization retrieval filter (`org_id` or `PUBLIC`) |

---

## 🧰 Technology Stack

<table>
<tr><td valign="top" width="50%">

### Backend
- **Python 3.12+**
- **FastAPI** · Uvicorn / Gunicorn (ASGI)
- **SQLAlchemy 2** (async) · **psycopg 3** · **Alembic**
- **PostgreSQL 16** (Supabase pooler)
- **Redis 7** — token store & caching
- **Qdrant** — vector database
- **Ollama** — LLM + embeddings
- **LangChain** · tiktoken · text-splitters
- **PyMuPDF** · python-docx · openpyxl (ingestion)
- **Celery + Flower** — async task processing
- **python-jose** (JWT) · passlib · **bcrypt**
- **structlog** · Prometheus client
- **Poetry** — dependency management

</td><td valign="top" width="50%">

### Frontend
- **React 18** · **Vite 6**
- **React Router 6** — routing
- **axios** — HTTP client with auth interceptors
- **Framer Motion** — animation
- **Recharts** — data visualization
- **Tailwind CSS** · PostCSS · Autoprefixer

### Tooling & QA
- **pytest** · pytest-asyncio · pytest-cov
- **Vitest** + Testing Library (unit)
- **Playwright** — end-to-end
- **MSW** — API mocking
- **black** · **isort** · **ruff** · **flake8** · **mypy**
- **pre-commit** hooks

### AI / Models
- LLM: `gpt-oss:120b-cloud`
- Embeddings: `nomic-embed-text` (768-dim)

</td></tr>
</table>

---

## 📁 Project Structure

```
Amenly_Grad_project/
│
├── backend/                          # FastAPI application
│   ├── app/
│   │   ├── main.py                   # App factory: middleware, exception handlers, routers
│   │   ├── core/                     # Settings, structlog config, rate limiting
│   │   ├── database/                 # Async engine, session, declarative Base
│   │   ├── models/                   # SQLAlchemy ORM entities (GRC domain)
│   │   │   ├── identity.py           #   Organization, Department, Position, User, JoinRequest
│   │   │   ├── compliance.py         #   Framework, FrameworkControl, ControlPosition, AIQuestion
│   │   │   ├── assessments.py        #   Assessment, AssessmentSession, AssessmentAnswer
│   │   │   ├── assets_risks.py       #   Asset, Risk, Document, DocumentChunk
│   │   │   ├── permissions.py        #   PermissionModel, RolePermission, UserRolePermission
│   │   │   ├── chat.py               #   ChatMessage, InfrastructureAsset
│   │   │   └── enums.py              #   UserRole, RiskSeverity, ControlStatus, Permission, …
│   │   ├── schemas/                  # Pydantic request/response DTOs
│   │   ├── auth/                     # JWT auth, RBAC, token revocation, security
│   │   ├── organizations/            # Orgs, departments, positions, onboarding
│   │   ├── assessments/              # AI question generation, sessions, scoring
│   │   ├── assets/                   # Infrastructure asset register
│   │   ├── dashboard/                # Compliance analytics
│   │   ├── websocket/                # Real-time assessment chat (manager + router)
│   │   ├── ai/                       # RAG subsystem
│   │   │   ├── embeddings/           #   Embedding service (Ollama)
│   │   │   ├── ingestion/            #   File validators & document processing
│   │   │   ├── llm/                  #   Ollama LLM client
│   │   │   └── rag/                  #   Retrieval, context builder, prompts, router
│   │   └── api/v1/                   # Aggregated routers (frameworks, users, permissions)
│   ├── alembic/                      # Database migrations
│   ├── scripts/                      # Ingestion & scraping utilities
│   ├── tests/                        # pytest suite
│   ├── Dockerfile
│   ├── Makefile                      # Backend commands
│   └── pyproject.toml                # Poetry project & tool config
│
├── frontend/                         # React + Vite SPA
│   ├── src/
│   │   ├── pages/                    # LandingPage, AuthPage, DashboardPage,
│   │   │                             #   AIComplianceChat, AdminPanel, PermissionsPage, …
│   │   ├── components/               # UI, chat/, dashboard/, compliance/ widgets
│   │   ├── api/                      # axios client + per-domain services
│   │   ├── context/                  # AuthContext, DashboardContext
│   │   ├── hooks/                    # useAuth, useFrameworks, useWebSocket
│   │   ├── utils/ · constants/ · data/
│   │   └── __tests__/                # Vitest unit + Playwright E2E
│   ├── public/                       # Static assets, logo, 3D scene
│   ├── vite.config.js
│   └── package.json
│
├── docs/                             # Documentation & assets (logo)
├── docker/                           # nginx config
├── docker-compose.yml                # Postgres · Redis · Qdrant · Ollama · backend · nginx
├── Makefile                          # Full-stack orchestration
└── README.md
```

---

## 🗂️ Domain Model

### Core Relationships

```
Organization ─┬─ Department ─── Position ─── User
              │                    │
              │                    └── ControlPosition (weighted control mapping)
              │
              ├─ Framework  (many-to-many via organization_frameworks)
              │     └── FrameworkControl ─── AIQuestion
              │
              ├─ Assessment (org + framework)
              │     └── AssessmentSession (per user)
              │            ├── AssessmentAnswer (per question + position)
              │            └── ChatMessage
              │
              └─ Asset ─── Risk
                    Document ─── DocumentChunk  (RAG source docs; vectors in Qdrant)
```

### Key Entities

| Entity | Purpose |
|---|---|
| **Organization** | Tenant root — company profile, single-use invite code, framework associations. |
| **Department → Position** | Organizational hierarchy; positions link users, control mappings, and answers. |
| **User** | Belongs to an org + position; holds role, credentials, activity, permissions. |
| **OrganizationJoinRequest** | Pending signup (hashed credentials) awaiting admin approval. |
| **Framework → FrameworkControl** | Compliance standard and its individual controls (code, title, guidance). |
| **ControlPosition** | Maps a control to a position with an importance weight. |
| **AIQuestion** | AI-generated question per control (logic type, expected evidence). |
| **Assessment → Session → Answer** | An org's evaluation against a framework, run per user, scored per answer. |
| **Asset → Risk** | Infrastructure inventory and the risks associated with each asset. |
| **Document → DocumentChunk** | Source documents for RAG; chunk text + metadata (vectors stored in Qdrant). |
| **PermissionModel / RolePermission / UserRolePermission** | RBAC definitions, role grants, and per-user overrides. |

### Enumerations

| Enum | Values (summary) |
|---|---|
| `UserRole` | `ORG_ADMIN`, `ORG_MEMBER` |
| `JoinRequestStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `AssessmentStatus` | draft / in-progress / completed states |
| `ControlStatus` | per-control compliance status |
| `RiskSeverity` | risk / asset criticality levels |
| `AssetType` | infrastructure asset categories |
| `FrameworkType`, `FrameworkCategory` | framework classification |
| `Permission` | ~25 fine-grained RBAC permissions |

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Notes |
|---|---|
| **Python 3.12+** | with [Poetry](https://python-poetry.org) |
| **Node.js 18+** | with npm |
| **Docker** | for PostgreSQL, Redis, Qdrant (or use Supabase for the DB) |
| **[Ollama](https://ollama.com)** | running locally for AI features |

### ⚡ One-Command Launch (Recommended)

From the repository root, this starts **both** the backend (`:8001`) and the frontend (`:5173`), fully wired together:

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
| 🤖 RAG Health | http://localhost:8001/api/v1/rag/health |

Handy companions: `make run-backend`, `make run-frontend`, `make status`, `make stop-all`.

### Manual Setup

<details>
<summary><b>1 · Backend</b></summary>

```bash
cd backend
cp .env.example .env                # then fill in your secrets
poetry install                      # install dependencies
poetry run alembic upgrade head     # apply database migrations
make dev                            # run with hot reload on :8001
```
</details>

<details>
<summary><b>2 · Frontend</b></summary>

```bash
cd frontend
npm install
# .env.local already points to http://localhost:8001/api/v1
npm run dev                         # Vite dev server on :5173
```
</details>

<details>
<summary><b>3 · Start Ollama & pull models</b></summary>

```bash
ollama serve                        # in a separate terminal
ollama pull nomic-embed-text        # embeddings
# the LLM (gpt-oss:120b-cloud) is resolved via your Ollama configuration
```
</details>

<details>
<summary><b>4 · Infrastructure via Docker Compose</b></summary>

```bash
docker compose up -d                # PostgreSQL, Redis, Qdrant, Ollama, backend, nginx
```
</details>

---

## ⚙️ Configuration

Backend configuration lives in `backend/.env` (copy from `.env.example`). The most important variables:

```ini
# ── Application ───────────────────────────────────────────────
PROJECT_NAME=Amenly
SECRET_KEY=<32+ character secret>        # required; weak/default keys rejected outside DEBUG
DEBUG=True
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=100
REFRESH_TOKEN_EXPIRE_DAYS=7

# ── Database (PostgreSQL / Supabase pooler) ───────────────────
DATABASE_URL=postgresql+psycopg://user:pass@host:6543/postgres
POSTGRES_SERVER=your-project.pooler.supabase.com
POSTGRES_USER=postgres.xxxxx
POSTGRES_PASSWORD=your-database-password
POSTGRES_DB=postgres

# ── Redis (tokens & caching) ──────────────────────────────────
REDIS_URL=redis://redis:6379/0

# ── Qdrant (vector store) ─────────────────────────────────────
QDRANT_URL=http://qdrant:6333

# ── Ollama (AI) ───────────────────────────────────────────────
OLLAMA_URL=http://ollama:11434
AI_MODEL=gpt-oss:120b-cloud
EMBEDDING_MODEL=nomic-embed-text

# ── CORS ──────────────────────────────────────────────────────
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

Frontend configuration lives in `frontend/.env.local`:

```ini
VITE_API_BASE_URL=http://localhost:8001/api/v1
VITE_WS_BASE_URL=ws://localhost:8001/ws
```

> 🔒 **Secrets are git-ignored.** `backend/.env` and `frontend/.env.local` are never committed. The DB session uses `NullPool` + disabled server-side prepared statements for compatibility with the Supabase transaction pooler (pgbouncer).

---

## 🧾 Command Reference (Makefile)

### Root (`make …`)

| Command | Description |
|---|---|
| `make run` | Start **both** backend and frontend, connected. |
| `make run-backend` | Start the backend only. |
| `make run-frontend` | Start the frontend only. |
| `make status` | Check the status of all services. |
| `make stop-all` | Stop all running services. |
| `make up` / `make down` | Start / stop the Docker stack. |
| `make logs` / `make ps` | Docker logs / running containers. |
| `make test` / `make test-cov` | Run tests / with coverage. |

### Backend (`cd backend && make …`)

| Command | Description |
|---|---|
| `make install` / `make install-dev` | Install dependencies (with dev tools). |
| `make run` | Run the server (production mode) on `:8001`. |
| `make dev` | Run with hot reload. |
| `make status` / `make stop` / `make stop-all` | Service management. |
| `make migrate` / `make makemigrations` / `make downgrade` | Alembic migrations. |
| `make seed` | Seed the database with initial data. |
| `make test` / `make test-unit` / `make test-integration` | Run the test suite. |
| `make lint` / `make format` / `make type-check` | Code quality (ruff/flake8 · black/isort · mypy). |
| `make check` / `make ci` | Run the full quality gate locally. |
| `make shell` | Open a Python shell with app context. |

---

## 📚 API Reference

Interactive documentation is served at **`/docs`** (Swagger UI) and **`/redoc`**. All REST endpoints are versioned under **`/api/v1`**; the real-time assessment chat runs over **`/ws`**.

### Endpoint Groups

| Group | Prefix | Key Operations |
|---|---|---|
| **Auth** | `/auth` | `register`, `join-request`, `login`, `refresh`, `logout`, `change-password`, `me`, token status. |
| **Users** | `/users` | List/create users, `PATCH /me` (self profile), get/update/delete by id (admin). |
| **Organizations** | `/orgs` | Org profile, profile completion, invite-code regenerate, join-request list/approve/reject, departments & positions CRUD. |
| **Frameworks** | `/frameworks` | List, stats, types, categories, regions, get by id, create/update/delete (admin), associate/dissociate org ↔ framework, `available/all`. |
| **Permissions** | `/permissions` | List permissions, role/user permissions, grant/assign, revoke. |
| **Assessments** | `/assessments` | Create/list/get assessments, start session, submit answers, chat/follow-up, results/scores. |
| **Assets** | `/assets` | Create/list/get infrastructure assets. |
| **Dashboard** | `/dashboard` | Compliance dashboards, assets, and vulnerability analytics. |
| **RAG** | `/rag` | `POST /query` (grounded Q&A), `POST /search` (semantic search), `GET /health`. |
| **WebSocket** | `/ws` | `/ws/assessments/{session_id}/chat` — live assessment conversation. |

### Example — Login

```bash
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@acme.com", "password": "Test@1234"}'
```

Response (flat token payload):

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": { "id": "...", "email": "admin@acme.com", "role": "org_admin" }
}
```

### Example — Grounded RAG Query

```bash
curl -X POST http://localhost:8001/api/v1/rag/query \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "What does ISO 27001 require for access control?"}'
```

Returns a structured answer: parsed **sections**, **source references** (framework, section, control ID, similarity score), a **confidence score**, and metadata (word count, reading time).

### HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` / `201` | Success / created |
| `401` | Missing or invalid token (triggers frontend auto-refresh) |
| `403` | Authenticated but lacking the required permission |
| `404` | Resource not found |
| `422` | Validation error (sanitized — never leaks sensitive input) |
| `429` | Rate limit exceeded |

---

## 🔑 Authentication & Permissions

### Token Flow

```
login ─▶ access token (100 min) + refresh token (7 days)
      ─▶ access token used as  Authorization: Bearer <token>
      ─▶ on 401, frontend silently calls /auth/refresh (single-flight)
      ─▶ refresh rotates tokens; the previous access token is revoked in Redis
      ─▶ logout blacklists the active token
```

- **Access & refresh tokens** are signed with HS256 and carry a `type` claim; the backend rejects a refresh token used as an access token and vice-versa.
- **Revocation** is Redis-backed: active tokens are tracked per user with a TTL, and blacklisted on logout or rotation. If Redis is unavailable, the system degrades gracefully to "not revoked."
- The **frontend** keeps the access token in memory and the refresh token in `sessionStorage`, with an axios response interceptor that performs a **single-flight refresh** on `401` and redirects to `/login` on failure.

### Role-Based Access Control

RBAC is two-tiered:

1. **Static role permissions** — `ROLE_PERMISSIONS` maps each role (`org_admin`, `org_member`) to a base set of permissions.
2. **Per-user overrides** — `UserRolePermission` rows grant or extend permissions for individual users, with `granted_by` and optional `expires_at`.

`get_user_permissions()` merges both tiers; `has_permission()` resolves aliases. Endpoint guards are built with the factories `require_permission()`, `require_any_permission()`, and `require_all_permissions()`, which raise `403` on failure. The frontend mirrors these checks in `ProtectedRoute` (e.g. `requireAdmin`, `requireAnyPermission`).

---

## 💻 Frontend

The frontend is a **React 18 + Vite 6** single-page application.

### Routes

| Path | Page | Guard |
|---|---|---|
| `/` | Landing page (3D hero, marketing) | public |
| `/login`, `/signup` | Authentication | redirects if already authenticated |
| `/about` | About | public |
| `/dashboard` | Compliance dashboard | authenticated |
| `/ai-compliance` | AI compliance chat / assessment | permission-gated |
| `/permissions` | Permission management | `manage_permissions` / `grant_permissions` |
| `/admin` | Admin panel | admin only |
| `*` | 404 Not Found | public |

### API Layer

A single axios instance (`src/api/client.js`) attaches the bearer token via a request interceptor and handles token refresh via a response interceptor. Per-domain service modules live alongside it: `auth`, `frameworks`, `assessments`, `assets`, `dashboard`, `organizations`, and `rag`.

### Notable UI

- **Dashboard** — stat cards, compliance charts (Recharts), an interactive infrastructure map, asset detail panels, and a regulation tracker.
- **AI Compliance Chat** — a conversational assessment interface backed by the WebSocket channel, with typing indicators, progress bar, option buttons, and summary cards.
- **Animation** — Framer Motion transitions throughout, plus a 3D hero scene on the landing page.

### Frontend Scripts

```bash
npm run dev            # start Vite dev server (:5173)
npm run build          # production build (terser, vendor chunk splitting)
npm run preview        # preview the production build
npm test               # unit tests (Vitest)
npm run test:e2e       # end-to-end tests (Playwright)
npm run test:all       # unit + E2E
```

---

## 🧪 Testing

### Backend — pytest

```bash
cd backend
make test              # full suite with coverage
make test-unit         # unit tests only
make test-integration  # integration tests only
make lint              # ruff + flake8
make type-check        # mypy
make check             # format-check + lint + test (full gate)
```

### Frontend — Vitest + Playwright

```bash
cd frontend
npm test               # unit tests (Vitest + Testing Library)
npm run test:coverage  # unit tests with coverage
npm run test:e2e       # end-to-end (Playwright)
npm run test:all       # unit + E2E
```

The frontend test suite covers API clients, auth context, hooks, pages, components, and end-to-end flows (auth, dashboard, RAG), with **MSW** mocking backend responses in unit tests.

---

## 🔐 Security

| Area | Measures |
|---|---|
| **Authentication** | JWT access/refresh (HS256), bcrypt password hashing, Redis token revocation & rotation. |
| **Authorization** | Two-tier RBAC (static roles + per-user DB overrides with expiry), guard factories. |
| **Multi-tenancy** | Every query — including vector retrieval — is scoped to the caller's organization. |
| **Input safety** | Sanitized `422` validation errors that never echo sensitive input (e.g. passwords). |
| **Transport** | Security headers: CSP, HSTS, X-Frame-Options; CORS allow-list. |
| **Abuse prevention** | Rate limiting / brute-force protection on sensitive endpoints. |
| **Config hardening** | Rejects weak or default `SECRET_KEY` when `DEBUG` is off. |
| **Onboarding** | Approval-gated join-requests before account provisioning. |

---

## 🚢 Deployment

Amenly ships with a Docker Compose stack for local and container deployments:

```bash
docker compose up -d
```

| Service | Image | Purpose |
|---|---|---|
| `db` | `postgres:16-alpine` | Relational database |
| `redis` | `redis:7-alpine` | Token store & cache |
| `qdrant` | `qdrant/qdrant` | Vector search |
| `ollama` | `ollama/ollama` | LLM + embeddings |
| `backend` | built from `backend/Dockerfile` | FastAPI API |
| `nginx` | `nginx:alpine` | Reverse proxy |

For production, the backend runs under **Gunicorn** with Uvicorn workers, the database points at **Supabase** (transaction pooler), and the frontend is built with `npm run build` (with console stripping and vendor chunk splitting) for static hosting (e.g. Vercel — see `frontend/vercel.json`).

---

## 🛠️ Troubleshooting

| Symptom | Likely cause & fix |
|---|---|
| RAG returns "no context" | Qdrant collection empty or Ollama unreachable — verify `docker compose ps` and `ollama serve`; re-run ingestion. |
| `401` loops on the frontend | Refresh token missing/expired — log in again; check `VITE_API_BASE_URL`. |
| Backend won't start (secret error) | `SECRET_KEY` too weak with `DEBUG=False` — set a 32+ char secret. |
| DB connection errors on Supabase | Ensure `DATABASE_URL` uses port `6543` and the `postgresql+psycopg://` driver. |
| Port `8001` already in use | Stop the previous backend: `cd backend && make stop`. |
| Embeddings fail | Pull the model: `ollama pull nomic-embed-text`. |

---

## 🗺️ Roadmap

- [ ] Automated document-ingestion pipeline for onboarding new frameworks
- [ ] Evidence upload & attestation workflows
- [ ] Exportable compliance reports (PDF)
- [ ] Streaming RAG responses in the chat UI
- [ ] Notification & remediation task tracking
- [ ] SSO / OAuth provider integration

---

## 🤝 Contributing

1. Create a feature branch from `main`.
2. Follow the existing feature-sliced structure (`router` / `service` / `repository`).
3. Run the quality gate before pushing:
   ```bash
   cd backend && make check      # format-check + lint + test
   cd frontend && npm run test:all
   ```
4. Keep commits focused and descriptive; open a pull request against `dev`.

---

## 📄 License

**Proprietary.** All rights reserved. Amenly was developed as a graduation project; contact the maintainers for usage terms.

<div align="center">

<br/>

<img src="docs/assets/amenly-logo.png" alt="Amenly" width="60"/>

**Amenly** — *Compliance, grounded in intelligence.*

</div>
