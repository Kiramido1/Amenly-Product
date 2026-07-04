#!/bin/bash
# Test RAG Endpoints in Swagger Section
# Tests: POST /query, POST /search, GET /health

set -e

BASE_URL="http://127.0.0.1:8001"
API="$BASE_URL/api/v1"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS=0
FAIL=0
TOTAL=0

test_rag_endpoint() {
    local method=$1
    local endpoint=$2
    local auth=$3
    local data=$4
    local description=$5
    local expect_code=$6
    
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
    
    if [ "$HTTP_CODE" = "$expect_code" ]; then
        echo -e "   ${GREEN}✓ HTTP $HTTP_CODE (Expected: $expect_code)${NC}"
        echo -e "   ${BLUE}Response:${NC} ${BODY:0:200}"
        PASS=$((PASS + 1))
    else
        echo -e "   ${RED}✗ HTTP $HTTP_CODE (Expected: $expect_code)${NC}"
        echo -e "   ${BLUE}Response:${NC} ${BODY:0:300}"
        FAIL=$((FAIL + 1))
    fi
    echo ""
}

echo -e "\n========================================"
echo -e "  RAG ENDPOINTS TEST (Swagger Section)"
echo -e "========================================\n"

# 1. RAG Health (Public)
echo -e "${YELLOW}--- RAG /health (Public) ---${NC}\n"
test_rag_endpoint "GET" "$API/rag/health" "false" "" "RAG System Health Check" "200"

# 2. RAG Query (Protected - no auth)
echo -e "${YELLOW}--- RAG /query (Protected) ---${NC}\n"
test_rag_endpoint "POST" "$API/rag/query" "false" '{"question":"What does ISO 27001 require?"}' "Query - No Auth" "403"
test_rag_endpoint "POST" "$API/rag/query" "false" '{}' "Query - Empty Body No Auth" "403"

# 3. RAG Search (Protected - no auth)
echo -e "${YELLOW}--- RAG /search (Protected) ---${NC}\n"
test_rag_endpoint "POST" "$API/rag/search" "false" '{"query":"ISO 27001","top_k":5}' "Search - No Auth" "403"
test_rag_endpoint "POST" "$API/rag/search" "false" '{}' "Search - Empty Body No Auth" "403"

# 4. Swagger/OpenAPI Schema
echo -e "${YELLOW}--- Swagger Schema ---${NC}\n"
test_rag_endpoint "GET" "$BASE_URL/api/v1/openapi.json" "false" "" "Get OpenAPI Schema" "200"

echo -e "========================================"
echo -e "         RAG TEST RESULTS"
echo -e "========================================"
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo -e "========================================\n"
