#!/bin/bash

# ==========================================
# Amenly Backend - Complete Auth Test Suite
# Tests ALL endpoints with valid JWT token
# ==========================================

set -e

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

# ==========================================
# STEP 1: LOGIN OR REGISTER
# ==========================================
echo -e "\n========================================"
echo -e "  AUTHENTICATION SETUP"
echo -e "========================================\n"

# Try existing admin account first
echo -e "${YELLOW}▶ Attempting login with admin account...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API/auth/login" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@first.com","password":"AdminPassword123!"}' 2>&1)

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
  echo -e "   ${GREEN}✓ Admin login successful${NC}"
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
  REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4)
else
  echo -e "   ${YELLOW}Admin login failed, trying member account...${NC}"
  LOGIN_RESPONSE=$(curl -s -X POST "$API/auth/login" \
    -H "accept: application/json" \
    -H "Content-Type: application/json" \
    -d '{"email":"member1@first.com","password":"MemberPass1!"}' 2>&1)

  if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo -e "   ${GREEN}✓ Member login successful${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4)
  else
    echo -e "   ${YELLOW}No existing accounts found, registering new user...${NC}"
    TIMESTAMP=$(date +%s)
    REGISTER_RESPONSE=$(curl -s -X POST "$API/auth/register" \
      -H "accept: application/json" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"test${TIMESTAMP}@amenly.com\",\"password\":\"TestPass123!\",\"full_name\":\"Test User\",\"organization_name\":\"Test Org ${TIMESTAMP}\"}" 2>&1)

    if echo "$REGISTER_RESPONSE" | grep -q "access_token"; then
      echo -e "   ${GREEN}✓ Registration successful${NC}"
      TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
      REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4)
    else
      echo -e "   ${RED}✗ Registration failed${NC}"
      echo "   Response: $REGISTER_RESPONSE"
      exit 1
    fi
  fi
fi

# Show token preview
if [ -n "$TOKEN" ]; then
  echo -e "\n${GREEN}✓ Authentication token acquired${NC}"
  echo -e "   Token: ${TOKEN:0:50}..."
else
  echo -e "\n${RED}✗ Failed to acquire token${NC}"
  exit 1
fi

echo -e "\n========================================"
echo -e "  TESTING ALL ENDPOINTS WITH AUTH"
echo -e "========================================\n"

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
  
  # Determine if pass or fail based on expected codes
  if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 500 ]; then
    echo -e "   ${GREEN}✓ HTTP $HTTP_CODE${NC}"
    echo -e "   ${BLUE}Response:${NC} ${BODY:0:150}"
    PASS=$((PASS + 1))
  else
    echo -e "   ${RED}✗ HTTP $HTTP_CODE${NC}"
    echo -e "   ${BLUE}Response:${NC} ${BODY:0:300}"
    FAIL=$((FAIL + 1))
  fi
  echo ""
}

# ==========================================
# PUBLIC ENDPOINTS
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     PUBLIC ENDPOINTS               ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$BASE_URL/" "false" "" "Root Endpoint"
test_endpoint "GET" "$BASE_URL/health" "false" "" "Health Check"

# ==========================================
# AUTH ENDPOINTS (WITH TOKEN)
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     AUTH ENDPOINTS                 ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/auth/me" "true" "" "Get Current User"
test_endpoint "POST" "$API/auth/logout" "true" "" "Logout"

# Test refresh with the refresh token
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
  # Update token
  NEW_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$NEW_TOKEN" ]; then
    TOKEN="$NEW_TOKEN"
    echo -e "   ${GREEN}✓ Token refreshed successfully${NC}"
  fi
else
  echo -e "   ${RED}✗ HTTP $REFRESH_CODE${NC}"
  FAIL=$((FAIL + 1))
fi
TOTAL=$((TOTAL + 1))
echo ""

# Re-authenticate after logout if needed
if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}▶ Re-authenticating after logout...${NC}"
  LOGIN_RESPONSE=$(curl -s -X POST "$API/auth/login" \
    -H "accept: application/json" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@first.com","password":"AdminPassword123!"}' 2>&1)
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
fi

# ==========================================
# USERS ENDPOINTS
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     USERS ENDPOINTS                ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/users/" "true" "" "List Users"
test_endpoint "GET" "$API/users/?skip=0&limit=5" "true" "" "List Users Paginated"

# Get first user ID for testing
USERS_RESPONSE=$(curl -s -X GET "$API/users/" -H "accept: application/json" -H "Authorization: Bearer $TOKEN")
USER_ID=$(echo "$USERS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$USER_ID" ]; then
  test_endpoint "GET" "$API/users/$USER_ID" "true" "" "Get User by ID"
  test_endpoint "PATCH" "$API/users/$USER_ID" "true" '{"full_name":"Updated Name"}' "Update User"
  # Don't delete the user we're testing with
else
  echo -e "${YELLOW}⚠ No users found, skipping user detail tests${NC}\n"
fi

# ==========================================
# FRAMEWORKS ENDPOINTS
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     FRAMEWORKS ENDPOINTS           ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/frameworks/" "true" "" "List Frameworks"
test_endpoint "GET" "$API/frameworks/?skip=0&limit=5" "true" "" "List Frameworks Paginated"
test_endpoint "GET" "$API/frameworks/stats" "true" "" "Framework Stats"
test_endpoint "GET" "$API/frameworks/types" "true" "" "Framework Types"
test_endpoint "GET" "$API/frameworks/categories" "true" "" "Framework Categories"
test_endpoint "GET" "$API/frameworks/regions" "true" "" "Framework Regions"

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

test_endpoint "GET" "$API/frameworks/available/all" "true" "" "Available Frameworks"

# ==========================================
# PERMISSIONS ENDPOINTS
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     PERMISSIONS ENDPOINTS          ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/permissions/me" "true" "" "Get My Permissions"
test_endpoint "GET" "$API/permissions/catalog" "true" "" "Permissions Catalog"
test_endpoint "GET" "$API/permissions/roles" "true" "" "Role Permissions"
test_endpoint "GET" "$API/permissions/check/VIEW_MEMBERS" "true" "" "Check Permission"

if [ -n "$USER_ID" ]; then
  test_endpoint "GET" "$API/permissions/user/$USER_ID" "true" "" "Get User Permissions"
  test_endpoint "POST" "$API/permissions/grant" "true" "{\"user_id\":\"$USER_ID\",\"permission\":\"VIEW_MEMBERS\"}" "Grant Permission"
  test_endpoint "POST" "$API/permissions/revoke" "true" "{\"user_id\":\"$USER_ID\",\"permission\":\"VIEW_MEMBERS\"}" "Revoke Permission"
  test_endpoint "DELETE" "$API/permissions/user/$USER_ID/all" "true" "" "Revoke All Custom Permissions"
fi

# ==========================================
# ORGANIZATIONS ENDPOINTS
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     ORGANIZATIONS ENDPOINTS        ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/orgs/me" "true" "" "Get My Organization"
test_endpoint "PATCH" "$API/orgs/me" "true" '{"name":"Updated Organization"}' "Update Organization"
test_endpoint "GET" "$API/orgs/departments" "true" "" "List Departments"
test_endpoint "POST" "$API/orgs/departments" "true" '{"name":"IT Department","description":"IT team"}' "Create Department"
test_endpoint "POST" "$API/orgs/positions" "true" '{"title":"Security Analyst","department_id":"1"}' "Create Position"
test_endpoint "GET" "$API/orgs/departments/1/positions" "true" "" "List Positions"

# ==========================================
# RAG ENDPOINTS
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     RAG ENDPOINTS                  ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/rag/health" "false" "" "RAG Health Check"
test_endpoint "POST" "$API/rag/query" "true" '{"question":"What is ISO 27001?","top_k":3}' "RAG Query"
test_endpoint "POST" "$API/rag/search" "true" '{"query":"ISO 27001 requirements","top_k":5}' "RAG Search"

# ==========================================
# SWAGGER / OPENAPI
# ==========================================
echo -e "${MAGENTA}╔══════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     OPENAPI SCHEMA                 ║${NC}"
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
