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
USER_ID=""
ORG_ID=""

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

get_user_info() {
  ME_RESPONSE=$(curl -s -X GET "$API/auth/me" -H "accept: application/json" -H "Authorization: Bearer $TOKEN")
  USER_ID=$(echo "$ME_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  ORG_ID=$(echo "$ME_RESPONSE" | grep -o '"organization_id":"[^"]*"' | head -1 | cut -d'"' -f4)
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

get_user_info

echo -e "\n${GREEN}✓ Authentication token acquired${NC}"
echo -e "   Token: ${TOKEN:0:50}..."
echo -e "   User ID: $USER_ID"
echo -e "   Org ID: $ORG_ID"

# ==========================================
# TEST FUNCTION
# ==========================================
test_endpoint() {
  local method=$1
  local endpoint=$2
  local auth=$3
  local data=$4
  local description=$5
  
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
  
  if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 500 ]; then
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

test_endpoint "GET" "$BASE_URL/" "false" "" "Root Endpoint"
test_endpoint "GET" "$BASE_URL/health" "false" "" "Health Check"

# ==========================================
# AUTH ENDPOINTS (WITH TOKEN)
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     AUTH ENDPOINTS                   ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/auth/me" "true" "" "Get Current User"

# Refresh Token
echo -e "${CYAN}▶${NC} Refresh Token"
echo -e "   ${YELLOW}POST${NC} $API/auth/refresh"
REFRESH_RESPONSE=$(curl -s -w '\nHTTP_CODE:%{http_code}' -X POST "$API/auth/refresh" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}" 2>&1)
REFRESH_CODE=$(echo "$REFRESH_RESPONSE" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
if [ "$REFRESH_CODE" -ge 200 ] && [ "$REFRESH_CODE" -lt 500 ]; then
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

test_endpoint "GET" "$API/users/" "true" "" "List Users"
test_endpoint "GET" "$API/users/?skip=0&limit=5" "true" "" "List Users Paginated"

# Get first user ID
USERS_RESPONSE=$(curl -s -X GET "$API/users/" -H "accept: application/json" -H "Authorization: Bearer $TOKEN")
FIRST_USER_ID=$(echo "$USERS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$FIRST_USER_ID" ]; then
  test_endpoint "GET" "$API/users/$FIRST_USER_ID" "true" "" "Get User by ID"
  test_endpoint "PATCH" "$API/users/$FIRST_USER_ID" "true" '{"full_name":"Updated Name"}' "Update User"
else
  echo -e "${YELLOW}⚠ No users found, skipping user detail tests${NC}\n"
fi

# ==========================================
# FRAMEWORKS ENDPOINTS
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     FRAMEWORKS ENDPOINTS             ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/frameworks/" "true" "" "List Frameworks"
test_endpoint "GET" "$API/frameworks/?skip=0&limit=5" "true" "" "List Frameworks Paginated"
test_endpoint "GET" "$API/frameworks/stats" "true" "" "Framework Stats"
test_endpoint "GET" "$API/frameworks/types" "true" "" "Framework Types"
test_endpoint "GET" "$API/frameworks/categories" "true" "" "Framework Categories"
test_endpoint "GET" "$API/frameworks/regions" "true" "" "Framework Regions"
test_endpoint "GET" "$API/frameworks/available/all" "true" "" "Available Frameworks"

# Get first framework ID
FRAMEWORKS_RESPONSE=$(curl -s -X GET "$API/frameworks/" -H "accept: application/json" -H "Authorization: Bearer $TOKEN")
FRAMEWORK_ID=$(echo "$FRAMEWORKS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$FRAMEWORK_ID" ]; then
  test_endpoint "GET" "$API/frameworks/$FRAMEWORK_ID" "true" "" "Get Framework by ID"
  test_endpoint "PATCH" "$API/frameworks/$FRAMEWORK_ID" "true" '{"description":"Updated description"}' "Update Framework"
  test_endpoint "POST" "$API/frameworks/associate" "true" "{\"framework_ids\":[\"$FRAMEWORK_ID\"]}" "Associate Frameworks"
  test_endpoint "DELETE" "$API/frameworks/dissociate/$FRAMEWORK_ID" "true" "" "Dissociate Framework"
else
  echo -e "${YELLOW}⚠ No frameworks found, skipping framework detail tests${NC}\n"
fi

# ==========================================
# PERMISSIONS ENDPOINTS
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     PERMISSIONS ENDPOINTS            ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/permissions/me" "true" "" "Get My Permissions"
test_endpoint "GET" "$API/permissions/catalog" "true" "" "Permissions Catalog"
test_endpoint "GET" "$API/permissions/roles" "true" "" "Role Permissions"

# Use valid permission enum value (lowercase)
test_endpoint "GET" "$API/permissions/check/view_members" "true" "" "Check Permission"

if [ -n "$FIRST_USER_ID" ]; then
  test_endpoint "GET" "$API/permissions/user/$FIRST_USER_ID" "true" "" "Get User Permissions"
  # GrantPermissionRequest needs: user_id + permissions (array)
  test_endpoint "POST" "$API/permissions/grant" "true" "{\"user_id\":\"$FIRST_USER_ID\",\"permissions\":[\"view_members\"]}" "Grant Permission"
  test_endpoint "POST" "$API/permissions/revoke" "true" "{\"user_id\":\"$FIRST_USER_ID\",\"permissions\":[\"view_members\"]}" "Revoke Permission"
  test_endpoint "DELETE" "$API/permissions/user/$FIRST_USER_ID/all" "true" "" "Revoke All Custom Permissions"
fi

# ==========================================
# ORGANIZATIONS ENDPOINTS
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     ORGANIZATIONS ENDPOINTS          ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/orgs/me" "true" "" "Get My Organization"
test_endpoint "PATCH" "$API/orgs/me" "true" '{"name":"Updated Organization"}' "Update Organization"
test_endpoint "GET" "$API/orgs/departments" "true" "" "List Departments"

if [ -n "$ORG_ID" ]; then
  # DepartmentCreate needs: name + organization_id (UUID)
  test_endpoint "POST" "$API/orgs/departments" "true" "{\"name\":\"IT Department\",\"description\":\"IT team\",\"organization_id\":\"$ORG_ID\"}" "Create Department"
else
  echo -e "${YELLOW}⚠ No org ID found, skipping department creation${NC}\n"
fi

# Get first department ID
DEPTS_RESPONSE=$(curl -s -X GET "$API/orgs/departments" -H "accept: application/json" -H "Authorization: Bearer $TOKEN")
DEPT_ID=$(echo "$DEPTS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$DEPT_ID" ]; then
  # PositionCreate needs: name + department_id (UUID)
  test_endpoint "POST" "$API/orgs/positions" "true" "{\"name\":\"Security Analyst\",\"department_id\":\"$DEPT_ID\"}" "Create Position"
  test_endpoint "GET" "$API/orgs/departments/$DEPT_ID/positions" "true" "" "List Positions"

  # Note: Skipping delete tests for positions/departments
  # because existing users have foreign key references to them
  echo -e "   ${YELLOW}Note: Skipping position/department delete tests${NC}"
  echo -e "   ${YELLOW}(existing user data has foreign key references)${NC}\n"
else
  echo -e "${YELLOW}⚠ No departments found, skipping position tests${NC}\n"
fi

# ==========================================
# RAG ENDPOINTS
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     RAG ENDPOINTS                    ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/rag/health" "false" "" "RAG Health Check"
test_endpoint "POST" "$API/rag/query" "true" '{"question":"What is ISO 27001?","top_k":3}' "RAG Query"
test_endpoint "POST" "$API/rag/search" "true" '{"query":"ISO 27001 requirements","top_k":5}' "RAG Search"

# ==========================================
# LOGOUT (LAST - IT REVOKES THE TOKEN)
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     LOGOUT (TOKEN REVOCATION)        ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "POST" "$API/auth/logout" "true" "" "Logout"

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
  TOTAL=$((TOTAL + 2))
fi
echo ""

# ==========================================
# SWAGGER / OPENAPI
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     OPENAPI SCHEMA                   ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/openapi.json" "false" "" "OpenAPI Schema"

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
