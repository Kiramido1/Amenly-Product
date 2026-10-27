# Amenly GRC — Postman collection

Ready-to-run API collection for the Amenly GRC platform.

## Files
- `Amenly_GRC_API.postman_collection.json` — the collection (30+ requests, test scripts, variable chaining, negative tests).
- `Amenly_Local.postman_environment.json` — optional environment (the collection already ships with working defaults, so this is only for overriding host/credentials).

## Run in the Postman app
1. **Import** the collection (and optionally the environment).
2. Start the backend: `cd backend && .venv/bin/python -m uvicorn app.main:app --port 8001`.
3. Open the collection → **Run** (Collection Runner). Requests execute top-to-bottom; login saves the token and later requests chain `orgId → frameworkId → assessmentId → sessionId → questionId` automatically.

Default credentials (edit in **Collection Variables** if needed):
`admin@zedny.com` / `Test@1234` (admin), `it@zedny.com` / `Test@1234` (member).

## Run headless with Newman (CI-friendly)
```bash
# whole collection
npx newman run postman/Amenly_GRC_API.postman_collection.json \
  --env-var "host=http://localhost:8001"

# read-only subset (no data writes), e.g. for a smoke test
npx newman run postman/Amenly_GRC_API.postman_collection.json \
  --folder "6. Dashboard (Admin)" --folder "7. Infrastructure & Vulnerabilities" \
  --folder "8. Access control (negative tests)" \
  --env-var "host=http://localhost:8001"
```

## Folders
| # | Folder | What it covers |
|---|--------|----------------|
| 0 | Health | liveness probe |
| 1 | Auth | register, login (admin+member), refresh, me |
| 2 | Organization | org profile, departments, join requests |
| 3 | Frameworks | list frameworks |
| 4 | Assessments (Admin) | create/list/get, overview (before/after), sessions, launch |
| 5 | Assessment Session (Member) | start session, submit AI-evaluated answer, chat history |
| 6 | Dashboard (Admin) | overview, compliance (region + regulation), assets, risks |
| 7 | Infrastructure & Vulnerabilities | map, vulnerabilities, statistics, NVD scan |
| 8 | Access control (negative tests) | 401 unauthenticated, 403 member-on-admin, invalid login |

## Notes
- Collection auth is `Bearer {{accessToken}}` (admin); member requests override with `{{memberToken}}`.
- Requests marked *slow* invoke the LLM (`Submit answer`) or NVD (`Scan`) and take several seconds.
- The live interview is a **WebSocket** (`/ws/assessments/{sessionId}/chat?token=...`); open it with Postman's WebSocket request type — the REST endpoints here cover everything else.
- Requests that write data (`Register`, `Create assessment`, `Launch`, `Submit answer`, `Scan`) mutate state; skip them for a pure read-only smoke run.
