import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, AuthContext } from '../../context/AuthContext'
import { setAccessToken, getAccessToken, clearAccessToken, setRefreshToken, getRefreshToken, clearRefreshToken } from '../../api/client'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

// Helper to render with AuthProvider
const renderWithAuth = (ui) => {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  )
}

// Test component to consume context
const ContextConsumer = ({ callback }) => {
  const context = callback()
  return <div data-testid="context-value">{JSON.stringify(context)}</div>
}

describe('AuthContext - Initial State', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('[35] AuthContext initial state: user=null, isAuthenticated=false, isLoading=true', async () => {
    let capturedContext = null
    
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(context) => {
            capturedContext = context
            return <div>Test</div>
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    )

    // Initial state should have isLoading=true before checkAuth completes
    expect(capturedContext.user).toBeNull()
    expect(capturedContext.isAuthenticated).toBe(false)
  })

  test('AuthContext after initialization with no tokens: isLoading=false', async () => {
    renderWithAuth(
      <AuthContext.Consumer>
        {(context) => (
          <div>
            <span data-testid="loading">{context.isLoading.toString()}</span>
            <span data-testid="auth">{context.isAuthenticated.toString()}</span>
          </div>
        )}
      </AuthContext.Consumer>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    expect(screen.getByTestId('auth').textContent).toBe('false')
  })
})

describe('AuthContext - Login', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('[36] AuthContext after login: user populated, isAuthenticated=true, isLoading=false', async () => {
    let contextRef = null

    renderWithAuth(
      <AuthContext.Consumer>
        {(context) => {
          contextRef = context
          return (
            <div>
              <span data-testid="user">{context.user?.email || 'null'}</span>
              <span data-testid="auth">{context.isAuthenticated.toString()}</span>
            </div>
          )
        }}
      </AuthContext.Consumer>
    )

    // Wait for initial load to complete
    await waitFor(() => {
      expect(contextRef.isLoading).toBe(false)
    })

    // Perform login
    await act(async () => {
      const result = await contextRef.login({
        email: 'admin@first.com',
        password: 'AdminPassword123!'
      })
      expect(result.success).toBe(true)
    })

    // Check state after login
    expect(contextRef.user).not.toBeNull()
    expect(contextRef.user.email).toBe('admin@first.com')
    expect(contextRef.isAuthenticated).toBe(true)
    expect(contextRef.isLoading).toBe(false)
  })
})

describe('AuthContext - Token Storage', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('[37] Access token stored in memory (NOT localStorage or sessionStorage)', async () => {
    let contextRef = null

    renderWithAuth(
      <AuthContext.Consumer>
        {(context) => {
          contextRef = context
          return <div>Test</div>
        }}
      </AuthContext.Consumer>
    )

    await waitFor(() => expect(contextRef.isLoading).toBe(false))

    await act(async () => {
      await contextRef.login({
        email: 'admin@first.com',
        password: 'AdminPassword123!'
      })
    })

    // Access token should be in memory
    expect(getAccessToken()).not.toBeNull()
    
    // Access token should NOT be in localStorage
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
    
    // Access token should NOT be in sessionStorage (as access_token)
    expect(sessionStorage.getItem('access_token')).toBeNull()
  })

  test('[38] Refresh token in sessionStorage (survives page refresh)', async () => {
    let contextRef = null

    renderWithAuth(
      <AuthContext.Consumer>
        {(context) => {
          contextRef = context
          return <div>Test</div>
        }}
      </AuthContext.Consumer>
    )

    await waitFor(() => expect(contextRef.isLoading).toBe(false))

    await act(async () => {
      await contextRef.login({
        email: 'admin@first.com',
        password: 'AdminPassword123!'
      })
    })

    // Refresh token should be in sessionStorage
    expect(sessionStorage.getItem('refresh_token')).not.toBeNull()
    expect(getRefreshToken()).toBe('mock-refresh-token-abc')
  })
})

describe('AuthContext - Logout', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('[39] AuthContext after logout: state reset to initial', async () => {
    let contextRef = null

    renderWithAuth(
      <AuthContext.Consumer>
        {(context) => {
          contextRef = context
          return <div>Test</div>
        }}
      </AuthContext.Consumer>
    )

    await waitFor(() => expect(contextRef.isLoading).toBe(false))

    // Login first
    await act(async () => {
      await contextRef.login({
        email: 'admin@first.com',
        password: 'AdminPassword123!'
      })
    })

    expect(contextRef.isAuthenticated).toBe(true)

    // Then logout
    await act(async () => {
      await contextRef.logout()
    })

    expect(contextRef.user).toBeNull()
    expect(contextRef.isAuthenticated).toBe(false)
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })
})

describe('AuthContext - Multiple Consumers', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('[40] Multiple components consuming same context → all update on login', async () => {
    const Component1 = () => (
      <AuthContext.Consumer>
        {(context) => <span data-testid="comp1-auth">{context.isAuthenticated.toString()}</span>}
      </AuthContext.Consumer>
    )

    const Component2 = () => (
      <AuthContext.Consumer>
        {(context) => <span data-testid="comp2-auth">{context.isAuthenticated.toString()}</span>}
      </AuthContext.Consumer>
    )

    let loginFn = null

    const LoginComponent = () => (
      <AuthContext.Consumer>
        {(context) => {
          loginFn = context.login
          return <button onClick={() => context.login({ email: 'admin@first.com', password: 'AdminPassword123!' })}>Login</button>
        }}
      </AuthContext.Consumer>
    )

    renderWithAuth(
      <>
        <Component1 />
        <Component2 />
        <LoginComponent />
      </>
    )

    // Initially both should show false
    expect(screen.getByTestId('comp1-auth').textContent).toBe('false')
    expect(screen.getByTestId('comp2-auth').textContent).toBe('false')

    // Click login
    await act(async () => {
      screen.getByText('Login').click()
    })

    // Both should update to true
    await waitFor(() => {
      expect(screen.getByTestId('comp1-auth').textContent).toBe('true')
      expect(screen.getByTestId('comp2-auth').textContent).toBe('true')
    })
  })
})

describe('AuthContext - Register', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('Register with valid data sets user and isAuthenticated', async () => {
    let contextRef = null

    renderWithAuth(
      <AuthContext.Consumer>
        {(context) => {
          contextRef = context
          return <div>Test</div>
        }}
      </AuthContext.Consumer>
    )

    await waitFor(() => expect(contextRef.isLoading).toBe(false))

    const result = await act(async () => {
      return await contextRef.register({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        fullName: 'New User',
        organizationName: 'Test Org'
      })
    })

    expect(result.success).toBe(true)
    expect(contextRef.isAuthenticated).toBe(true)
  })
})
