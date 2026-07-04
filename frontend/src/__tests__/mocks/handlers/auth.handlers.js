import { http, HttpResponse, delay } from 'msw'
import { validUser, newUser, expiredRefreshToken } from '../fixtures/user.fixture'

export const authHandlers = [
  // POST /api/v1/auth/login
  http.post('http://localhost:8001/api/v1/auth/login', async ({ request }) => {
    const body = await request.json()
    const { email, password } = body

    // Simulate network delay for loading state tests
    if (email === 'slow@user.com') {
      await delay(1000)
    }

    // Valid credentials
    if (email === 'admin@first.com' && password === 'AdminPassword123!') {
      return HttpResponse.json({
        access_token: 'mock-access-token-xyz',
        refresh_token: 'mock-refresh-token-abc',
        token_type: 'bearer',
        user: validUser
      })
    }

    // Invalid credentials
    if (email === 'wrong@email.com' || password === 'wrongpass') {
      return HttpResponse.json({
        success: false,
        message: 'Invalid credentials'
      }, { status: 401 })
    }

    // Validation error (invalid email format)
    if (email && !email.includes('@')) {
      return HttpResponse.json({
        success: false,
        message: 'Validation error',
        errors: [{ field: 'email', message: 'Enter a valid email' }]
      }, { status: 422 })
    }

    // Default: invalid credentials
    return HttpResponse.json({
      success: false,
      message: 'Invalid credentials'
    }, { status: 401 })
  }),

  // POST /api/v1/auth/register
  http.post('http://localhost:8001/api/v1/auth/register', async ({ request }) => {
    const body = await request.json()
    const { email, password, full_name, organization_name } = body

    // Duplicate email
    if (email === 'existing@email.com') {
      return HttpResponse.json({
        success: false,
        message: 'Email already exists'
      }, { status: 400 })
    }

    // Successful registration
    return HttpResponse.json({
      success: true,
      data: {
        access_token: 'mock-access-token-new',
        refresh_token: 'mock-refresh-token-new',
        user: {
          ...newUser,
          email,
          full_name,
          organization_id: 'org-new'
        }
      }
    }, { status: 201 })
  }),

  // POST /api/v1/auth/refresh
  http.post('http://localhost:8001/api/v1/auth/refresh', async ({ request }) => {
    const body = await request.json()
    const { refresh_token } = body

    // Expired or invalid refresh token
    if (refresh_token === 'expired-refresh-token' || refresh_token === expiredRefreshToken) {
      return HttpResponse.json({
        success: false,
        message: 'Invalid refresh token'
      }, { status: 403 })
    }

    // Successful refresh
    return HttpResponse.json({
      access_token: 'new-access-token-999'
    })
  }),

  // POST /api/v1/auth/logout
  http.post('http://localhost:8001/api/v1/auth/logout', () => {
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  }),

  // GET /api/v1/auth/me
  http.get('http://localhost:8001/api/v1/auth/me', async ({ request }) => {
    const auth = request.headers.get('Authorization')

    // No token or invalid token
    if (!auth || auth === 'Bearer invalid-token' || auth === 'Bearer expired-token') {
      return HttpResponse.json({
        success: false,
        message: 'Could not validate credentials'
      }, { status: 403 })
    }

    // Valid token - return user data
    return HttpResponse.json({
      success: true,
      data: {
        user: validUser
      }
    })
  }),
]
