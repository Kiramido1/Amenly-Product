# Amenly Backend - Full Authenticated API Test Results

**Date:** 2026-05-10  
**Server:** http://127.0.0.1:8001  
**Test Script:** `test_all_authenticated_fixed.sh`  
**Total Endpoints Tested:** 40+  
**Success Rate:** 100% (0 failures)

---

## Authentication

- **Method:** Admin login (admin@first.com)
- **Token:** JWT acquired and refreshed successfully
- **Logout/Re-auth:** Token revocation and re-login verified

---

## Test Results by Category

### ✅ Public Endpoints (3 tests)

| Method | Endpoint | Status | Result |
|--------|----------|--------|--------|
| GET | `/` | 200 | ✅ Welcome message |
| GET | `/health` | 200 | ✅ Healthy |
| GET | `/api/v1/openapi.json` | 200 | ✅ Swagger schema |

### ✅ Auth Endpoints (4 tests)

| Method | Endpoint | Status | Result |
|--------|----------|--------|--------|
| GET | `/api/v1/auth/me` | 200 | ✅ Current user retrieved |
| POST | `/api/v1/auth/refresh` | 200 | ✅ Token refreshed |
| POST | `/api/v1/auth/logout` | 200 | ✅ Logged out |
| GET | `/api/v1/auth/me` (after logout) | 401 | ✅ Token revoked |

### ✅ Users Endpoints (4 tests)

| Method | Endpoint | Status | Result |
|--------|----------|--------|--------|
| GET | `/api/v1/users/` | 200 | ✅ Users list |
| GET | `/api/v1/users/?skip=0&limit=5` | 200 | ✅ Paginated users |
| GET | `/api/v1/users/{id}` | 200 | ✅ Single user |
| PATCH | `/api/v1/users/{id}` | 200 | ✅ User updated |

### ✅ Frameworks Endpoints (11 tests)

| Method | Endpoint | Status | Result |
|--------|----------|--------|--------|
| GET | `/api/v1/frameworks/` | 200 | ✅ Frameworks list |
| GET | `/api/v1/frameworks/?skip=0&limit=5` | 200 | ✅ Paginated frameworks |
| GET | `/api/v1/frameworks/stats` | 200 | ✅ Framework stats |
| GET | `/api/v1/frameworks/types` | 200 | ✅ Framework types |
| GET | `/api/v1/frameworks/categories` | 200 | ✅ Framework categories |
| GET | `/api/v1/frameworks/regions` | 200 | ✅ Framework regions |
| GET | `/api/v1/frameworks/available/all` | 200 | ✅ Available frameworks (22) |
| GET | `/api/v1/frameworks/{id}` | 200 | ✅ Framework details |
| PATCH | `/api/v1/frameworks/{id}` | 200 | ✅ Framework updated |
| POST | `/api/v1/frameworks/associate` | 200 | ✅ Frameworks associated |
| DELETE | `/api/v1/frameworks/dissociate/{id}` | 200 | ✅ Framework dissociated |

### ✅ Permissions Endpoints (7 tests)

| Method | Endpoint | Status | Result |
|--------|----------|--------|--------|
| GET | `/api/v1/permissions/me` | 200 | ✅ My permissions retrieved |
| GET | `/api/v1/permissions/catalog` | 200 | ✅ Catalog retrieved |
| GET | `/api/v1/permissions/roles` | 200 | ✅ Role permissions |
| GET | `/api/v1/permissions/check/view_members` | 200 | ✅ Permission check |
| GET | `/api/v1/permissions/user/{id}` | 200 | ✅ User permissions |
| POST | `/api/v1/permissions/grant` | 200 | ✅ Permission granted |
| POST | `/api/v1/permissions/revoke` | 200 | ✅ Permission revoked |
| DELETE | `/api/v1/permissions/user/{id}/all` | 200 | ✅ All permissions revoked |

### ✅ Organizations Endpoints (6 tests)

| Method | Endpoint | Status | Result |
|--------|----------|--------|--------|
| GET | `/api/v1/orgs/me` | 200 | ✅ Organization retrieved |
| PATCH | `/api/v1/orgs/me` | 200 | ✅ Organization updated |
| GET | `/api/v1/orgs/departments` | 200 | ✅ Departments list |
| POST | `/api/v1/orgs/departments` | 200 | ✅ Department created |
| POST | `/api/v1/orgs/positions` | 200 | ✅ Position created |
| GET | `/api/v1/orgs/departments/{id}/positions` | 200 | ✅ Positions list |

### ✅ RAG Endpoints (3 tests)

| Method | Endpoint | Status | Result |
|--------|----------|--------|--------|
| GET | `/api/v1/rag/health` | 200 | ✅ RAG healthy |
| POST | `/api/v1/rag/query` | 200 | ✅ Query processed |
| POST | `/api/v1/rag/search` | 200 | ✅ Search completed |

**RAG System Status:**
- Ollama: Available (qwen2.5:7b, nomic-embed-text)
- Qdrant: Connected (compliance_frameworks collection)

### ✅ Token Revocation Tests (2 tests)

| Test | Status | Result |
|------|--------|--------|
| Logout | 200 | ✅ Token revoked |
| Re-authentication | 200 | ✅ New token works |

---

## Test Scripts

| Script | Purpose |
|--------|---------|
| `test_all_endpoints.sh` | Basic curl tests (no auth) |
| `test_rag_endpoints.sh` | RAG section tests |
| `test_all_authenticated_fixed.sh` | **Full auth test suite** |

## Run the Test

```bash
cd /media/alpha/36A212E9A212ACFD1/HITU/Forth year/SM_2/grad-project/Amenly_Grad_project/backend
./test_all_authenticated_fixed.sh
```

## Notes

- All endpoints responded with correct HTTP status codes
- Authentication flow (login → refresh → logout → re-login) works correctly
- Token revocation is properly enforced
- RAG system is fully operational with Ollama and Qdrant
