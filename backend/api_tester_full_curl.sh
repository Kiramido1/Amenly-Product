#!/bin/bash

# ==========================================
# Amenly Backend - Complete API Test with Data
# Tests ALL endpoints with actual data payloads
# ==========================================

BASE_URL="http://127.0.0.1:8001"
API="$BASE_URL/api/v1"

echo -e "\n=========================================="
echo -e "  Amenly Backend - Full API Test Suite"
echo -e "==========================================\n"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS=0
FAIL=0
TOTAL=0

# Function to test endpoint and capture full response
test_endpoint() {
    local method=$1
    local endpoint=$2
    local auth=$3
    local data=$4
    local description=$5
    local expect_code=$6
    
    TOTAL=$((TOTAL + 1))
    
    # Build curl command
    local cmd="curl -s -w '\nHTTP_CODE:%{http_code}' -X $method '$endpoint' -H 'accept: application/json'"
    
    if [ "$auth" = "true" ] && [ -n "$TOKEN" ]; then
        cmd="$cmd -H 'Authorization: Bearer $TOKEN'"
    fi
    
    if [ -n "$data" ]; then
        cmd="$cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    echo -e "${CYAN}▶${NC} $description"
    echo -e "   ${YELLOW}$method${NC} $endpoint"
    
    # Execute and capture response
    RESPONSE=$(eval $cmd 2>&1)
    HTTP_CODE=$(echo "$RESPONSE" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | sed 's/HTTP_CODE:[0-9]*//g' | tr -d '\n' | head -c 200)
    
    if [ "$HTTP_CODE" = "$expect_code" ]; then
        echo -e "   ${GREEN}✓ HTTP $HTTP_CODE (Expected: $expect_code)${NC}"
        echo -e "   ${BLUE}Response:${NC} ${BODY:0:100}..."
        PASS=$((PASS + 1))
    else
        echo -e "   ${RED}✗ HTTP $HTTP_CODE (Expected: $expect_code)${NC}"
        echo -e "   ${BLUE}Response:${NC} ${BODY:0:150}"
        FAIL=$((FAIL + 1))
    fi
    echo ""
}

# ==========================================
# STEP 1: TEST PUBLIC ENDPOINTS
# ==========================================
echo -e "${YELLOW}╔════════════════════════════════════════╗"
echo -e "║      PUBLIC ENDPOINTS (No Auth)        ║"
echo -e "╚════════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$BASE_URL/" "false" "" "Root Endpoint" "200"
test_endpoint "GET" "$BASE_URL/health" "false" "" "Health Check" "200"

# ==========================================
# STEP 2: TEST AUTH ENDPOINTS (No Token)
# ==========================================
echo -e "${YELLOW}╔════════════════════════════════════════╗"
echo -e "║      AUTH ENDPOINTS (Validation)       ║"
echo -e "╚════════════════════════════════════════╝${NC}\n"

# Test register with empty body (should fail validation)
test_endpoint "POST" "$API/auth/register" "false" '{}' "Register - Empty Body" "422"

# Test register with invalid data
test_endpoint "POST" "$API/auth/register" "false" '{"email":"test","password":"123"}' "Register - Invalid Data" "422"

# Test login with empty body
test_endpoint "POST" "$API/auth/login" "false" '{}' "Login - Empty Body" "422"

# Test login with invalid credentials
test_endpoint "POST" "$API/auth/login" "false" '{"email":"nonexistent@test.com","password":"wrongpass"}' "Login - Invalid Credentials" "401"

# Test refresh with empty body
test_endpoint "POST" "$API/auth/refresh" "false" '{}' "Refresh - Empty Body" "422"

# ==========================================
# STEP 3: TEST PROTECTED ENDPOINTS (No Token)
# ==========================================
echo -e "${YELLOW}╔════════════════════════════════════════╗"
echo -e "║   PROTECTED ENDPOINTS (No Token)       ║"
echo -e "╚════════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/auth/me" "true" "" "Get Current User" "403"
test_endpoint "POST" "$API/auth/logout" "true" "" "Logout" "403"

# Users endpoints
test_endpoint "GET" "$API/users/" "true" "" "List Users" "403"
test_endpoint "GET" "$API/users/550e8400-e29b-41d4-a716-446655440000" "true" "" "Get User" "403"
test_endpoint "PATCH" "$API/users/550e8400-e29b-41d4-a716-446655440000" "true" '{"full_name":"Test"}' "Update User" "403"
test_endpoint "DELETE" "$API/users/550e8400-e29b-41d4-a716-446655440000" "true" "" "Delete User" "403"

# Frameworks endpoints
test_endpoint "GET" "$API/frameworks/" "true" "" "List Frameworks" "403"
test_endpoint "POST" "$API/frameworks/" "true" '{"name":"Test","version":"1.0"}' "Create Framework" "403"
test_endpoint "GET" "$API/frameworks/stats" "true" "" "Framework Stats" "403"
test_endpoint "GET" "$API/frameworks/types" "true" "" "Framework Types" "403"
test_endpoint "GET" "$API/frameworks/categories" "true" "" "Framework Categories" "403"
test_endpoint "GET" "$API/frameworks/regions" "true" "" "Framework Regions" "403"
test_endpoint "GET" "$API/frameworks/550e8400-e29b-41d4-a716-446655440000" "true" "" "Get Framework" "403"
test_endpoint "PATCH" "$API/frameworks/550e8400-e29b-41d4-a716-446655440000" "true" '{"name":"Updated"}' "Update Framework" "403"
test_endpoint "DELETE" "$API/frameworks/550e8400-e29b-41d4-a716-446655440000" "true" "" "Delete Framework" "403"
test_endpoint "POST" "$API/frameworks/associate" "true" '{"framework_ids":[]}' "Associate Frameworks" "403"
test_endpoint "GET" "$API/frameworks/available/all" "true" "" "Available Frameworks" "403"
test_endpoint "DELETE" "$API/frameworks/dissociate/550e8400-e29b-41d4-a716-446655440000" "true" "" "Dissociate Framework" "403"

# Permissions endpoints
test_endpoint "GET" "$API/permissions/me" "true" "" "Get My Permissions" "403"
test_endpoint "GET" "$API/permissions/catalog" "true" "" "Permissions Catalog" "403"
test_endpoint "GET" "$API/permissions/roles" "true" "" "Role Permissions" "403"
test_endpoint "GET" "$API/permissions/user/550e8400-e29b-41d4-a716-446655440000" "true" "" "User Permissions" "403"
test_endpoint "POST" "$API/permissions/grant" "true" '{"user_id":"550e8400-e29b-41d4-a716-446655440000","permission":"VIEW_MEMBERS"}' "Grant Permission" "403"
test_endpoint "POST" "$API/permissions/revoke" "true" '{"user_id":"550e8400-e29b-41d4-a716-446655440000","permission":"VIEW_MEMBERS"}' "Revoke Permission" "403"
test_endpoint "DELETE" "$API/permissions/user/550e8400-e29b-41d4-a716-446655440000/all" "true" "" "Revoke All Permissions" "403"
test_endpoint "GET" "$API/permissions/check/VIEW_MEMBERS" "true" "" "Check Permission" "403"

# Organizations endpoints
test_endpoint "GET" "$API/orgs/me" "true" "" "Get My Organization" "403"
test_endpoint "PATCH" "$API/orgs/me" "true" '{"name":"Updated Org"}' "Update Organization" "403"
test_endpoint "GET" "$API/orgs/departments" "true" "" "List Departments" "403"
test_endpoint "POST" "$API/orgs/departments" "true" '{"name":"IT","description":"IT Dept"}' "Create Department" "403"
test_endpoint "POST" "$API/orgs/positions" "true" '{"title":"Manager","department_id":"1"}' "Create Position" "403"
test_endpoint "GET" "$API/orgs/departments/1/positions" "true" "" "List Positions" "403"
test_endpoint "DELETE" "$API/orgs/departments/1" "true" "" "Delete Department" "403"
test_endpoint "DELETE" "$API/orgs/positions/1" "true" "" "Delete Position" "403"

# RAG endpoints
test_endpoint "POST" "$API/rag/query" "true" '{"question":"What is ISO 27001?"}' "RAG Query" "403"
test_endpoint "POST" "$API/rag/search" "true" '{"query":"ISO 27001","top_k":5}' "RAG Search" "403"

# ==========================================
# STEP 4: RAG PUBLIC HEALTH
# ==========================================
echo -e "${YELLOW}╔════════════════════════════════════════╗"
echo -e "║      RAG SYSTEM HEALTH CHECK           ║"
echo -e "╚════════════════════════════════════════╝${NC}\n"

test_endpoint "GET" "$API/rag/health" "false" "" "RAG Health Check" "200"

# ==========================================
# FINAL RESULTS
# ==========================================
echo -e "\n${YELLOW}╔════════════════════════════════════════╗"
echo -e "║           TEST RESULTS SUMMARY         ║"
echo -e "╚════════════════════════════════════════╝${NC}"
echo -e "${BLUE}Total Endpoints Tested:${NC} $TOTAL"
echo -e "${GREEN}Passed:${NC} $PASS"
echo -e "${RED}Failed:${NC} $FAIL"
echo -e "${CYAN}Success Rate:${NC} $(awk "BEGIN {printf \"%.1f\", ($PASS/$TOTAL)*100}")%"
echo -e "\n==========================================\n"

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ All endpoints responded with expected status codes!${NC}\n"
    exit 0
else
    echo -e "${YELLOW}Note: Some tests may need valid authentication tokens${NC}\n"
    exit 1
fi
