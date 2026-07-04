# Amenly Backend - API Endpoint Test Results

**Date:** 2026-05-10  
**Server:** http://127.0.0.1:8001  
**Total Endpoints Tested:** 44  
**Success Rate:** 100% (44/44)

---

## Test Summary

All API endpoints are responding correctly with expected HTTP status codes.

---

## Endpoints Tested

### Public Endpoints (No Authentication)

| Method | Endpoint | Status | Expected | Result |
|--------|----------|--------|----------|--------|
| GET | `/` | 200 | 200 | ✅ |
| GET | `/health` | 200 | 200 | ✅ |
| GET | `/api/v1/rag/health` | 200 | 200 | ✅ |

### Authentication Endpoints

| Method | Endpoint | Status | Expected | Result |
|--------|----------|--------|----------|--------|
| POST | `/api/v1/auth/register` (empty) | 422 | 422 | ✅ |
| POST | `/api/v1/auth/register` (invalid) | 422 | 422 | ✅ |
| POST | `/api/v1/auth/login` (empty) | 422 | 422 | ✅ |
| POST | `/api/v1/auth/login` (invalid) | 401 | 401 | ✅ |
| POST | `/api/v1/auth/refresh` (empty) | 422 | 422 | ✅ |
| GET | `/api/v1/auth/me` (no token) | 403 | 403 | ✅ |
| POST | `/api/v1/auth/logout` (no token) | 403 | 403 | ✅ |

### Users Endpoints (Protected)

| Method | Endpoint | Status | Expected | Result |
|--------|----------|--------|----------|--------|
| GET | `/api/v1/users/` | 403 | 403 | ✅ |
| GET | `/api/v1/users/{id}` | 403 | 403 | ✅ |
| PATCH | `/api/v1/users/{id}` | 403 | 403 | ✅ |
| DELETE | `/api/v1/users/{id}` | 403 | 403 | ✅ |

### Frameworks Endpoints (Protected)

| Method | Endpoint | Status | Expected | Result |
|--------|----------|--------|----------|--------|
| GET | `/api/v1/frameworks/` | 403 | 403 | ✅ |
| POST | `/api/v1/frameworks/` | 403 | 403 | ✅ |
| GET | `/api/v1/frameworks/stats` | 403 | 403 | ✅ |
| GET | `/api/v1/frameworks/types` | 403 | 403 | ✅ |
| GET | `/api/v1/frameworks/categories` | 403 | 403 | ✅ |
| GET | `/api/v1/frameworks/regions` | 403 | 403 | ✅ |
| GET | `/api/v1/frameworks/{id}` | 403 | 403 | ✅ |
| PATCH | `/api/v1/frameworks/{id}` | 403 | 403 | ✅ |
| DELETE | `/api/v1/frameworks/{id}` | 403 | 403 | ✅ |
| POST | `/api/v1/frameworks/associate` | 403 | 403 | ✅ |
| GET | `/api/v1/frameworks/available/all` | 403 | 403 | ✅ |
| DELETE | `/api/v1/frameworks/dissociate/{id}` | 403 | 403 | ✅ |

### Permissions Endpoints (Protected)

| Method | Endpoint | Status | Expected | Result |
|--------|----------|--------|----------|--------|
| GET | `/api/v1/permissions/me` | 403 | 403 | ✅ |
| GET | `/api/v1/permissions/catalog` | 403 | 403 | ✅ |
| GET | `/api/v1/permissions/roles` | 403 | 403 | ✅ |
| GET | `/api/v1/permissions/user/{id}` | 403 | 403 | ✅ |
| POST | `/api/v1/permissions/grant` | 403 | 403 | ✅ |
| POST | `/api/v1/permissions/revoke` | 403 | 403 | ✅ |
| DELETE | `/api/v1/permissions/user/{id}/all` | 403 | 403 | ✅ |
| GET | `/api/v1/permissions/check/{perm}` | 403 | 403 | ✅ |

### Organizations Endpoints (Protected)

| Method | Endpoint | Status | Expected | Result |
|--------|----------|--------|----------|--------|
| GET | `/api/v1/orgs/me` | 403 | 403 | ✅ |
| PATCH | `/api/v1/orgs/me` | 403 | 403 | ✅ |
| GET | `/api/v1/orgs/departments` | 403 | 403 | ✅ |
| POST | `/api/v1/orgs/departments` | 403 | 403 | ✅ |
| POST | `/api/v1/orgs/positions` | 403 | 403 | ✅ |
| GET | `/api/v1/orgs/departments/{id}/positions` | 403 | 403 | ✅ |
| DELETE | `/api/v1/orgs/departments/{id}` | 403 | 403 | ✅ |
| DELETE | `/api/v1/orgs/positions/{id}` | 403 | 403 | ✅ |

### RAG Endpoints

| Method | Endpoint | Status | Expected | Result |
|--------|----------|--------|----------|--------|
| POST | `/api/v1/rag/query` (no token) | 403 | 403 | ✅ |
| POST | `/api/v1/rag/search` (no token) | 403 | 403 | ✅ |
| GET | `/api/v1/rag/health` | 200 | 200 | ✅ |

---

## Test Scripts Created

1. **`api_tester_curl.sh`** - Basic endpoint reachability test (42 endpoints)
2. **`api_tester_full_curl.sh`** - Comprehensive test with data validation (44 endpoints)

## How to Run Tests

```bash
# Basic test
./api_tester_curl.sh

# Full test with data validation
./api_tester_full_curl.sh
```

## Notes

- Tests were conducted without authentication tokens
- Protected endpoints correctly return 403/401 for unauthenticated requests
- Validation endpoints correctly return 422 for invalid/missing data
- Public endpoints (health checks) correctly return 200
- All endpoints are reachable and responding as expected
