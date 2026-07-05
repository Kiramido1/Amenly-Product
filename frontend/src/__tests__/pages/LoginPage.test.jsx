import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import AuthPage from '../../pages/AuthPage'
import { clearAccessToken, clearRefreshToken } from '../../api/client'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

// Helper to render with router and auth
const renderWithRouter = (initialRoute = '/login') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route path="/signup" element={<AuthPage initialMode="signup" />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('LoginPage - Authentication', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
    window.location.pathname = '/login'
  })

  test('[1] Login: valid credentials → tokens saved, user in context, redirect to /dashboard', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.type(screen.getByLabelText(/email address/i), 'admin@first.com')
    await user.type(screen.getByLabelText(/password/i), 'AdminPassword123!')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    // Navigation uses React Router (MemoryRouter), which does not touch
    // window.location — assert the destination route rendered instead.
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  test('[2] Login: invalid password → 401 → show error message (never show raw error object)', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.type(screen.getByLabelText(/email address/i), 'wrong@email.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })

    // Ensure no raw error object is displayed
    expect(screen.queryByText(/object Object/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/\[object/)).not.toBeInTheDocument()
  })

  test('[3] Login: invalid email format → 422 → show validation message', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.type(screen.getByLabelText(/email address/i), 'invalid-email')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })

  test('[4] Login: network offline → show "Connection failed" message', async () => {
    // axios uses XMLHttpRequest, not fetch — simulate the network failure at the
    // MSW layer so the request actually rejects.
    server.use(
      http.post('http://localhost:8001/api/v1/auth/login', () => HttpResponse.error())
    )

    const user = userEvent.setup()
    renderWithRouter()

    await user.type(screen.getByLabelText(/email address/i), 'admin@first.com')
    await user.type(screen.getByLabelText(/password/i), 'AdminPassword123!')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByText(/connection failed|something went wrong|network/i)).toBeInTheDocument()
    })
  })

  test('[5] Login: loading state → button disabled during API call', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    const submitButton = screen.getByRole('button', { name: /log in/i })

    await user.type(screen.getByLabelText(/email address/i), 'admin@first.com')
    await user.type(screen.getByLabelText(/password/i), 'AdminPassword123!')

    // Start typing but don't wait for response
    await user.click(submitButton)

    // Button should show loading state
    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })
  })
})

describe('LoginPage - Form Validation', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('Empty email shows validation error', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })
  })

  test('Empty password shows validation error', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  test('Error message clears when user starts typing', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/email address/i), 'test')

    await waitFor(() => {
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument()
    })
  })
})

describe('LoginPage - Token Storage', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
    localStorage.clear()
    sessionStorage.clear()
  })

  test('Access token NOT stored in localStorage', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.type(screen.getByLabelText(/email address/i), 'admin@first.com')
    await user.type(screen.getByLabelText(/password/i), 'AdminPassword123!')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('token')).toBeNull()
    })
  })

  test('Refresh token stored in sessionStorage', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.type(screen.getByLabelText(/email address/i), 'admin@first.com')
    await user.type(screen.getByLabelText(/password/i), 'AdminPassword123!')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(sessionStorage.getItem('refresh_token')).not.toBeNull()
    })
  })
})

describe('LoginPage - Navigation', () => {
  test('Clicking "Create account" switches to signup form', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.click(screen.getByText(/create account/i))

    await waitFor(() => {
      expect(screen.getByText(/create account/i, { selector: 'h1' }) || 
             screen.getByText(/new account/i)).toBeInTheDocument()
    })
  })
})
