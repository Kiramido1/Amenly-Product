#!/bin/bash

# ==========================================
# Amenly Backend - Full Auth Test Suite
# Tests ALL endpoints with valid JWT token
# ==========================================

BASE_URL="http://127.0.0.1:8001"
API="$BASE_URL/api/v1"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

PASS=0
FAIL=0
TOTAL=0
TOKEN=""
REFRESH_TOKEN=""
USER_EMAIL=""
USER_PASSWORD=""

# ==========================================
# AUTH HELPER FUNCTIONS
# ==========================================

login_admin() {
  LOGIN_RESPONSE=$(curl -s -X POST "$API/auth/login" \
    -H "accept: application/json" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@first.com","password":"AdminPassword123!"}' 2>&1)
  if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4)
    USER_EMAIL="admin@first.com"
    USER_PASSWORD="AdminPassword123!"
    return 0
  fi
  return 1
}

login_member() {
  LOGIN_RESPONSE=$(curl -s -X POST "$API/auth/login" \
    -H "accept: application/json" \
    -H "Content-Type: application/json" \
    -d '{"email":"member1@first.com","password":"MemberPass1!"}' 2>&1)
  if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4)
    USER_EMAIL="member1@first.com"
    USER_PASSWORD="MemberPass1!"
    return 0
  fi
  return 1
}

register_new() {
  TIMESTAMP=$(date +%s)
  REGISTER_RESPONSE=$(curl -s -X POST "$API/auth/register" \
    -H "accept: application/json" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test${TIMESTAMP}@amenly.com\",\"password\":\"TestPass123!\",\"full_name\":\"Test User\",\"organization_name\":\"Test Org ${TIMESTAMP}\"}" 2>&1)
  if echo "$REGISTER_RESPONSE" | grep -q "access_token"; then
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4)
    USER_EMAIL="test${TIMESTAMP}@amenly.com"
    USER_PASSWORD="TestPass123!"
    return 0
  fi
  return 1
}

relogin() {
  LOGIN_RESPONSE=$(curl -s -X POST "$API/auth/login" \
    -H "accept: application/json" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}" 2>&1)
  if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4)
    return 0
  fi
  return 1
}

# ==========================================
# AUTHENTICATION SETUP
# ==========================================
echo -e "\n========================================"
echo -e "  AUTHENTICATION SETUP"
echo -e "========================================\n"

echo -e "${YELLOW}▶ Attempting admin login...${NC}"
if login_admin; then
  echo -e "   ${GREEN}✓ Admin login successful${NC}"
elif login_member; then
  echo -e "   ${YELLOW}Admin failed, member login successful${NC}"
elif register_new; then
  echo -e "   ${GREEN}✓ New user registered and logged in${NC}"
else
  echo -e "   ${RED}✗ All authentication methods failed${NC}"
  exit 1
fi

echo -e "\n${GREEN}✓ Authentication token acquired${NC}"
echo -e "   Token: ${TOKEN:0:50}..."

# ==========================================
# TEST FUNCTION
# ==========================================
test_endpoint() {
  local method=$1
  local endpoint=$2
  local auth=$3
  local data=$4
  local description=$5
  local expect_success=$6
  
  TOTAL=$((TOTAL + 1))
  
  local cmd="curl -s -w '\nHTTP_CODE:%{http_code}' -X $method '$endpoint' -H 'accept: application/json'"
  
  if [ "$auth" = "true" ] && [ -n "$TOKEN" ]; then
    cmd="$cmd -H 'Authorization: Bearer $TOKEN'"
  fi
  
  if [ -n "$data" ]; then
    cmd="$cmd -H 'Content-Type: application/json' -d '$data'"
  fi
  
  echo -e "${CYAN}▶${NC} $description"
  echo -e "   ${YELLOW}$method${NC} $endpoint"
  
  RESPONSE=$(eval $cmd 2>&1)
  HTTP_CODE=$(echo "$RESPONSE" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
  BODY=$(echo "$RESPONSE" | sed 's/HTTP_CODE:[0-9]*//g' | tr -d '\n')
  
  # Determine pass/fail
  local IS_SUCCESS=false
  if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    IS_SUCCESS=true
  elif [ "$HTTP_CODE" -ge 400 ] && [ "$HTTP_CODE" -lt 500 ] && [ "$expect_success" = "false" ]; then
    # For endpoints expected to fail (like validation errors)
    IS_SUCCESS=true
  fi
  
  if [ "$IS_SUCCESS" = "true" ]; then
    echo -e "   ${GREEN}✓ HTTP $HTTP_CODE${NC}"
    echo -e "   ${BLUE}Response:${NC} ${BODY:0:200}"
    PASS=$((PASS + 1))
  else
    echo -e "   ${RED}✗ HTTP $HTTP_CODE${NC}"
    echo -e "   ${BLUE}Response:${NC} ${BODY:0:400}"
    FAIL=$((FAIL + 1))
  fi
  echo ""
}

echo -e "\n========================================"
echo -e "  TESTING ALL ENDPOINTS WITH AUTH"
echo -e "========================================\n"

# ==========================================
# PUBLIC ENDPOINTS
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     PUBLIC ENDPOINTS                 ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$BASE_URL/" "false" "" "Root Endpoint" "true"
test_endpoint "GET" "$BASE_URL/health" "false" "" "Health Check" "true"

# ==========================================
# AUTH ENDPOINTS (WITH TOKEN)
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     AUTH ENDPOINTS                   ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/auth/me" "true" "" "Get Current User" "true"

# Test refresh
echo -e "${CYAN}▶${NC} Refresh Token"
echo -e "   ${YELLOW}POST${NC} $API/auth/refresh"
REFRESH_RESPONSE=$(curl -s -w '\nHTTP_CODE:%{http_code}' -X POST "$API/auth/refresh" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}" 2>&1)
REFRESH_CODE=$(echo "$REFRESH_RESPONSE" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
if [ "$REFRESH_CODE" -ge 200 ] && [ "$REFRESH_CODE" -lt 300 ]; then
  echo -e "   ${GREEN}✓ HTTP $REFRESH_CODE${NC}"
  PASS=$((PASS + 1))
  NEW_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$NEW_TOKEN" ]; then
    TOKEN="$NEW_TOKEN"
    echo -e "   ${GREEN}✓ Token refreshed${NC}"
  fi
else
  echo -e "   ${RED}✗ HTTP $REFRESH_CODE${NC}"
  FAIL=$((FAIL + 1))
fi
TOTAL=$((TOTAL + 1))
echo ""

# ==========================================
# USERS ENDPOINTS
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     USERS ENDPOINTS                  ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/users/" "true" "" "List Users" "true"
test_endpoint "GET" "$API/users/?skip=0&limit=5" "true" "" "List Users Paginated" "true"

# Get first user ID
USERS_RESPONSE=$(curl -s -X GET "$API/users/" -H "accept: application/json" -H "Authorization: Bearer $TOKEN")
USER_ID=$(echo "$USERS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$USER_ID" ]; then
  test_endpoint "GET" "$API/users/$USER_ID" "true" "" "Get User by ID" "true"
  test_endpoint "PATCH" "$API/users/$USER_ID" "true" '{"full_name":"Updated Name"}' "Update User" "true"
else
  echo -e "${YELLOW}⚠ No users found, skipping user detail tests${NC}\n"
fi

# ==========================================
# FRAMEWORKS ENDPOINTS
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     FRAMEWORKS ENDPOINTS             ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/frameworks/" "true" "" "List Frameworks" "true"
test_endpoint "GET" "$API/frameworks/?skip=0&limit=5" "true" "" "List Frameworks Paginated" "true"
test_endpoint "GET" "$API/frameworks/stats" "true" "" "Framework Stats" "true"
test_endpoint "GET" "$API/frameworks/types" "true" "" "Framework Types" "true"
test_endpoint "GET" "$API/frameworks/categories" "true" "" "Framework Categories" "true"
test_endpoint "GET" "$API/frameworks/regions" "true" "" "Framework Regions" "true"
test_endpoint "GET" "$API/frameworks/available/all" "true" "" "Available Frameworks" "true"

# Get first framework ID
FRAMEWORKS_RESPONSE=$(curl -s -X GET "$API/frameworks/" -H "accept: application/json" -H "Authorization: Bearer $TOKEN")
FRAMEWORK_ID=$(echo "$FRAMEWORKS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$FRAMEWORK_ID" ]; then
  test_endpoint "GET" "$API/frameworks/$FRAMEWORK_ID" "true" "" "Get Framework by ID" "true"
  test_endpoint "PATCH" "$API/frameworks/$FRAMEWORK_ID" "true" '{"description":"Updated description"}' "Update Framework" "true"
  test_endpoint "POST" "$API/frameworks/associate" "true" "{\"framework_ids\":[\"$FRAMEWORK_ID\"]}" "Associate Frameworks" "true"
  test_endpoint "DELETE" "$API/frameworks/dissociate/$FRAMEWORK_ID" "true" "" "Dissociate Framework" "true"
else
  echo -e "${YELLOW}⚠ No frameworks found, skipping framework detail tests${NC}\n"
fi

# ==========================================
# PERMISSIONS ENDPOINTS
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     PERMISSIONS ENDPOINTS            ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/permissions/me" "true" "" "Get My Permissions" "true"
test_endpoint "GET" "$API/permissions/catalog" "true" "" "Permissions Catalog" "true"
test_endpoint "GET" "$API/permissions/roles" "true" "" "Role Permissions" "true"
test_endpoint "GET" "$API/permissions/check/VIEW_MEMBERS" "true" "" "Check Permission" "true"

if [ -n "$USER_ID" ]; then
  test_endpoint "GET" "$API/permissions/user/$USER_ID" "true" "" "Get User Permissions" "true"
  test_endpoint "POST" "$API/permissions/grant" "true" "{\"user_id\":\"$USER_ID\",\"permission\":\"VIEW_MEMBERS\"}" "Grant Permission" "true"
  test_endpoint "POST" "$API/permissions/revoke" "true" "{\"user_id\":\"$USER_ID\",\"permission\":\"VIEW_MEMBERS\"}" "Revoke Permission" "true"
  test_endpoint "DELETE" "$API/permissions/user/$USER_ID/all" "true" "" "Revoke All Custom Permissions" "true"
fi

# ==========================================
# ORGANIZATIONS ENDPOINTS
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     ORGANIZATIONS ENDPOINTS          ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/orgs/me" "true" "" "Get My Organization" "true"
test_endpoint "PATCH" "$API/orgs/me" "true" '{"name":"Updated Organization"}' "Update Organization" "true"
test_endpoint "GET" "$API/orgs/departments" "true" "" "List Departments" "true"
test_endpoint "POST" "$API/orgs/departments" "true" '{"name":"IT Department","description":"IT team"}' "Create Department" "true"
test_endpoint "POST" "$API/orgs/positions" "true" '{"title":"Security Analyst","department_id":"1"}' "Create Position" "true"
test_endpoint "GET" "$API/orgs/departments/1/positions" "true" "" "List Positions" "true"

# ==========================================
# RAG ENDPOINTS
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     RAG ENDPOINTS                    ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/rag/health" "false" "" "RAG Health Check" "true"
test_endpoint "POST" "$API/rag/query" "true" '{"question":"What is ISO 27001?","top_k":3}' "RAG Query" "true"
test_endpoint "POST" "$API/rag/search" "true" '{"query":"ISO 27001 requirements","top_k":5}' "RAG Search" "true"

# ==========================================
# LOGOUT (LAST - IT REVOKES THE TOKEN)
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     LOGOUT (TOKEN REVOCATION)        ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "POST" "$API/auth/logout" "true" "" "Logout" "true"

# ==========================================
# VERIFY TOKEN IS REVOKED
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     VERIFY TOKEN REVOCATION          ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

echo -e "${CYAN}▶${NC} Verify token is revoked after logout"
echo -e "   ${YELLOW}GET${NC} $API/auth/me"
VERIFY_RESPONSE=$(curl -s -w '\nHTTP_CODE:%{http_code}' -X GET "$API/auth/me" \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN" 2>&1)
VERIFY_CODE=$(echo "$VERIFY_RESPONSE" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
if [ "$VERIFY_CODE" = "401" ] || [ "$VERIFY_CODE" = "403" ]; then
  echo -e "   ${GREEN}✓ HTTP $VERIFY_CODE - Token properly revoked${NC}"
  PASS=$((PASS + 1))
else
  echo -e "   ${RED}✗ HTTP $VERIFY_CODE - Token not properly revoked${NC}"
  FAIL=$((FAIL + 1))
fi
TOTAL=$((TOTAL + 1))
echo ""

# ==========================================
# RE-LOGIN TO CONTINUE (SHOW RECOVERY)
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     RE-AUTHENTICATION                ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

echo -e "${CYAN}▶${NC} Re-authenticating..."
if relogin; then
  echo -e "   ${GREEN}✓ Re-login successful${NC}"
  PASS=$((PASS + 1))
  
  # Quick verification
  echo -e "${CYAN}▶${NC} Verify new token works"
  echo -e "   ${YELLOW}GET${NC} $API/auth/me"
  ME_RESPONSE=$(curl -s -w '\nHTTP_CODE:%{http_code}' -X GET "$API/auth/me" \
    -H "accept: application/json" \
    -H "Authorization: Bearer $TOKEN" 2>&1)
  ME_CODE=$(echo "$ME_RESPONSE" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
  if [ "$ME_CODE" = "200" ]; then
    echo -e "   ${GREEN}✓ HTTP $ME_CODE - New token works${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "   ${RED}✗ HTTP $ME_CODE${NC}"
    FAIL=$((FAIL + 1))
  fi
  TOTAL=$((TOTAL + 1))
else
  echo -e "   ${RED}✗ Re-login failed${NC}"
  FAIL=$((FAIL + 2))
fi
TOTAL=$((TOTAL + 1))
echo ""

# ==========================================
# SWAGGER / OPENAPI
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     OPENAPI SCHEMA                   ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/openapi.json" "false" "" "OpenAPI Schema" "true"

# ==========================================
# FINAL RESULTS
# ==========================================
echo -e "\n${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║        TEST RESULTS SUMMARY        ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}"
echo -e "${BLUE}Total Endpoints Tested:${NC} $TOTAL"
echo -e "${GREEN}Passed:${NC} $PASS"
echo -e "${RED}Failed:${NC} $FAIL"
echo -e "${CYAN}Success Rate:${NC} $(awk "BEGIN {printf \"%.1f%%\", ($PASS/$TOTAL)*100}")"
echo -e "========================================\n"

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✓ All endpoints passed!${NC}\n"
  exit 0
else
  echo -e "${YELLOW}Some endpoints failed. Check output above.${NC}\n"
  exit 1
fi
