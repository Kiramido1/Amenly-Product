import { http, HttpResponse } from 'msw'

// Minimal org handler so the post-login admin flow (getMyOrganization) resolves
// instead of hitting an unhandled request. A completed profile routes admins to
// /dashboard (rather than the onboarding chat).
export const orgHandlers = [
  http.get('http://localhost:8001/api/v1/orgs/me', () =>
    HttpResponse.json({
      success: true,
      message: 'ok',
      data: {
        organization: {
          id: 'org-1',
          name: 'Test Org',
          profile_completed: true,
          invite_code: 'TESTCODE',
          departments: [],
        },
      },
    })
  ),
]
