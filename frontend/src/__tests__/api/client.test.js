import { describe, test, expect, beforeEach, vi } from 'vitest'
import api, { 
  setAccessToken, 
  getAccessToken, 
  clearAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearRefreshToken,
  API_BASE_URL
} from '../../api/client'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

describe('API Client - Interceptors', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('[41] Every request includes Authorization: Bearer {token} header when token is set', async () => {
    setAccessToken('test-token-123')

    let capturedAuth = null
    server.use(
      http.get('http://localhost:8001/api/v1/test', ({ request }) => {
        capturedAuth = request.headers.get('Authorization')
        return HttpResponse.json({ success: true })
      })
    )

    await api.get('/test')

    expect(capturedAuth).toBe('Bearer test-token-123')
  })

  test('[42] Request WITHOUT token (public endpoints) → no Authorization header', async () => {
    clearAccessToken()

    let capturedAuth = 'not-set'
    server.use(
      http.get('http://localhost:8001/api/v1/public', ({ request }) => {
        capturedAuth = request.headers.get('Authorization')
        return HttpResponse.json({ success: true })
      })
    )

    await api.get('/public')

    expect(capturedAuth).toBeNull()
  })

  test('[43] Response 401 → auto-refresh called once → original request retried', async () => {
    setAccessToken('expired-token')
    setRefreshToken('mock-refresh-token-abc')

    let requestCount = 0
    let refreshCalled = false

    server.use(
      http.get('http://localhost:8001/api/v1/protected', ({ request }) => {
        requestCount++
        const auth = request.headers.get('Authorization')
        
        // First request with expired token returns 401
        if (auth === 'Bearer expired-token') {
          return HttpResponse.json(
            { success: false, message: 'Token expired' },
            { status: 401 }
          )
        }
        
        // Retry with new token succeeds
        return HttpResponse.json({ success: true, data: 'protected data' })
      }),
      http.post('http://localhost:8001/api/v1/auth/refresh', () => {
        refreshCalled = true
        return HttpResponse.json({ access_token: 'new-access-token-999' })
      })
    )

    const response = await api.get('/protected')

    expect(refreshCalled).toBe(true)
    expect(requestCount).toBe(2) // Original + retry
    expect(response.data.success).toBe(true)
  })

  test('[44] Response 401 on refresh endpoint itself → no infinite loop → logout', async () => {
    setAccessToken('expired-token')
    setRefreshToken('expired-refresh-token')

    let refreshCallCount = 0

    server.use(
      http.get('http://localhost:8001/api/v1/protected', () => {
        return HttpResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        )
      }),
      http.post('http://localhost:8001/api/v1/auth/refresh', () => {
        refreshCallCount++
        return HttpResponse.json(
          { success: false, message: 'Invalid refresh token' },
          { status: 403 }
        )
      })
    )

    // Mock window.location.href assignment
    const locationAssignSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { href: '', assign: locationAssignSpy, pathname: '/' },
      writable: true
    })

    try {
      await api.get('/protected')
    } catch (error) {
      // Expected to throw after refresh fails
    }

    // Refresh should only be called once (no infinite loop)
    expect(refreshCallCount).toBe(1)
  })
})

describe('API Client - Token Management', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('setAccessToken stores token in memory', () => {
    setAccessToken('my-token')
    expect(getAccessToken()).toBe('my-token')
  })

  test('clearAccessToken removes token from memory', () => {
    setAccessToken('my-token')
    clearAccessToken()
    expect(getAccessToken()).toBeNull()
  })

  test('setRefreshToken stores in sessionStorage', () => {
    setRefreshToken('refresh-token-123')
    expect(sessionStorage.getItem('refresh_token')).toBe('refresh-token-123')
  })

  test('getRefreshToken retrieves from sessionStorage', () => {
    sessionStorage.setItem('refresh_token', 'stored-refresh')
    expect(getRefreshToken()).toBe('stored-refresh')
  })

  test('clearRefreshToken removes from sessionStorage', () => {
    sessionStorage.setItem('refresh_token', 'to-clear')
    clearRefreshToken()
    expect(sessionStorage.getItem('refresh_token')).toBeNull()
  })
})

describe('API Client - Configuration', () => {
  test('API_BASE_URL is configured correctly', () => {
    expect(API_BASE_URL).toBe('http://localhost:8001/api/v1')
  })

  test('axios instance has correct base URL', () => {
    expect(api.defaults.baseURL).toBe('http://localhost:8001/api/v1')
  })

  test('axios instance has Content-Type header', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json')
  })
})


describe('API Client - Token Refresh Flow', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('[10] Token refresh: 401 response → auto-retry with new token → original request succeeds', async () => {
    setAccessToken('expired-token')
    setRefreshToken('valid-refresh-token')

    let requestCount = 0
    let refreshCalled = false

    server.use(
      http.get('http://localhost:8001/api/v1/protected', ({ request }) => {
        requestCount++
        const auth = request.headers.get('Authorization')
        
        // First request with expired token
        if (auth === 'Bearer expired-token') {
          return HttpResponse.json(
            { success: false, message: 'Token expired' },
            { status: 401 }
          )
        }
        
        // Retry with new token
        return HttpResponse.json({ success: true, data: 'protected data' })
      }),
      http.post('http://localhost:8001/api/v1/auth/refresh', () => {
        refreshCalled = true
        return HttpResponse.json({ access_token: 'new-access-token-999' })
      })
    )

    const response = await api.get('/protected')

    expect(refreshCalled).toBe(true)
    expect(requestCount).toBe(2)
    expect(response.data.success).toBe(true)
    expect(getAccessToken()).toBe('new-access-token-999')
  })

  test('[11] Token refresh: refresh token expired → logout user → redirect to /login', async () => {
    setAccessToken('expired-token')
    setRefreshToken('expired-refresh-token')

    // Mock window.location
    const originalLocation = window.location
    delete window.location
    window.location = { href: '', pathname: '/' }

    server.use(
      http.get('http://localhost:8001/api/v1/protected', () => {
        return HttpResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        )
      }),
      http.post('http://localhost:8001/api/v1/auth/refresh', () => {
        return HttpResponse.json(
          { success: false, message: 'Invalid refresh token' },
          { status: 403 }
        )
      })
    )

    try {
      await api.get('/protected')
    } catch (error) {
      // Expected to throw
    }

    // Should have cleared tokens
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
    
    // Should redirect to login
    expect(window.location.href).toBe('/login')

    // Restore location
    window.location = originalLocation
  })
})
