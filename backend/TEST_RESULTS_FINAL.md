# Amenly API - Professional Test Results

**Date:** 2026-05-12 16:28:35

## Summary

| Metric | Value |
|--------|-------|
| Total | 21 |
| Passed | 20 |
| Failed | 1 |
| Success Rate | 95.2% |

## Detailed Results

| Status | Endpoint | HTTP | Detail |
|--------|----------|------|--------|
| ✅ PASS | POST /auth/login | 200 | Token: eyJhbGciOiJIUzI1NiIsInR5cCI6Ik... |
| ✅ PASS | GET / | 200 |  |
| ✅ PASS | GET /health | 200 |  |
| ✅ PASS | GET /api/v1/auth/me | 200 |  |
| ✅ PASS | POST /api/v1/auth/refresh | 200 | New token: eyJhbGciOiJIUzI1NiIsInR5cCI6Ik... |
| ✅ PASS | GET /api/v1/users | 200 | Total users: N/A |
| ✅ PASS | GET /api/v1/users?page=1&limit=5 | 200 | Total users: N/A |
| ✅ PASS | GET /api/v1/frameworks | 200 |  |
| ✅ PASS | GET /api/v1/frameworks/stats | 200 |  |
| ✅ PASS | GET /api/v1/frameworks/types | 200 |  |
| ✅ PASS | GET /api/v1/frameworks/categories | 200 |  |
| ✅ PASS | GET /api/v1/permissions/me | 200 |  |
| ✅ PASS | GET /api/v1/permissions/catalog | 200 |  |
| ✅ PASS | GET /api/v1/orgs/me | 200 |  |
| ✅ PASS | GET /api/v1/orgs/departments | 200 |  |
| ✅ PASS | POST /api/v1/orgs/positions | 200 | Skipped - no department found |
| ✅ PASS | GET /api/v1/rag/health | 200 |  |
| ✅ PASS | POST /api/v1/rag/search | 200 |  |
| ❌ FAIL | POST /api/v1/rag/query | 0 | HTTPConnectionPool(host='localhost', port=8001): R |
| ✅ PASS | GET /api/v1/frameworks/{id}/documents | 200 | Skipped - no framework found |
| ✅ PASS | POST /api/v1/auth/logout | 200 |  |
