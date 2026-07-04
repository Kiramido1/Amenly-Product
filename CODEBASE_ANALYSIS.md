# Amenly Platform - Comprehensive Codebase Analysis

**Analysis Date:** May 12, 2026  
**Platform:** AI-Powered Compliance & GRC Management System

---

## 1. BACKEND STRUCTURE

### 1.1 Core App Modules

| Module | Location | Purpose |
|--------|----------|---------|
| **ai** | `backend/app/ai/` | LLM & RAG system - embeddings, retrieval, prompt templates |
| **api** | `backend/app/api/v1/` | REST API endpoints (FastAPI routers) |
| **auth** | `backend/app/auth/` | Authentication, authorization, permissions, JWT tokens |
| **assessments** | `backend/app/assessments/` | Assessment creation, session management, answer tracking |
| **assets** | `backend/app/assets/` | Infrastructure asset extraction & management |
| **dashboard** | `backend/app/dashboard/` | Dashboard data aggregation with role-based filtering |
| **database** | `backend/app/database/` | Database session, base models, Alembic migrations |
| **frameworks** | `backend/app/frameworks/` | Compliance frameworks (ISO, NIST, GDPR, etc.) |
| **models** | `backend/app/models/` | SQLAlchemy ORM models for all entities |
| **organizations** | `backend/app/organizations/` | Organization, department, and position management |
| **risks** | `backend/app/risks/` | Risk assessment & scoring (minimal implementation) |
| **schemas** | `backend/app/schemas/` | Pydantic request/response schemas |
| **services** | `backend/app/services/` | Business logic layer |
| **websocket** | `backend/app/websocket/` | Real-time assessment chat connections |

---

### 1.2 API Routes (v1)

**Location:** `backend/app/api/v1/router.py` + `backend/app/api/v1/`

#### Endpoint Structure

```
/api/v1/
├── /auth → Authentication (login, refresh, logout, register)
├── /users → User management (list, get, update)
├── /frameworks → Framework CRUD and organization assignment
├── /permissions → Permission management (role-based + custom)
├── /orgs → Organization management
├── /rag → RAG system (query, search, health)
├── /assessments → Assessment CRUD and sessions
├── /dashboard → Dashboard data (overview, compliance, assets, risks)
└── /assets → Infrastructure asset management
```

#### Key Endpoints (Detailed)

**Authentication:**
- `POST /auth/register` - User registration
- `POST /auth/login` - Login (returns access_token, refresh_token, user)
- `POST /auth/refresh` - Token refresh
- `GET /auth/me` - Current user info

**Frameworks:**
- `GET /frameworks/` - List all frameworks (public/org-specific)
- `POST /frameworks/` - Create framework
- `GET /frameworks/{id}` - Get framework details + controls
- `PUT /frameworks/{id}` - Update framework
- `DELETE /frameworks/{id}` - Delete framework
- `POST /frameworks/add-to-org` - Add frameworks to organization

**Users & Permissions:**
- `GET /users/` - List organization users (require VIEW_MEMBERS)
- `GET /users/{user_id}` - Get user details
- `POST /permissions/grant` - Grant custom permissions
- `POST /permissions/revoke` - Revoke permissions
- `GET /permissions/me` - Get current user permissions

**RAG System:**
- `POST /rag/query` - Query RAG with question + framework context
- `POST /rag/search` - Semantic search (no LLM generation)
- `GET /rag/health` - Check RAG health

**Assessments:**
- `GET /assessments/` - List assessments for organization
- `POST /assessments/` - Create assessment
- `GET /assessments/{id}` - Get assessment details
- `POST /assessments/{id}/sessions/start` - Start assessment session
- `GET /assessments/sessions/{session_id}` - Get session details
- `POST /assessments/sessions/{session_id}/complete` - Complete session
- `POST /assessments/answers` - Save answer to question

**Dashboard:**
- `GET /dashboard/overview` - Summary stats (role-based filtering)
- `GET /dashboard/compliance` - Compliance scores by framework
- `GET /dashboard/assets` - Asset list with filters
- `GET /dashboard/risks` - Risk summary

---

### 1.3 Database Models

**Location:** `backend/app/models/`

#### Core Models

**Identity Models** (`identity.py`):
- `User` - User account with role, organization, department, position
- `Organization` - Organization entity
- `Department` - Org departments
- `Position` - Job positions with framework assignments

**Compliance Models** (`compliance.py`):
- `Framework` - Compliance frameworks (ISO 27001, NIST, GDPR, SOC 2, etc.)
- `FrameworkControl` - Controls within frameworks
- `ControlPosition` - Mapping controls to positions (relevance weighting)
- `AIQuestion` - AI-generated questions per control+position

**Assessment Models** (`assessments.py`):
- `Assessment` - Assessment object linked to framework
- `AssessmentSession` - User session for an assessment
- `AssessmentAnswer` - User answers to questions with compliance scores

**Chat & Asset Models** (`chat.py`):
- `ChatMessage` - Messages in assessment sessions (user + AI)
- `InfrastructureAsset` - Assets extracted from conversations

**Permission Models** (`permissions.py`):
- `PermissionModel` - Available permissions (enum-based)
- `RolePermission` - Permissions per role
- `UserRolePermission` - Custom user permissions (overrides)

**Asset & Risk Models** (`assets_risks.py`):
- `Asset` - Infrastructure assets (servers, firewalls, cloud services)
- `Risk` - Risk objects (assessment results)

**Enum Models** (`enums.py`):
- `UserRole` - SUPER_ADMIN, ORG_ADMIN, ORG_MEMBER
- `AssessmentStatus` - PENDING, IN_PROGRESS, COMPLETED
- `Permission` - VIEW_DASHBOARD, GRANT_PERMISSIONS, VIEW_MEMBERS, etc.
- `FrameworkType` - STANDARD, REGULATORY, CUSTOM
- `FrameworkCategory` - GENERAL, HEALTHCARE, FINANCIAL, GDPR, NIST, ISO, SOC2

---

### 1.4 Services Layer

**Location:** `backend/app/` + module-level services

#### Service Classes

| Service | File | Responsibility |
|---------|------|-----------------|
| `AuthService` | `auth/service.py` | User auth, token generation, permission checks |
| `AssessmentService` | `assessments/service.py` | Assessment creation, session management, answer scoring |
| `AssetExtractionService` | `assets/service.py` | Extract infrastructure assets from chat via LLM |
| `OrganizationService` | `organizations/service.py` | Org CRUD, dept/position management |
| `QuestionGenerator` | `assessments/question_generator.py` | Generate assessment questions |
| `RAGService` | `ai/rag/rag_service.py` | Complete RAG pipeline orchestration |
| `RetrievalService` | `ai/rag/retrieval_service.py` | Qdrant vector search |
| `ContextBuilder` | `ai/rag/context_builder.py` | Build LLM context from retrieved chunks |
| `ContextRetrieval` | `ai/rag/context_retrieval.py` | Dynamic context retrieval for position-based queries |
| `OllamaService` | `ai/llm/ollama_service.py` | Ollama LLM inference (embeddings + generation) |
| `EmbeddingService` | `ai/embeddings/embedding_service.py` | Vector embedding generation |

---

### 1.5 AI/RAG Implementation

**Location:** `backend/app/ai/`

#### RAG Pipeline
```
User Question
  ↓
1. Query Embedding (Ollama)
  ↓
2. Vector Search (Qdrant)
  ↓
3. Chunk Retrieval & Ranking
  ↓
4. Context Building (max_tokens=3000)
  ↓
5. Prompt Construction with templates
  ↓
6. LLM Generation (Ollama)
  ↓
7. Answer Parsing (markdown sections)
  ↓
RAG Response + Metadata + Sources
```

#### Key Files

- **`rag/rag_service.py`** - Main RAG orchestration
- **`rag/retrieval_service.py`** - Qdrant vector DB queries
- **`rag/context_builder.py`** - Context assembly with token management
- **`rag/context_retrieval.py`** - Dynamic retrieval based on position context
- **`rag/prompt_templates.py`** - System & user prompt templates
- **`rag/schemas.py`** - RAG request/response models
- **`rag/router.py`** - RAG API endpoints
- **`llm/ollama_service.py`** - Ollama integration (embeddings + generation)
- **`embeddings/embedding_service.py`** - Vector embedding generation
- **`prompts/`** - Prompt template files (if any)

#### Configuration

- **LLM Model:** Ollama (configurable, defaults to `qwen2.5`)
- **Embedding Model:** `nomic-embed-text`
- **Vector DB:** Qdrant (localhost:6333)
- **Context Window:** 3000 tokens max
- **Confidence Threshold:** Dynamic based on sources count

---

### 1.6 Database Migrations

**Location:** `backend/alembic/versions/`

| Migration | Purpose |
|-----------|---------|
| `a4fe99fdaebb_initial_schema.py` | Initial table creation |
| `5cbae36f3596_create_user_role_permissions_table_.py` | Role-based permissions |
| `1f372c50aca1_add_framework_type_category_and_metadata.py` | Framework enhancements |
| `f377d337324f_add_user_role_permissions_table.py` | Custom user permissions |
| `952e97e2aa29_remove_is_superuser_column.py` | Removed superuser field |
| `f52949bac1f6_cleanup_redundant_tables_and_fix_.py` | Table cleanup |
| `dfdc0978922d_drop_obsolete_trigger_and_function.py` | Removed old triggers |
| `remove_org_from_frameworks.py` | Framework structure cleanup |

---

### 1.7 WebSocket Implementation

**Location:** `backend/app/websocket/`

#### Features
- Real-time assessment chat
- Message types: `message`, `typing`, `history`, `connected`, `pong`, `error`
- RAG integration (async)
- Position-based context retrieval
- Automatic reconnection with exponential backoff (max 5 attempts)

#### Endpoints
- `ws://localhost:8001/ws/assessments/{session_id}/chat?token={access_token}`

---

## 2. FRONTEND STRUCTURE

### 2.1 Pages

**Location:** `frontend/src/pages/`

| Page | Component File | Route | Purpose |
|------|-----------------|-------|---------|
| **Landing** | `LandingPage.jsx` | `/` | Public marketing page with hero, features, CTA |
| **Authentication** | `AuthPage.jsx` | `/auth` | Login & signup (router-based switching) |
| **Dashboard** | `DashboardPage.jsx` | `/dashboard` | Main dashboard (role-based components) |
| **Compliance Chat** | `AIComplianceChat.jsx` | `/compliance-chat` | Assessment wizard + real-time chat |
| **Permissions** | `PermissionsPage.jsx` | `/permissions` | Admin permission management |
| **Not Found** | `NotFoundPage.jsx` | `*` | 404 page |

---

### 2.2 Components

**Location:** `frontend/src/components/`

#### Core Components
- `Button.jsx` - Reusable button component
- `Navbar.jsx` - Navigation bar
- `Footer.jsx` - Footer
- `ErrorBoundary.jsx` - Error handling wrapper
- `LoadingScreen.jsx` - Loading indicator
- `LoadingSpinner.jsx` - Spinner component
- `ProtectedRoute.jsx` - Route protection wrapper
- `GlassCard.jsx` - Glassmorphism card component
- `Hero3DScene.jsx` - 3D hero visualization
- `HeroSection.jsx` - Landing page hero
- `FeaturesSection.jsx` - Features display
- `HowItWorksSection.jsx` - Process explanation
- `CTASection.jsx` - Call-to-action section

#### Dashboard Components (subdirectory)
- `StatsCards.jsx` - Compliance & risk statistics (uses mockCompliance)
- `ComplianceCharts.jsx` - Pie, bar, line charts (uses mockCompliance)
- `RegulationTracker.jsx` - Regulation status tracking (uses mockRegulations)
- `AssetListView.jsx` - List of infrastructure assets (uses mockAssets)
- `AssetDetailPanel.jsx` - Asset detail view (uses mockAssets)
- `AssetNode.jsx` - Single asset node on map (uses mockAssets)
- `InfrastructureMap.jsx` - Network topology visualization (uses mockAssets)
- `AIInsightBar.jsx` - AI-powered insights display
- `DashboardHeader.jsx` - Dashboard page header
- `StatusIcon.jsx` - Status indicator icon
- `AssetTooltip.jsx` - Asset hover tooltip
- `CountryIcon.jsx` - Country flag icon
- `DepartmentIcon.jsx` - Department icon

#### Compliance Components (subdirectory)
- `WelcomeScreen.jsx` - Assessment intro screen
- `StepForm.jsx` - Multi-step form (company profile)
- `FrameworkSelector.jsx` - Framework selection UI
- `ChatBox.jsx` - Chat interface
- `MessageBubble.jsx` - Message display
- `ProgressPanel.jsx` - Progress tracking
- `SummaryCard.jsx` - Summary display

#### Chat Components (subdirectory)
- `ChatEngine.jsx` - Chat orchestration
- `ChatMessage.jsx` - Individual message component
- `MessageBubble.jsx` - Message bubble styling
- `OptionButtons.jsx` - Quick action buttons
- `ProgressBar.jsx` - Progress indicator
- `TypingIndicator.jsx` - Typing indicator animation

#### UI Components (subdirectory)
- Various re-usable UI primitives

---

### 2.3 Hooks

**Location:** `frontend/src/hooks/`

| Hook | File | Purpose |
|------|------|---------|
| `useAuth` | `useAuth.js` | Auth context access & methods |
| `useWebSocket` | `useWebSocket.js` | WebSocket connection management |
| `useFrameworks` | `useFrameworks.js` | Frameworks CRUD operations |

#### useWebSocket Details
- Auto-connect/disconnect
- Reconnection with exponential backoff (max 5 attempts)
- Message type handling (connected, history, message, typing, error, pong)
- Token-based authentication
- Callbacks: `onMessage`, `onTyping`, `onConnected`, `onError`

---

### 2.4 API Services

**Location:** `frontend/src/api/`

| Service | File | Endpoints |
|---------|------|-----------|
| **Auth** | `auth.js` | login, logout, register, refresh, me |
| **Client** | `client.js` | Axios instance, token management, interceptors |
| **Dashboard** | `dashboard.js` | getDashboardOverview, getComplianceDashboard, getAssetsDashboard, getRisksDashboard |
| **Assessments** | `assessments.js` | CRUD + session management + answer submission |
| **Frameworks** | `frameworks.js` | List, create, assign frameworks |
| **Assets** | `assets.js` | Asset CRUD (if implemented) |
| **RAG** | `rag.js` | queryRag, searchRag, getRagHealth |

#### Token Management (client.js)
```javascript
// Axios interceptors for:
// 1. Automatic token injection in requests
// 2. 401 handling with token refresh
// 3. Exponential backoff for refresh failures
// Stores: accessToken (memory), refreshToken (sessionStorage)
```

---

### 2.5 State Management

**Location:** `frontend/src/context/`

#### Context Providers

**AuthContext.jsx**
- `user` - Current authenticated user
- `isAuthenticated` - Auth state
- `isLoading` - Loading indicator
- Methods: `checkAuth()`, `login()`, `logout()`, `signup()`

**DashboardContext.jsx**
- `dashboardData` - Current dashboard stats
- `userRole` - User's role
- `userPermissions` - Permissions list
- `assets` - Infrastructure assets
- `isLoading` - Data loading state
- `error` - Error messages
- Methods: `fetchDashboardData()`, `refreshData()`

#### Store Structure
- Context-based (no Redux/Zustand)
- Centralized API calls in context providers
- Memoized context values to prevent re-renders

---

### 2.6 Mock/Test Data

**Location:** `frontend/src/data/` **⚠️ NEEDS REMOVAL**

| File | Exports | Usage | Status |
|------|---------|-------|--------|
| `mockAssets.js` | ASSET_TYPES, STATUS, assets (24 items), connections | Dashboard maps, asset lists | **ACTIVE - TO REMOVE** |
| `mockCompliance.js` | summaryStats, compliancePieData, departmentCompliance, frameworkScores, riskTrend | Stats cards, charts | **ACTIVE - TO REMOVE** |
| `mockRegulations.js` | regulations (Egypt, Saudi, EU, UAE) | Regulation tracker | **ACTIVE - TO REMOVE** |
| `chatFlowData.js` | STEPS, STEP_META, questions | Assessment wizard | **PARTIALLY USED** |

#### Components Using Mock Data
1. `StatsCards.jsx` - imports `summaryStats, frameworkScores`
2. `ComplianceCharts.jsx` - imports `compliancePieData, departmentCompliance, riskTrend`
3. `RegulationTracker.jsx` - imports `regulations`
4. `AssetListView.jsx` - imports `assets, ASSET_TYPE_META, STATUS_META`
5. `InfrastructureMap.jsx` - imports `ASSET_TYPE_META`
6. `AssetNode.jsx` - imports `ASSET_TYPE_META, STATUS_META`
7. `AssetDetailPanel.jsx` - imports `ASSET_TYPE_META, STATUS_META`

---

### 2.7 Authentication Flow

```
1. User visits /auth → AuthPage
2. Login/Signup form → API call
3. Response: { access_token, refresh_token, user }
4. AuthContext stores tokens & user
5. Protected routes check AuthContext.isAuthenticated
6. All API requests include Authorization header
7. 401 response → Auto refresh token
8. Invalid refresh → Redirect to /auth
```

---

## 3. INTEGRATION POINTS

### 3.1 API Call Mappings (Frontend → Backend)

| Frontend Call | Backend Endpoint | Status | Issues |
|---------------|------------------|--------|--------|
| `auth.login()` | `POST /auth/login` | ✅ | Flat response structure (no wrapper) |
| `auth.me()` | `GET /auth/me` | ✅ | GenericResponse wrapper |
| `getDashboardOverview()` | `GET /dashboard/overview` | ✅ | Role-based filtering |
| `getComplianceDashboard()` | `GET /dashboard/compliance` | ✅ | Returns mock data on frontend |
| `getAssetsDashboard()` | `GET /dashboard/assets` | ⚠️ | Frontend still uses mockAssets.js |
| `getRisksDashboard()` | `GET /dashboard/risks` | ⚠️ | No frontend implementation |
| `listAssessments()` | `GET /assessments/` | ✅ | Works end-to-end |
| `createAssessment()` | `POST /assessments/` | ✅ | Framework selection required |
| `startAssessmentSession()` | `POST /assessments/{id}/sessions/start` | ✅ | Returns session_id |
| `getAssessmentSession()` | `GET /assessments/sessions/{session_id}` | ✅ | Used for history retrieval |
| `saveAssessmentAnswer()` | `POST /assessments/answers` | ✅ | Supports compliance scoring |
| `queryRag()` | `POST /rag/query` | ✅ | Integrated in WebSocket handler |
| `searchRag()` | `POST /rag/search` | ⚠️ | Not used in main flow |
| `listFrameworks()` | `GET /frameworks/` | ✅ | Public endpoint |
| `getMyPermissions()` | `GET /permissions/me` | ✅ | Returns role + custom perms |

---

### 3.2 WebSocket Connections

**Connection:** `ws://localhost:8001/ws/assessments/{sessionId}/chat?token={accessToken}`

#### Message Flow

**Client → Server (Types):**
- `message` - User message with content
- `ping` - Heartbeat probe

**Server → Client (Types):**
- `connected` - Connection established
- `history` - Chat message history
- `message` - Single AI/user message
- `typing` - Typing indicator toggle
- `error` - Error notification
- `pong` - Heartbeat response

#### Implementation Location
- **Hook:** `frontend/src/hooks/useWebSocket.js`
- **Component:** `AIComplianceChat.jsx` → `ChatBox.jsx`
- **Backend Router:** `backend/app/websocket/router.py`
- **Manager:** `backend/app/websocket/manager.py`

---

### 3.3 Broken/Partial Connections

| Feature | Status | Issue |
|---------|--------|-------|
| **Dashboard Stats** | 🔴 Broken | Frontend loads mockAssets instead of API data |
| **Asset List** | 🔴 Broken | mockAssets.js hardcoded, API not integrated |
| **Infrastructure Map** | 🔴 Broken | mockAssets.js grid positions hardcoded |
| **Compliance Charts** | 🟡 Partial | Uses mockCompliance; no real framework scores |
| **Regulation Tracker** | 🔴 Broken | mockRegulations.js hardcoded; no API endpoint |
| **Risk Dashboard** | 🟡 Partial | Endpoint exists but frontend not consuming |
| **RAG Health Check** | ⚠️ Unused | Endpoint exists but no frontend call |
| **Asset Extraction** | 🟡 Partial | Service exists but not triggered in chat |
| **Position-based Questions** | 🟡 Partial | Backend supports but frontend not integrated |

---

### 3.4 Hardcoded Test Data & Mocks

**Frontend:**
1. **assets (24 items)** in `mockAssets.js`
   - Firewall: fw-01, fw-02, fw-03
   - Servers: srv-01 to srv-06
   - Workstations: ws-01 to ws-07
   - Routers: rt-01 to rt-04
   - Cloud: cld-01 to cld-04
   - Grid positions (X, Y percentages)
   - Network connections array

2. **compliance stats** in `mockCompliance.js`
   - Overall compliance: 71-82%
   - Risk averages: 32-42%
   - Department scores: 62-87%
   - Framework scores: GDPR(91%), NIST(74%), ISO(82%), SOC2(78%)

3. **regulations** in `mockRegulations.js`
   - Egypt (PDPL): 68% compliant
   - Saudi (NCA): 76% compliant
   - EU (GDPR): 91% compliant
   - UAE (PDPL): 82% compliant

4. **chat flow data** in `chatFlowData.js`
   - Assessment workflow steps
   - Questions & options
   - Step metadata

---

## 4. PROBLEMS TO FIX

### 4.1 Dummy Data & Mock Data (High Priority)

| Location | Type | Action |
|----------|------|--------|
| `frontend/src/data/mockAssets.js` | Hardcoded assets | **DELETE & replace with API** |
| `frontend/src/data/mockCompliance.js` | Hardcoded stats | **DELETE & replace with API** |
| `frontend/src/data/mockRegulations.js` | Hardcoded regulations | **DELETE & create API endpoint** |
| `frontend/src/data/chatFlowData.js` | Assessment questions | **PARTIALLY KEEP** - only structure, not content |

**Files to Remove:**
- [frontend/src/data/mockAssets.js](frontend/src/data/mockAssets.js)
- [frontend/src/data/mockCompliance.js](frontend/src/data/mockCompliance.js)
- [frontend/src/data/mockRegulations.js](frontend/src/data/mockRegulations.js)

---

### 4.2 Commented-Out Code

**Locations Found:** (Mostly inline comments, no large blocks commented out)

1. [backend/app/ai/llm/ollama_service.py](backend/app/ai/llm/ollama_service.py) - Inline comments only
2. [backend/app/websocket/router.py](backend/app/websocket/router.py) - Inline comments describing logic
3. [frontend/src/main.jsx](frontend/src/main.jsx) - Comments about Lenis scroll init
4. [frontend/src/components/ErrorBoundary.jsx](frontend/src/components/ErrorBoundary.jsx) - Comments about error logging

**Action:** Review and remove unnecessary explanatory comments in production code.

---

### 4.3 Unused Components/Services

**Potentially Unused:**

1. **`getRagHealth()` endpoint**
   - Defined in [backend/app/ai/rag/router.py](backend/app/ai/rag/router.py)
   - Never called from frontend

2. **`searchRag()` method**
   - Defined in [frontend/src/api/rag.js](frontend/src/api/rag.js)
   - Endpoint exists but not used in main chat flow

3. **`getRisksDashboard()` method**
   - Defined in [frontend/src/api/dashboard.js](frontend/src/api/dashboard.js)
   - Endpoint exists but component never calls it

4. **`assets.js` API service**
   - File exists: [frontend/src/api/assets.js](frontend/src/api/assets.js)
   - Likely incomplete; mockAssets used instead

5. **`risks.py` router**
   - Location: [backend/app/risks/](backend/app/risks/)
   - Mostly empty; no router implementation found

6. **`Assessment Risk Scoring`**
   - Defined in models but never implemented in endpoints

---

### 4.4 API Mismatches

#### Response Format Inconsistencies

**Issue 1: Login Response Format**
```javascript
// Frontend expects (flat):
{ access_token, refresh_token, user }

// Backend returns (flat):
{ access_token, refresh_token, user }
✅ MATCHES
```

**Issue 2: /me Endpoint Response**
```javascript
// Frontend expects (wrapped):
{ success, data: { user } }

// Backend returns (wrapped):
{ success, message, data: { user } }
✅ MATCHES
```

**Issue 3: Dashboard Overview**
```javascript
// Frontend expects:
{ success, data: { compliance, assets, risks } }

// Backend returns (may differ):
{ success, message, data: {...} }
⚠️ CHECK ALIGNMENT
```

#### Parameter Mismatches

1. **RAG Query Parameters**
   ```python
   # Frontend sends:
   { question, framework (optional), top_k }
   
   # Backend expects:
   { question, framework (optional), top_k }
   ✅ MATCHES
   ```

2. **Assessment Answer Save**
   ```python
   # Frontend sends:
   { session_id, question_id, position_id, answer_text, evidence_urls }
   
   # Backend expects:
   { session_id, question_id, position_id, answer_text, evidence_urls }
   ✅ MATCHES
   ```

---

### 4.5 Permission-Related Code Gaps

**Implemented:**
- Role-based permissions (SUPER_ADMIN, ORG_ADMIN, ORG_MEMBER)
- Permission enum: VIEW_DASHBOARD, GRANT_PERMISSIONS, VIEW_MEMBERS, etc.
- Custom user permissions table (`UserRolePermission`)
- Permission checking middleware

**Gaps:**
1. **Permission UI Missing**
   - [frontend/src/pages/PermissionsPage.jsx](frontend/src/pages/PermissionsPage.jsx) exists but not implemented
   - No UI for granting/revoking permissions

2. **Permission Seeding**
   - [backend/seed_permissions.py](backend/seed_permissions.py) exists
   - But unclear if default permissions are created on first run

3. **Org Admin Dashboard**
   - No admin interface for managing user permissions
   - Endpoint `/permissions/grant` and `/permissions/revoke` exist but no UI

---

### 4.6 RAG Integration Gaps

**Implemented:**
- Full RAG pipeline (query → embedding → search → context → generation)
- Qdrant vector database integration
- Ollama LLM integration
- Position-based context retrieval
- RAG API endpoints

**Gaps:**
1. **Document Ingestion**
   - Script [backend/populate_doc_chunks.py](backend/populate_doc_chunks.py) exists
   - But ingestion pipeline not fully documented

2. **Asset Extraction in Chat**
   - [backend/app/assets/service.py](backend/app/assets/service.py) has `extract_assets_from_message()`
   - But NOT called from WebSocket handler
   - Assets extracted but never stored/displayed

3. **RAG Health Endpoint**
   - Exists but frontend never calls it
   - No error handling for Qdrant/Ollama outages

4. **Streaming Responses**
   - No streaming support in current implementation
   - Full response returned at once (can be slow for long answers)

---

### 4.7 Infrastructure Map Gaps

**Current Issues:**
1. **Hardcoded Grid Positions**
   - All asset positions are hardcoded percentages in mockAssets
   - No dynamic layout algorithm

2. **No Live Data**
   - Map displays mockAssets.js
   - API provides real assets but frontend doesn't consume

3. **No Asset Extraction**
   - Chat extracts infrastructure assets
   - But map never updates with new assets

4. **Missing Endpoints**
   - No `/assets/` endpoint to list real infrastructure assets
   - No `/assets/{id}` endpoint for details

5. **Vulnerability Display**
   - mockAssets includes CVE vulnerabilities
   - No vulnerabilities displayed in UI

---

### 4.8 Unused Imports & Code

**Frontend:**

1. [frontend/src/components/dashboard/InfrastructureMap.jsx](frontend/src/components/dashboard/InfrastructureMap.jsx)
   ```javascript
   import { ASSET_TYPE_META } from '../../data/mockAssets' // Only uses ASSET_TYPE_META
   // But also could import from API
   ```

2. [frontend/src/components/LoadingScreen.jsx](frontend/src/components/LoadingScreen.jsx)
   ```javascript
   // Progress animation logic but not used in actual loading states
   ```

**Backend:**

1. [backend/app/risks/](backend/app/risks/)
   - Router placeholder exists but not hooked into main API

2. [backend/app/core/](backend/app/core/)
   - Config and logging present but could be optimized

---

### 4.9 Code Quality Issues

#### Console.log Statements
- [frontend/src/hooks/useWebSocket.js](frontend/src/hooks/useWebSocket.js) - Multiple console.log for debugging
- [frontend/src/pages/AIComplianceChat.jsx](frontend/src/pages/AIComplianceChat.jsx) - Debug logs in state handlers

#### Commented Debug Code
- [frontend/src/main.jsx](frontend/src/main.jsx) - Lenis scroll implementation comments
- Various files with "TODO" inline comments

#### Error Handling Gaps
1. **WebSocket Errors**
   - Reconnection works but max attempts = 5
   - No user notification after max attempts

2. **RAG Failures**
   - Fallback response exists but generic
   - No specific error messages for Qdrant/Ollama down

3. **API Errors**
   - Limited error detail in responses
   - No error logging to backend from frontend

---

### 4.10 Incomplete Features

| Feature | Status | Issue |
|---------|--------|-------|
| **Assessment Scoring** | 🟡 Partial | Backend calculates compliance_score but frontend never displays |
| **Question Generation** | 🟡 Partial | QuestionGenerator exists but not fully integrated |
| **Position-based Questions** | 🟡 Partial | Backend supports filtering by position but frontend doesn't use |
| **Compliance Scoring** | 🔴 Missing | No endpoint to calculate framework compliance % |
| **Risk Scoring** | 🔴 Missing | Risk model exists but no risk calculation endpoint |
| **Department View** | 🔴 Missing | Dept data collected but no department-level dashboard |
| **Audit Logging** | 🔴 Missing | No audit trail for permission changes, assessments |
| **Export/Report** | 🔴 Missing | No PDF/Excel export of assessments or compliance scores |

---

### 4.11 Missing API Endpoints

**Needed but Not Found:**

1. **Assets Management**
   - `GET /assets/` - List all assets
   - `GET /assets/{id}` - Get asset details
   - `POST /assets/` - Create asset (if not from chat)
   - `PUT /assets/{id}` - Update asset
   - `DELETE /assets/{id}` - Delete asset

2. **Regulations/Requirements**
   - `GET /regulations/` - List regulations (currently mocked)
   - `GET /frameworks/{id}/requirements` - Framework requirements

3. **Compliance Scoring**
   - `GET /assessments/{id}/score` - Calculate compliance score
   - `GET /frameworks/{id}/compliance-score` - Framework compliance %

4. **Risk Management**
   - `GET /risks/` - List risks
   - `POST /risks/` - Create risk
   - `PUT /risks/{id}` - Update risk

5. **Audit Logs**
   - `GET /audit/logs` - Audit trail (permissions, assessments, etc.)

---

### 4.12 Database/Schema Issues

**Observations:**

1. **Risks Table**
   - Model exists: [backend/app/models/assets_risks.py](backend/app/models/assets_risks.py)
   - But no migration or router found
   - Likely not fully integrated

2. **Infrastructure Asset Extraction**
   - Model exists: `InfrastructureAsset`
   - Service extracts but never stores (no database save)
   - Assets from chat never persisted

3. **Assessment Answer Scoring**
   - `compliance_score` column exists
   - But no backend logic to calculate it
   - Always NULL

---

## 5. SUMMARY TABLE

### High-Priority Fixes

| Issue | Category | Severity | Files |
|-------|----------|----------|-------|
| Remove mockAssets.js | Dummy Data | 🔴 CRITICAL | [frontend/src/data/mockAssets.js](frontend/src/data/mockAssets.js) |
| Remove mockCompliance.js | Dummy Data | 🔴 CRITICAL | [frontend/src/data/mockCompliance.js](frontend/src/data/mockCompliance.js) |
| Remove mockRegulations.js | Dummy Data | 🔴 CRITICAL | [frontend/src/data/mockRegulations.js](frontend/src/data/mockRegulations.js) |
| Replace hardcoded assets with API | Integration | 🔴 CRITICAL | Dashboard components (7 files) |
| Implement asset extraction to DB | RAG Gap | 🟡 HIGH | [backend/app/assets/service.py](backend/app/assets/service.py), websocket router |
| Create /assets/ API endpoint | Missing Endpoint | 🟡 HIGH | Backend |
| Create regulations API endpoint | Missing Endpoint | 🟡 HIGH | Backend |
| Implement PermissionsPage UI | Permission Gap | 🟡 HIGH | [frontend/src/pages/PermissionsPage.jsx](frontend/src/pages/PermissionsPage.jsx) |
| Fix asset extraction in chat | RAG Gap | 🟡 HIGH | [backend/app/websocket/router.py](backend/app/websocket/router.py) |
| Add compliance scoring endpoint | Missing Endpoint | 🟡 HIGH | Backend |

---

## 6. FILE STRUCTURE QUICK REFERENCE

```
backend/
├── app/
│   ├── ai/              # RAG, LLM, embeddings
│   ├── api/v1/          # REST endpoints
│   ├── auth/            # Authentication & permissions
│   ├── assessments/      # Assessment logic
│   ├── assets/          # Asset extraction
│   ├── dashboard/       # Dashboard data
│   ├── database/        # ORM, sessions
│   ├── models/          # SQLAlchemy models
│   ├── organizations/   # Org management
│   ├── risks/           # Risk models
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic
│   └── websocket/       # Real-time chat
├── alembic/             # Database migrations
└── requirements/        # Dependencies

frontend/
├── src/
│   ├── api/             # API service layer
│   ├── components/      # React components
│   ├── context/         # State management
│   ├── data/            # Mock data (TO REMOVE)
│   ├── hooks/           # Custom hooks
│   ├── pages/           # Page components
│   └── utils/           # Utilities
└── public/              # Static assets
```

---

**End of Analysis Report**
