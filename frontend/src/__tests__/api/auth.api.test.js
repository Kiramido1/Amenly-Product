import { describe, test, expect, beforeEach, vi } from 'vitest'
import * as authApi from '../../api/auth'
import { setAccessToken, getAccessToken, clearAccessToken, setRefreshToken, getRefreshToken, clearRefreshToken } from '../../api/client'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

describe('Auth API - Login', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('login with valid credentials returns user data and sets tokens', async () => {
    const result = await authApi.login({
      email: 'admin@first.com',
      password: 'AdminPassword123!'
    })

    expect(result).toHaveProperty('access_token')
    expect(result).toHaveProperty('refresh_token')
    expect(result).toHaveProperty('user')
    expect(result.user.email).toBe('admin@first.com')
    expect(getAccessToken()).toBe('mock-access-token-xyz')
  })

  test('login with invalid credentials throws error with message', async () => {
    await expect(authApi.login({
      email: 'wrong@email.com',
      password: 'wrongpass'
    })).rejects.toThrow()
  })

  test('login sets refresh token in sessionStorage', async () => {
    await authApi.login({
      email: 'admin@first.com',
      password: 'AdminPassword123!'
    })

    expect(getRefreshToken()).toBe('mock-refresh-token-abc')
  })
})

describe('Auth API - Register', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('register with valid data returns user and tokens', async () => {
    const result = await authApi.register({
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      fullName: 'New User',
      organizationName: 'Test Org'
    })

    expect(result.success).toBe(true)
    expect(result.data).toHaveProperty('user')
    expect(result.data).toHaveProperty('access_token')
  })

  test('register with duplicate email returns error', async () => {
    await expect(authApi.register({
      email: 'existing@email.com',
      password: 'SecurePass123!',
      fullName: 'Test User',
      organizationName: 'Test Org'
    })).rejects.toThrow()
  })
})

describe('Auth API - Logout', () => {
  beforeEach(() => {
    setAccessToken('test-token')
    setRefreshToken('test-refresh')
  })

  test('logout clears tokens', async () => {
    await authApi.logout()

    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  test('logout calls API endpoint', async () => {
    let logoutCalled = false
    server.use(
      http.post('http://localhost:8001/api/v1/auth/logout', () => {
        logoutCalled = true
        return HttpResponse.json({ success: true, message: 'Logged out' })
      })
    )

    await authApi.logout()

    expect(logoutCalled).toBe(true)
  })

  test('logout clears tokens even if API fails', async () => {
    server.use(
      http.post('http://localhost:8001/api/v1/auth/logout', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 })
      })
    )

    await authApi.logout()

    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })
})

describe('Auth API - Refresh', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('refresh with valid token returns new access token', async () => {
    setRefreshToken('valid-refresh-token')

    const result = await authApi.refresh()

    expect(result).toHaveProperty('access_token')
  })

  test('refresh without token throws error', async () => {
    await expect(authApi.refresh()).rejects.toThrow('No refresh token available')
  })

  test('refresh with expired token throws error', async () => {
    setRefreshToken('expired-refresh-token')

    await expect(authApi.refresh()).rejects.toThrow()
  })
})

describe('Auth API - Me', () => {
  beforeEach(() => {
    clearAccessToken()
  })

  test('me with valid token returns user data', async () => {
    setAccessToken('valid-token')

    const result = await authApi.me()

    expect(result.success).toBe(true)
    expect(result.data).toHaveProperty('user')
  })

  test('me without token returns error', async () => {
    await expect(authApi.me()).rejects.toThrow()
  })
})
