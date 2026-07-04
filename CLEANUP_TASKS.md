# Amenly Platform - Cleanup & Fix Priority List

## IMMEDIATE ACTIONS (Do These First)

### 1. Remove Mock Data Files
These are actively blocking real API integration:

```bash
# Files to DELETE
rm frontend/src/data/mockAssets.js
rm frontend/src/data/mockCompliance.js
rm frontend/src/data/mockRegulations.js
```

**Components that will break and need fixing after deletion:**
- `frontend/src/components/dashboard/StatsCards.jsx` (Line 3)
- `frontend/src/components/dashboard/ComplianceCharts.jsx` (Line 8)
- `frontend/src/components/dashboard/RegulationTracker.jsx` (Line 3)
- `frontend/src/components/dashboard/AssetListView.jsx` (Line 3)
- `frontend/src/components/dashboard/AssetDetailPanel.jsx` (Line 4)
- `frontend/src/components/dashboard/AssetNode.jsx` (Line 4)
- `frontend/src/components/dashboard/InfrastructureMap.jsx` (Line 3)

### 2. Create Missing API Endpoints (Backend)

**Priority Order:**

#### A. Asset Management Endpoints
```python
# File: backend/app/assets/router.py (create if doesn't exist)
GET  /assets/              # List all organization assets
GET  /assets/{asset_id}    # Get single asset
POST /assets/              # Create asset
PUT  /assets/{asset_id}    # Update asset
DELETE /assets/{asset_id}  # Delete asset
```

**Response format should match:**
```json
{
  "success": true,
  "message": "Assets retrieved",
  "data": {
    "assets": [
      {
        "id": "uuid",
        "name": "string",
        "type": "server|firewall|workstation|router|cloud",
        "risk_score": 0-100,
        "compliance_score": 0-100,
        "status": "secure|warning|critical",
        "vulnerabilities": [],
        "department": "string",
        "organization_id": "uuid"
      }
    ],
    "total": 24
  }
}
```

#### B. Regulations Endpoint
```python
# File: backend/app/frameworks/router.py (add endpoint)
GET /frameworks/{id}/regulations  # Get regulations for framework
```

#### C. Compliance Scoring
```python
# File: backend/app/assessments/router.py (add endpoint)
GET /assessments/{id}/compliance-score  # Calculate assessment compliance %
GET /frameworks/{id}/compliance-score   # Overall framework compliance %
```

### 3. Implement Asset Extraction in WebSocket

**File:** [backend/app/websocket/router.py](backend/app/websocket/router.py)

**Add after line 223 (after AI response generated):**

```python
# Extract infrastructure assets from the AI response
try:
    extracted_assets = await asset_service.extract_assets_from_message(
        message_text=ai_response.data.answer if ai_response else message_text,
        organization_id=current_user.organization_id,
        session_id=session_id,
        message_id=ai_message.id,
    )
    
    # Broadcast extracted assets to client
    if extracted_assets:
        await manager.broadcast(
            str(session_id),
            {
                "type": "assets_extracted",
                "assets": [asset.dict() for asset in extracted_assets],
            },
        )
except Exception as e:
    logger.error("asset_extraction_error", error=str(e))
    # Don't fail chat on extraction error
```

### 4. Update Dashboard Components

**Replace imports** in these files:

#### StatsCards.jsx
```javascript
// BEFORE:
import { summaryStats, frameworkScores } from '../../data/mockCompliance'

// AFTER:
import { getDashboardOverview } from '../../api/dashboard'
// In component: fetch from getDashboardOverview() instead
```

#### ComplianceCharts.jsx
```javascript
// BEFORE:
import { compliancePieData, departmentCompliance, riskTrend } from '../../data/mockCompliance'

// AFTER:
import { getComplianceDashboard } from '../../api/dashboard'
// In component: fetch from API
```

#### AssetListView.jsx
```javascript
// BEFORE:
import { assets, ASSET_TYPE_META, STATUS_META } from '../../data/mockAssets'

// AFTER:
import { getAssetsDashboard } from '../../api/dashboard'
// Keep metadata from API response or define locally
```

#### InfrastructureMap.jsx
```javascript
// BEFORE:
import { ASSET_TYPE_META } from '../../data/mockAssets'

// AFTER:
import { getAssetsDashboard } from '../../api/dashboard'
// Grid positions should be calculated or come from API
```

---

## SECOND PRIORITY (Do After Cleanup)

### 5. Implement PermissionsPage UI

**File:** [frontend/src/pages/PermissionsPage.jsx](frontend/src/pages/PermissionsPage.jsx)

**Should have:**
- Table of users with their roles
- Column for custom permissions
- "Grant Permission" button
- "Revoke Permission" button
- API integration with:
  - `GET /permissions/` - List all available permissions
  - `GET /users/` - List organization users
  - `POST /permissions/grant` - Grant permission
  - `POST /permissions/revoke` - Revoke permission

### 6. Clean Up Console.logs & Debug Code

**Files with debug output:**

1. [frontend/src/hooks/useWebSocket.js](frontend/src/hooks/useWebSocket.js)
   - Remove: `console.log('WebSocket connected:', data)` (Line ~30)
   - Remove: `console.error('Failed to parse...', error)` (Line ~43)
   - Remove: `console.error('WebSocket error:', error)` (Line ~60)

2. [frontend/src/components/compliance/ChatBox.jsx](frontend/src/components/compliance/ChatBox.jsx)
   - Remove debug message logging if present

3. [backend/app/websocket/router.py](backend/app/websocket/router.py)
   - Replace generic logging with structured logging (already done)

### 7. Enable Asset Extraction Display

**In ChatBox or AIComplianceChat component:**

```javascript
// Listen for assets_extracted message
const handleAssetsExtracted = (assets) => {
  // Show notification: "Extracted X infrastructure assets"
  // Update infrastructure map with new assets
  setAssets(prev => [...prev, ...assets])
}

// In useWebSocket hook:
useWebSocket(sessionId, 
  onMessage={handleMessages},
  onAssetExtracted={handleAssetsExtracted}  // Add this
)
```

### 8. Remove Risks Router Placeholder

**Files to delete/consolidate:**
- [backend/app/risks/](backend/app/risks/) - Empty module, not in router

**Action:** Remove or fully implement with:
```python
# backend/app/risks/router.py
GET /risks/
POST /risks/
PUT /risks/{id}
DELETE /risks/{id}
```

---

## THIRD PRIORITY (Polish & Optimization)

### 9. Implement Missing Compliance Scoring

**Endpoint to create:**
```python
@router.get("/assessments/{assessment_id}/compliance-score")
async def get_assessment_compliance_score(
    assessment_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> GenericResponse:
    """Calculate overall compliance score for assessment"""
    # Get all answers for this assessment
    # Calculate average compliance_score
    # Return overall score + breakdown by control
```

### 10. Add RAG Health Check to Frontend

**In DashboardPage or dashboard context:**

```javascript
const checkRAGHealth = async () => {
  try {
    const health = await getRagHealth()
    if (!health.healthy) {
      setWarning("RAG system degraded - responses may be limited")
    }
  } catch (err) {
    setWarning("RAG system unavailable - chat may not work")
  }
}
```

### 11. Implement Streaming Responses (Optional)

**For long RAG answers:**
- Use Server-Sent Events (SSE) instead of single response
- Backend: Yield chunks as they're generated
- Frontend: Display streaming text with proper animation

### 12. Add Audit Logging

**Needed for:**
- Permission grants/revokes
- Assessment completions
- Sensitive data access

**Endpoint:**
```python
GET /audit/logs?resource_type=permission|assessment&date_range=...
```

---

## CRITICAL BUG FIXES

### Bug #1: Asset Extraction Never Saves to DB
**Status:** 🔴 Critical
**Location:** [backend/app/websocket/router.py](backend/app/websocket/router.py)
**Issue:** `extract_assets_from_message()` returns assets but they're never persisted
**Fix:** After extraction, save to database via `db.add()` + `db.commit()`

### Bug #2: Assessment Scores Always NULL
**Status:** 🔴 Critical
**Location:** [backend/app/assessments/service.py](backend/app/assessments/service.py)
**Issue:** `compliance_score` field in AssessmentAnswer never calculated
**Fix:** Implement scoring logic when answer is saved

### Bug #3: Dashboard Components Show Hardcoded Data
**Status:** 🔴 Critical
**Location:** All dashboard components (7 files)
**Issue:** Components import and display mockAssets instead of calling APIs
**Fix:** Replace all mock imports with API calls

### Bug #4: WebSocket Reconnection Fails Silently
**Status:** 🟡 High
**Location:** [frontend/src/hooks/useWebSocket.js](frontend/src/hooks/useWebSocket.js)
**Issue:** Max reconnect attempts = 5, then user is stuck without notification
**Fix:** Show toast/modal when max attempts reached, offer manual reconnect button

### Bug #5: RAG Context Includes Old Framework Data
**Status:** 🟡 High
**Location:** [backend/app/ai/rag/rag_service.py](backend/app/ai/rag/rag_service.py)
**Issue:** Qdrant might have stale documents if re-indexed
**Fix:** Implement cache-busting or versioning for ingested documents

---

## VERIFICATION CHECKLIST

After making these changes, verify:

```bash
# 1. Mock data files are removed
[ ] ls frontend/src/data/mock* → Should show no matches

# 2. Dashboard loads without errors
[ ] npm run dev → Visit /dashboard
[ ] Check browser console for import errors

# 3. Assets endpoint works
[ ] curl http://localhost:8001/api/v1/assets
[ ] Returns { success, data: { assets: [...] } }

# 4. Assessment chat still works
[ ] Create assessment
[ ] Start session
[ ] Send message
[ ] Receive AI response
[ ] Check for assets_extracted message

# 5. Permissions page renders
[ ] Navigate to /permissions
[ ] Should show user table (or placeholder)
[ ] No import errors

# 6. No console.logs in production
[ ] npm run build
[ ] Check dist/ has no debug code
```

---

## ESTIMATED TIME

| Task | Est. Time | Difficulty |
|------|-----------|------------|
| Remove mock files | 5 min | Easy |
| Create /assets/ endpoints | 30 min | Medium |
| Fix dashboard components | 45 min | Medium |
| Asset extraction to DB | 30 min | Medium |
| PermissionsPage UI | 60 min | Hard |
| Compliance scoring | 45 min | Medium |
| Testing & verification | 60 min | Hard |
| **TOTAL** | **~4 hours** | - |

---

## RECOMMENDED COMMIT MESSAGES

```git
# Commit 1
Remove hardcoded mock data files (mockAssets, mockCompliance, mockRegulations)

# Commit 2
Add /assets/ API endpoints and database integration

# Commit 3
Update dashboard components to use real API data

# Commit 4
Implement asset extraction and persistence in WebSocket handler

# Commit 5
Create PermissionsPage admin UI

# Commit 6
Add compliance score calculation endpoint

# Commit 7
Remove console.logs and debug code
```

---

## RESOURCES & REFERENCES

- **Backend Testing:** `make test` or `pytest backend/tests/`
- **API Docs:** Visit `http://localhost:8001/api/v1/openapi.json` after running backend
- **Database:** Run `make db-reset` to reset to clean state
- **Frontend Dev:** `npm run dev` in frontend/ directory

---

**Generated:** May 12, 2026  
**For:** Amenly Grad Project - Phase 2 Refactor
