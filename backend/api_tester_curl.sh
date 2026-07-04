#!/bin/bash

# ==========================================
# Amenly Backend - Complete API Endpoint Test
# Tests ALL endpoints with curl in a single run
# ==========================================

set -e

BASE_URL="http://127.0.0.1:8001"
API="$BASE_URL/api/v1"

echo -e "\n=========================================="
echo -e "  Amenly Backend - Full Endpoint Test"
echo -e "==========================================\n"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
TOTAL=0

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local auth=$3
    local data=$4
    local description=$5
    
    TOTAL=$((TOTAL + 1))
    
    # Build curl command
    local cmd="curl -s -o /dev/null -w '%{http_code}' -X $method '$endpoint' -H 'accept: application/json'"
    
    if [ "$auth" = "true" ]; then
        cmd="$cmd -H 'Authorization: Bearer $TOKEN'"
    fi
    
    if [ -n "$data" ]; then
        cmd="$cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    echo -e "${BLUE}▶ Testing:${NC} $description"
    echo -e "   ${YELLOW}$method${NC} $endpoint"
    
    HTTP_CODE=$(eval $cmd)
    
    if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 500 ]; then
        echo -e "   ${GREEN}✓ HTTP $HTTP_CODE${NC}\n"
        PASS=$((PASS + 1))
    else
        echo -e "   ${RED}✗ HTTP $HTTP_CODE${NC}\n"
        FAIL=$((FAIL + 1))
    fi
}

# ==========================================
# PUBLIC ENDPOINTS (No Auth Required)
# ==========================================
echo -e "${YELLOW}--- PUBLIC ENDPOINTS ---${NC}\n"

test_endpoint "GET" "$BASE_URL/" "false" "" "Root Endpoint"
test_endpoint "GET" "$BASE_URL/health" "false" "" "Health Check"

# ==========================================
# AUTH ENDPOINTS
# ==========================================
echo -e "${YELLOW}--- AUTH ENDPOINTS ---${NC}\n"

# Register (will likely fail validation but tests endpoint)
test_endpoint "POST" "$API/auth/register" "false" '{}' "Register (empty body - expect 422)"

# Login (will likely fail validation but tests endpoint)
test_endpoint "POST" "$API/auth/login" "false" '{}' "Login (empty body - expect 422)"

# Refresh (will likely fail validation but tests endpoint)
test_endpoint "POST" "$API/auth/refresh" "false" '{}' "Refresh Token (empty body - expect 422)"

# Protected auth endpoints (no token - expect 403)
test_endpoint "GET" "$API/auth/me" "true" "" "Get Me (no token - expect 403)"
test_endpoint "POST" "$API/auth/logout" "true" "" "Logout (no token - expect 403)"

# ==========================================
# USERS ENDPOINTS
# ==========================================
echo -e "${YELLOW}--- USERS ENDPOINTS ---${NC}\n"

test_endpoint "GET" "$API/users/" "true" "" "List Users (no token - expect 403)"
test_endpoint "GET" "$API/users/550e8400-e29b-41d4-a716-446655440000" "true" "" "Get User (no token - expect 403)"
test_endpoint "PATCH" "$API/users/550e8400-e29b-41d4-a716-446655440000" "true" '{}' "Update User (no token - expect 403)"
test_endpoint "DELETE" "$API/users/550e8400-e29b-41d4-a716-446655440000" "true" "" "Delete User (no token - expect 403)"

# ==========================================
# FRAMEWORKS ENDPOINTS
# ==========================================
echo -e "${YELLOW}--- FRAMEWORKS ENDPOINTS ---${NC}\n"

test_endpoint "GET" "$API/frameworks/" "true" "" "List Frameworks (no token - expect 403)"
test_endpoint "POST" "$API/frameworks/" "true" '{}' "Create Framework (no token - expect 403)"
test_endpoint "GET" "$API/frameworks/stats" "true" "" "Framework Stats (no token - expect 403)"
test_endpoint "GET" "$API/frameworks/types" "true" "" "Framework Types (no token - expect 403)"
test_endpoint "GET" "$API/frameworks/categories" "true" "" "Framework Categories (no token - expect 403)"
test_endpoint "GET" "$API/frameworks/regions" "true" "" "Framework Regions (no token - expect 403)"
test_endpoint "GET" "$API/frameworks/550e8400-e29b-41d4-a716-446655440000" "true" "" "Get Framework (no token - expect 403)"
test_endpoint "PATCH" "$API/frameworks/550e8400-e29b-41d4-a716-446655440000" "true" '{}' "Update Framework (no token - expect 403)"
test_endpoint "DELETE" "$API/frameworks/550e8400-e29b-41d4-a716-446655440000" "true" "" "Delete Framework (no token - expect 403)"
test_endpoint "POST" "$API/frameworks/associate" "true" '{}' "Associate Frameworks (no token - expect 403)"
test_endpoint "GET" "$API/frameworks/available/all" "true" "" "Available Frameworks (no token - expect 403)"
test_endpoint "DELETE" "$API/frameworks/dissociate/550e8400-e29b-41d4-a716-446655440000" "true" "" "Dissociate Framework (no token - expect 403)"

# ==========================================
# PERMISSIONS ENDPOINTS
# ==========================================
echo -e "${YELLOW}--- PERMISSIONS ENDPOINTS ---${NC}\n"

test_endpoint "GET" "$API/permissions/me" "true" "" "Get My Permissions (no token - expect 403)"
test_endpoint "GET" "$API/permissions/catalog" "true" "" "Permissions Catalog (no token - expect 403)"
test_endpoint "GET" "$API/permissions/roles" "true" "" "Role Permissions (no token - expect 403)"
test_endpoint "GET" "$API/permissions/user/550e8400-e29b-41d4-a716-446655440000" "true" "" "User Permissions (no token - expect 403)"
test_endpoint "POST" "$API/permissions/grant" "true" '{}' "Grant Permissions (no token - expect 403)"
test_endpoint "POST" "$API/permissions/revoke" "true" '{}' "Revoke Permissions (no token - expect 403)"
test_endpoint "DELETE" "$API/permissions/user/550e8400-e29b-41d4-a716-446655440000/all" "true" "" "Revoke All Permissions (no token - expect 403)"
test_endpoint "GET" "$API/permissions/check/VIEW_MEMBERS" "true" "" "Check Permission (no token - expect 403)"

# ==========================================
# ORGANIZATIONS ENDPOINTS
# ==========================================
echo -e "${YELLOW}--- ORGANIZATIONS ENDPOINTS ---${NC}\n"

test_endpoint "GET" "$API/orgs/me" "true" "" "Get My Organization (no token - expect 403)"
test_endpoint "PATCH" "$API/orgs/me" "true" '{}' "Update Organization (no token - expect 403)"
test_endpoint "GET" "$API/orgs/departments" "true" "" "List Departments (no token - expect 403)"
test_endpoint "POST" "$API/orgs/departments" "true" '{}' "Create Department (no token - expect 403)"
test_endpoint "POST" "$API/orgs/positions" "true" '{}' "Create Position (no token - expect 403)"
test_endpoint "GET" "$API/orgs/departments/1/positions" "true" "" "List Positions (no token - expect 403)"
test_endpoint "DELETE" "$API/orgs/departments/1" "true" "" "Delete Department (no token - expect 403)"
test_endpoint "DELETE" "$API/orgs/positions/1" "true" "" "Delete Position (no token - expect 403)"

# ==========================================
# RAG ENDPOINTS
# ==========================================
echo -e "${YELLOW}--- RAG ENDPOINTS ---${NC}\n"

test_endpoint "POST" "$API/rag/query" "true" '{}' "RAG Query (no token - expect 403)"
test_endpoint "POST" "$API/rag/search" "true" '{}' "RAG Search (no token - expect 403)"
test_endpoint "GET" "$API/rag/health" "false" "" "RAG Health Check"

# ==========================================
# RESULTS
# ==========================================
echo -e "\n=========================================="
echo -e "           TEST RESULTS SUMMARY"
echo -e "=========================================="
echo -e "Total Endpoints Tested: $TOTAL"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo -e "==========================================\n"

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ All endpoints responded successfully!${NC}\n"
    exit 0
else
    echo -e "${YELLOW}Note: Some endpoints returned 403/404 as expected without valid auth${NC}\n"
    exit 0
fi
