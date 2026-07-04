#!/bin/bash
# Professional API Endpoint Test Suite
# Tests all endpoints with authentication

BASE_URL="http://localhost:8001"
TOKEN=""
REFRESH_TOKEN=""
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

pass() { echo -e "${GREEN}✓ PASS${NC} $1"; ((PASSED++)); }
fail() { echo -e "${RED}✗ FAIL${NC} $1 (HTTP $2)"; ((FAILED++)); }
info() { echo -e "${YELLOW}▶${NC} $1"; }

# Test helper
test_endpoint() {
    local method=$1
    local path=$2
    local expected=$3
    local payload=$4
    local auth=$5
    local desc="$method $path"

    local opts="-s -w \"\nHTTP_CODE:%{http_code}\""
    
    if [ -n "$auth" ] && [ -n "$TOKEN" ]; then
        opts="$opts -H \"Authorization: Bearer $TOKEN\""
    fi
    
    if [ -n "$payload" ]; then
        opts="$opts -H \"Content-Type: application/json\" -d '$payload'"
    fi

    local response=$(eval "curl $opts $BASE_URL$path 2>/dev/null")
    local http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    local body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*//')

    if [ "$http_code" -eq "$expected" ]; then
        pass "$desc"
        echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
    else
        fail "$desc" "$http_code"
        echo "$body" | head -1
    fi
}

echo "============================================"
echo "  Amenly API - Professional Test Suite"
echo "============================================"
echo ""

# 1. Health Check
info "1. HEALTH & PUBLIC ENDPOINTS"
test_endpoint "GET" "/" 200
test_endpoint "GET" "/health" 200

# 2. Auth - Login
info "2. AUTHENTICATION"
LOGIN_RESP=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@first.com","password":"AdminPassword123!"}')
TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['access_token'])" 2>/dev/null)
REFRESH_TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['refresh_token'])" 2>/dev/null)

if [ -n "$TOKEN" ]; then
    pass "POST /auth/login (got token)"
else
    fail "POST /auth/login" "-"
    exit 1
fi

# 3. Auth endpoints
test_endpoint "GET" "/api/v1/auth/me" 200 "" "auth"
test_endpoint "POST" "/api/v1/auth/refresh" 200 "{\"refresh_token\":\"$REFRESH_TOKEN\"}" ""

# 4. Users
echo ""
info "3. USERS"
test_endpoint "GET" "/api/v1/users" 200 "" "auth"
test_endpoint "GET" "/api/v1/users?page=1&limit=5" 200 "" "auth"

# 5. Frameworks
echo ""
info "4. FRAMEWORKS"
test_endpoint "GET" "/api/v1/frameworks" 200 "" "auth"
test_endpoint "GET" "/api/v1/frameworks/stats" 200 "" "auth"
test_endpoint "GET" "/api/v1/frameworks/types" 200 "" "auth"

# 6. Permissions
echo ""
info "5. PERMISSIONS"
test_endpoint "GET" "/api/v1/permissions/me" 200 "" "auth"
test_endpoint "GET" "/api/v1/permissions/catalog" 200 "" "auth"

# 7. Organizations
echo ""
info "6. ORGANIZATIONS"
test_endpoint "GET" "/api/v1/orgs/me" 200 "" "auth"
test_endpoint "GET" "/api/v1/orgs/departments" 200 "" "auth"
test_endpoint "GET" "/api/v1/orgs/positions" 200 "" "auth"

# 8. RAG
echo ""
info "7. RAG SYSTEM"
test_endpoint "GET" "/api/v1/rag/health" 200
test_endpoint "POST" "/api/v1/rag/search" 200 '{"query":"ISO 27001 access control","top_k":3}' "auth"
test_endpoint "POST" "/api/v1/rag/query" 200 '{"query":"What are the ISO 27001 requirements for MFA?","top_k":3,"framework":"iso27001"}' "auth"

# 9. Documents
echo ""
info "8. DOCUMENTS"
test_endpoint "GET" "/api/v1/frameworks/documents" 200 "" "auth"

# 10. Logout (do last)
echo ""
info "9. LOGOUT"
test_endpoint "POST" "/api/v1/auth/logout" 200 "{\"refresh_token\":\"$REFRESH_TOKEN\"}" ""

echo ""
echo "============================================"
echo "  RESULTS: $PASSED passed, $FAILED failed"
echo "============================================"
