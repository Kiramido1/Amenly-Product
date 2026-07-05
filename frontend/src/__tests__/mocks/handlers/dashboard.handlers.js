import { http, HttpResponse } from 'msw'

const base = 'http://localhost:8001/api/v1'

// Minimal dashboard data so DashboardContext resolves and the page renders its
// (glass) components instead of staying on the loading spinner.
export const dashboardHandlers = [
  http.get(`${base}/dashboard/overview`, () =>
    HttpResponse.json({
      success: true,
      message: 'ok',
      data: {
        stats: {
          total_assessments: 4, completed_assessments: 3, avg_compliance_score: 72,
          total_assets: 12, total_risks: 5, active_frameworks: 3,
        },
        frameworks: [{ id: '1', name: 'ISO 27001', version: '2022', category: 'information_security' }],
        organization: { id: 'org-1', name: 'Test Org', domain: 'test.co' },
        user_role: 'org_admin',
      },
    })
  ),
  http.get(`${base}/dashboard/compliance`, () =>
    HttpResponse.json({
      success: true, message: 'ok',
      data: {
        organization_compliance_score: 72, total_assessments: 4, scored_assessments: 3,
        framework_scores: { 'ISO 27001': 72 }, assessments: [],
      },
    })
  ),
  http.get(`${base}/dashboard/assets`, () =>
    HttpResponse.json({
      success: true, message: 'ok',
      data: { total_assets: 12, assets_by_type: {}, assets_by_criticality: {}, assets: [] },
    })
  ),
  http.get(`${base}/dashboard/risks`, () =>
    HttpResponse.json({
      success: true, message: 'ok',
      data: { total_risks: 5, high_impact_risks: 1, risks_by_severity: {}, risks: [] },
    })
  ),
]
