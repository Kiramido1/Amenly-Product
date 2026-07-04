import { describe, test, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../../hooks/useAuth'
import { AuthProvider } from '../../context/AuthContext'
import { clearAccessToken, clearRefreshToken, setAccessToken, setRefreshToken } from '../../api/client'

// Helper to render hook with AuthProvider
const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

describe('useAuth Hook', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('useAuth returns context values', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    // Initial values
    expect(result.current).toHaveProperty('user')
    expect(result.current).toHaveProperty('isAuthenticated')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('login')
    expect(result.current).toHaveProperty('logout')
    expect(result.current).toHaveProperty('register')
  })

  test('useAuth login updates context', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(result.current.isAuthenticated).toBe(false)

    // Perform login
    await act(async () => {
      const loginResult = await result.current.login({
        email: 'admin@first.com',
        password: 'AdminPassword123!'
      })
      expect(loginResult.success).toBe(true)
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).not.toBeNull()
    expect(result.current.user.email).toBe('admin@first.com')
  })

  test('useAuth logout clears context', async () => {
    setAccessToken('test-token')
    setRefreshToken('test-refresh')

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Login first
    await act(async () => {
      await result.current.login({
        email: 'admin@first.com',
        password: 'AdminPassword123!'
      })
    })

    expect(result.current.isAuthenticated).toBe(true)

    // Then logout
    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  test('useAuth throws error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')

    spy.mockRestore()
  })

  test('useAuth returns loading state correctly', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    // Should eventually be not loading
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(result.current.isLoading).toBe(false)
  })

  test('useAuth login with invalid credentials returns error', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    const loginResult = await act(async () => {
      return await result.current.login({
        email: 'wrong@email.com',
        password: 'wrongpass'
      })
    })

    expect(loginResult.success).toBe(false)
    expect(loginResult.message).toBeDefined()
  })

  test('useAuth register creates new user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    const registerResult = await act(async () => {
      return await result.current.register({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        fullName: 'New User',
        organizationName: 'Test Org'
      })
    })

    expect(registerResult.success).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
  })
})
