#!/usr/bin/env bash
#
# Amenly API smoke test — exercises every endpoint and asserts the HTTP status.
# Walks the full user journey (auth -> org/users -> frameworks -> assessments ->
# assets -> dashboard -> rag -> permissions) plus key negative/authz cases.
#
# Usage:
#   API_BASE=http://127.0.0.1:8011/api/v1 \
#   ADMIN_EMAIL=superadmin1@example.com ADMIN_PASSWORD='SuperAdmin123!' \
#   bash scripts/api_smoke_test.sh
#
# Exit code is non-zero if any check fails (CI friendly).

set -uo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:8011/api/v1}"
ROOT="${API_BASE%/api/v1}"
ADMIN_EMAIL="${ADMIN_EMAIL:-superadmin1@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-SuperAdmin123!}"
ORIGIN="${ORIGIN:-http://localhost:5173}"

RED=$'\e[31m'; GREEN=$'\e[32m'; YELLOW=$'\e[33m'; BOLD=$'\e[1m'; NC=$'\e[0m'
BODY="$(mktemp)"; trap 'rm -f "$BODY"' EXIT
TOKEN=""; TOTAL=0; PASS=0; FAIL=0; declare -a FAILED=()

# do_req METHOD PATH [JSON_BODY] [noauth]  -> sets HTTP_STATUS, writes body to $BODY
do_req() {
  local method="$1" path="$2" data="${3:-}" mode="${4:-auth}" url
  case "$path" in /health|/) url="$ROOT$path";; *) url="$API_BASE$path";; esac
  # -L follows redirects (e.g. trailing-slash 307) like a real browser/axios client.
  local args=(-sL -o "$BODY" -w '%{http_code}' -X "$method" -H "Origin: $ORIGIN")
  [[ "$mode" == auth && -n "$TOKEN" ]] && args+=(-H "Authorization: Bearer $TOKEN")
  [[ -n "$data" ]] && args+=(-H 'Content-Type: application/json' -d "$data")
  HTTP_STATUS="$(curl "${args[@]}" "$url" 2>/dev/null)"
}

# check LABEL METHOD PATH EXPECT_REGEX [JSON] [noauth]
check() {
  local label="$1" method="$2" path="$3" expect="$4" data="${5:-}" mode="${6:-auth}"
  do_req "$method" "$path" "$data" "$mode"
  TOTAL=$((TOTAL+1))
  if [[ "$HTTP_STATUS" =~ ^($expect)$ ]]; then
    PASS=$((PASS+1)); printf "  ${GREEN}PASS${NC} %-6s %-46s ${GREEN}%s${NC}  %s\n" "$method" "$path" "$HTTP_STATUS" "$label"
  else
    FAIL=$((FAIL+1)); FAILED+=("$method $path -> $HTTP_STATUS (want $expect) [$label]")
    printf "  ${RED}FAIL${NC} %-6s %-46s ${RED}%s${NC}  %s ${YELLOW}(want %s)${NC}\n" "$method" "$path" "$HTTP_STATUS" "$label" "$expect"
  fi
}
jqv() { jq -r "$1" "$BODY" 2>/dev/null; }
section() { printf "\n${BOLD}== %s ==${NC}\n" "$1"; }
rnd="$RANDOM$RANDOM"

printf "${BOLD}Amenly API smoke test${NC}  (%s)\n" "$API_BASE"

# ---------------- AUTH ----------------
section "Auth"
check "root"        GET  /          "200" "" noauth
check "health"      GET  /health    "200" "" noauth
check "register"    POST /auth/register "201" \
  "{\"email\":\"smoke_$rnd@example.com\",\"password\":\"SmokePass123!\",\"full_name\":\"Smoke\",\"organization_name\":\"SmokeOrg_$rnd\"}"
do_req POST /auth/login "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" noauth
# NB: do not use $UID — it is a readonly bash builtin.
TOKEN="$(jqv '.access_token')"; USER_ID="$(jqv '.user.id')"
ORG_ID="$(jqv '.user.organization_id')"; POS="$(jqv '.user.position_id')"
[[ -n "$TOKEN" && "$TOKEN" != "null" ]] && printf "  ${GREEN}PASS${NC} %-6s %-46s ${GREEN}200${NC}  admin login\n" POST /auth/login || { printf "  ${RED}FAIL login — aborting${NC}\n"; exit 1; }
TOTAL=$((TOTAL+1)); PASS=$((PASS+1))
check "me"            GET  /auth/me "200"
check "me (no token)" GET  /auth/me "401" "" noauth
TOKEN_SAVE="$TOKEN"; TOKEN="garbage.token.xyz"; check "me (bad token)" GET /auth/me "401"; TOKEN="$TOKEN_SAVE"
check "refresh (no body) -> 422" POST /auth/refresh "422" "{}" noauth

# ---------------- USERS ----------------
section "Users"
check "list users"        GET  /users/ "200"
check "get user"          GET  "/users/$USER_ID" "200"
check "invalid uuid->422" GET  /users/not-a-uuid "422"
check "create member"     POST /users/ "201" \
  "{\"email\":\"mem_$rnd@example.com\",\"password\":\"MemberPass123!\",\"full_name\":\"Member\",\"role\":\"org_member\"}"
check "create member bad position->400" POST /users/ "400" \
  "{\"email\":\"memx_$rnd@example.com\",\"password\":\"MemberPass123!\",\"position_id\":\"00000000-0000-0000-0000-000000000000\"}"
check "update own profile" PATCH /users/me "200" "{\"full_name\":\"Super Admin One\"}"

# ---------------- ORGANIZATIONS ----------------
section "Organizations"
check "my org"          GET  /orgs/me "200"
check "list departments" GET /orgs/departments "200"
DEPT="$(do_req POST /orgs/departments "{\"name\":\"Dept_$rnd\",\"description\":\"d\"}"; jqv '.data.department.id')"
check "create department" POST /orgs/departments "200|201" "{\"name\":\"DeptB_$rnd\",\"description\":\"d\",\"organization_id\":\"$ORG_ID\"}"

# ---------------- FRAMEWORKS ----------------
section "Frameworks"
do_req GET /frameworks/ ""; FW_ID="$(jqv '.data.frameworks[0].id')"
check "list frameworks"   GET /frameworks/ "200"
check "framework stats"   GET /frameworks/stats "200"
check "framework types"   GET /frameworks/types "200"
check "framework cats"    GET /frameworks/categories "200"
check "framework regions" GET /frameworks/regions "200"
check "available all"     GET /frameworks/available/all "200"
[[ "$FW_ID" != "null" && -n "$FW_ID" ]] && check "get framework" GET "/frameworks/$FW_ID" "200"
check "create framework"        POST /frameworks/ "201" "{\"name\":\"FW_$rnd\",\"framework_type\":\"standard\",\"category\":\"information_security\"}"
check "create framework bad->422" POST /frameworks/ "422" "{\"name\":\"X\"}"

# ---------------- ASSESSMENTS (full flow) ----------------
section "Assessments"
ASMT="$(do_req POST /assessments "{\"name\":\"Smoke Assessment\",\"framework_id\":\"$FW_ID\"}"; jqv '.data.assessment.id // .data.id')"
check "list assessments" GET /assessments "200"
if [[ "$ASMT" != "null" && -n "$ASMT" ]]; then
  check "get assessment" GET "/assessments/$ASMT" "200"
  SESS="$(do_req POST "/assessments/$ASMT/sessions/start" ""; jqv '.data.session.id // .data.session_id')"
  check "start session" POST "/assessments/$ASMT/sessions/start" "200|201"
fi
if [[ "${SESS:-null}" != "null" && -n "${SESS:-}" ]]; then
  check "get session"   GET  "/assessments/sessions/$SESS" "200"
  check "send chat"     POST "/assessments/sessions/$SESS/chat" "200|201" "{\"message_text\":\"What is this about?\"}"
  check "chat history"  GET  "/assessments/sessions/$SESS/chat" "200"
  check "answer (bad question->404)" POST /assessments/answers "404" \
    "{\"session_id\":\"$SESS\",\"question_id\":\"00000000-0000-0000-0000-000000000000\",\"answer_text\":\"x\"}"
  check "complete session" POST "/assessments/sessions/$SESS/complete" "200"
fi

# ---------------- ASSETS ----------------
section "Assets"
check "extract assets" POST /assets/extract "200|201" "{\"message_text\":\"Two Linux servers and a PostgreSQL database.\"}"
check "list assets"    GET  /assets/ "200"
check "asset stats"    GET  /assets/statistics "200"

# ---------------- DASHBOARD ----------------
section "Dashboard"
for p in overview compliance assets risks; do check "dashboard $p" GET "/dashboard/$p" "200"; done

# ---------------- RAG ----------------
section "RAG"
check "rag health"  GET  /rag/health "200" "" noauth
check "rag search"  POST /rag/search "200" "{\"query\":\"access control\",\"top_k\":5}"
check "rag query"   POST /rag/query  "200" "{\"question\":\"What does GDPR require for security?\",\"framework\":\"GDPR\",\"top_k\":5}"
check "rag bad framework->422" POST /rag/query "422" "{\"question\":\"x\",\"framework\":\"NOPE\"}"

# ---------------- PERMISSIONS ----------------
section "Permissions"
check "my permissions"  GET  /permissions/me "200"
check "perm catalog"    GET  /permissions/catalog "200"
check "perm roles"      GET  /permissions/roles "200"
check "user permissions" GET "/permissions/user/$USER_ID" "200"
check "grant"  POST /permissions/grant  "200" "{\"user_id\":\"$USER_ID\",\"permissions\":[\"view_dashboard\"]}"
check "revoke" POST /permissions/revoke "200" "{\"user_id\":\"$USER_ID\",\"permissions\":[\"view_dashboard\"]}"

# ---------------- SUMMARY ----------------
printf "\n${BOLD}============================================================${NC}\n"
if (( FAIL == 0 )); then
  printf "${GREEN}${BOLD}ALL PASSED${NC}  %d/%d checks\n" "$PASS" "$TOTAL"
else
  printf "${RED}${BOLD}%d FAILED${NC} / %d checks\n" "$FAIL" "$TOTAL"
  printf "${RED}Failures:${NC}\n"; for f in "${FAILED[@]}"; do printf "  - %s\n" "$f"; done
fi
exit "$(( FAIL > 0 ? 1 : 0 ))"
