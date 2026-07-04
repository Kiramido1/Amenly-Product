#!/bin/bash

echo '====================================='
echo 'Testing Swagger endpoints using curl'
echo '=====================================
'
BASE_URL="http://127.0.0.1:8001"

TOKEN="YOUR_ACCESS_TOKEN_HERE"

echo '▶ Testing: Root'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/' \
  -H 'accept: application/json' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Health Check'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/health' \
  -H 'accept: application/json' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Register'
eval "curl -s -S -X 'POST' \
  'http://127.0.0.1:8001/api/v1/auth/register' \
  -H 'accept: application/json' -H 'Content-Type: application/json' -d '{}' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Login'
eval "curl -s -S -X 'POST' \
  'http://127.0.0.1:8001/api/v1/auth/login' \
  -H 'accept: application/json' -H 'Content-Type: application/json' -d '{}' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Refresh Token'
eval "curl -s -S -X 'POST' \
  'http://127.0.0.1:8001/api/v1/auth/refresh' \
  -H 'accept: application/json' -H 'Content-Type: application/json' -d '{}' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Get Me'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/auth/me' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Logout'
eval "curl -s -S -X 'POST' \
  'http://127.0.0.1:8001/api/v1/auth/logout' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Debug Token Status'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/auth/debug/token-status' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Get Users'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/users/' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Get User'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/users/1' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Update User'
eval "curl -s -S -X 'PATCH' \
  'http://127.0.0.1:8001/api/v1/users/1' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{}' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Delete User'
eval "curl -s -S -X 'DELETE' \
  'http://127.0.0.1:8001/api/v1/users/1' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: List all frameworks'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/frameworks/' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Create new framework'
eval "curl -s -S -X 'POST' \
  'http://127.0.0.1:8001/api/v1/frameworks/' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{}' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Get framework statistics'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/frameworks/stats' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Get available framework types'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/frameworks/types' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Get available framework categories'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/frameworks/categories' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Get available regions'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/frameworks/regions' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Get framework details'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/frameworks/1' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Update framework'
eval "curl -s -S -X 'PATCH' \
  'http://127.0.0.1:8001/api/v1/frameworks/1' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{}' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Delete framework'
eval "curl -s -S -X 'DELETE' \
  'http://127.0.0.1:8001/api/v1/frameworks/1' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Associate frameworks with organization'
eval "curl -s -S -X 'POST' \
  'http://127.0.0.1:8001/api/v1/frameworks/associate' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{}' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Get all available frameworks'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/frameworks/available/all' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Remove framework from organization'
eval "curl -s -S -X 'DELETE' \
  'http://127.0.0.1:8001/api/v1/frameworks/dissociate/1' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Get my permissions'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/permissions/me' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Get permissions catalog'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/permissions/catalog' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Get role permissions'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/permissions/roles' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Get user permissions'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/permissions/user/1' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Grant permissions to user'
eval "curl -s -S -X 'POST' \
  'http://127.0.0.1:8001/api/v1/permissions/grant' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{}' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Revoke permissions from user'
eval "curl -s -S -X 'POST' \
  'http://127.0.0.1:8001/api/v1/permissions/revoke' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{}' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Revoke all custom permissions'
eval "curl -s -S -X 'DELETE' \
  'http://127.0.0.1:8001/api/v1/permissions/user/1/all' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Check if I have permission'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/permissions/check/1' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Get My Organization'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/organizations/me' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Update My Organization'
eval "curl -s -S -X 'PATCH' \
  'http://127.0.0.1:8001/api/v1/organizations/me' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{}' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: List Departments'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/organizations/departments' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Create Department'
eval "curl -s -S -X 'POST' \
  'http://127.0.0.1:8001/api/v1/organizations/departments' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{}' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Create Position'
eval "curl -s -S -X 'POST' \
  'http://127.0.0.1:8001/api/v1/organizations/positions' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{}' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: List Positions'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/organizations/departments/1/positions' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Delete Department'
eval "curl -s -S -X 'DELETE' \
  'http://127.0.0.1:8001/api/v1/organizations/departments/1' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Delete Position'
eval "curl -s -S -X 'DELETE' \
  'http://127.0.0.1:8001/api/v1/organizations/positions/1' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Query Rag'
eval "curl -s -S -X 'POST' \
  'http://127.0.0.1:8001/api/v1/rag/query' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{}' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Search Documents'
eval "curl -s -S -X 'POST' \
  'http://127.0.0.1:8001/api/v1/rag/search' \
  -H 'accept: application/json' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{}' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5

echo '▶ Testing: Health Check'
eval "curl -s -S -X 'GET' \
  'http://127.0.0.1:8001/api/v1/rag/health' \
  -H 'accept: application/json' \
  -w '\nHTTP Status: %{http_code}\n'"
echo '-------------------------------------'
sleep 0.5
