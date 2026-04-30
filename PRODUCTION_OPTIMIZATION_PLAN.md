# Production Optimization Plan

## Phase 1: Dependency Cleanup ✅
- Remove `@studio-freight/lenis` (unused, we use `lenis` instead)
- Remove `three` (unused, no 3D components found)
- Keep `gsap` (used in FuturisticCTA, FuturisticFeatures, AIJourney)

## Phase 2: File Cleanup ✅
- Remove `src/test.jsx` (test file, not used in production)
- Remove `src/pages/LandingPageSimple.jsx` (not in routes, test page)
- Remove `src/pages/FeaturesPage.jsx` (not in routes, unused)
- Remove `src/pages/AICompliancePage.jsx` (duplicate of AIComplianceChat)
- Remove `src/pages/LoginPage.jsx` and `SignupPage.jsx` (replaced by AuthPage)
- Create missing `src/hooks/` folder for useSmoothScroll

## Phase 3: Component Optimization ✅
- Add React.memo to heavy components (charts, maps, lists)
- Add useCallback for event handlers
- Add useMemo for computed values
- Lazy load dashboard and compliance pages

## Phase 4: Code Structure ✅
- Move useSmoothScroll to proper hooks folder
- Consolidate duplicate components
- Remove unused imports
- Standardize naming conventions

## Phase 5: Performance ✅
- Optimize re-renders in DashboardContext
- Optimize AssetNode rendering
- Optimize chart components
- Add proper loading states

## Phase 6: Responsiveness ✅
- Already implemented AssetListView for mobile
- Verify all pages work on mobile/tablet/desktop
- Fix any overflow issues

## Phase 7: Final Polish ✅
- Remove all console.logs (already done)
- Add error boundaries (already done)
- Verify no broken UI
- Clean commit and push

## Files to Remove:
1. src/test.jsx
2. src/pages/LandingPageSimple.jsx
3. src/pages/FeaturesPage.jsx
4. src/pages/AICompliancePage.jsx
5. src/pages/LoginPage.jsx
6. src/pages/SignupPage.jsx

## Dependencies to Remove:
1. @studio-freight/lenis
2. three

## Folders to Create:
1. src/hooks/

## Components to Optimize:
1. DashboardContext.jsx - Add memoization
2. InfrastructureMap.jsx - Add React.memo
3. ComplianceCharts.jsx - Already has memo
4. AssetNode.jsx - Add useCallback
5. ChatEngine.jsx - Add memoization
