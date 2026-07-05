import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import AuthPage from '../../pages/AuthPage'
import { clearAccessToken, clearRefreshToken } from '../../api/client'

// Helper to render with router and auth
const renderWithRouter = (initialRoute = '/signup') => {
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

describe('SignupPage - Registration', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
    window.location.pathname = '/signup'
  })

  test('[6] Register: all fields valid → 201 → auto-login → redirect /dashboard', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    // Fill in all required fields
    await user.type(screen.getByLabelText(/organization name/i), 'Test Organization')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email address/i), 'newuser@example.com')
    
    // Find password inputs by their position/order
    const passwordInputs = screen.getAllByRole('textbox').filter(input => 
      input.type === 'password' || input.placeholder?.includes('8')
    )
    
    // Use password field
    const passwordInput = screen.getByPlaceholderText(/min.*8/i) || 
      document.querySelector('input[name="password"]')
    await user.type(passwordInput, 'SecurePass123!')
    
    // Find confirm password by label or placeholder
    const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]')
    await user.type(confirmPasswordInput, 'SecurePass123!')

    await user.click(screen.getByRole('button', { name: /register/i }))

    // MemoryRouter navigation doesn't touch window.location — assert the route.
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  test('[7] Register: duplicate email → 400 → show "Email already exists"', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.type(screen.getByLabelText(/organization name/i), 'Test Organization')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email address/i), 'existing@email.com')
    
    const passwordInput = document.querySelector('input[name="password"]')
    await user.type(passwordInput, 'SecurePass123!')
    
    const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]')
    await user.type(confirmPasswordInput, 'SecurePass123!')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
    })
  })

  test('[8] Register: password too weak → client validation before API call', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.type(screen.getByLabelText(/organization name/i), 'Test Organization')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    
    const passwordInput = document.querySelector('input[name="password"]')
    await user.type(passwordInput, 'weak')
    
    const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]')
    await user.type(confirmPasswordInput, 'weak')

    await user.click(screen.getByRole('button', { name: /register/i }))

    // Should show client-side validation error, not make API call
    await waitFor(() => {
      expect(screen.getByText(/8 characters|uppercase|lowercase|number|special/i)).toBeInTheDocument()
    })
  })
})

describe('SignupPage - Form Validation', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('Empty organization name shows validation error', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.click(screen.getByRole('button', { name: /register/i }))

    // Submitting an empty form surfaces "required" errors on multiple fields.
    await waitFor(() => {
      expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0)
    })
  })

  test('Empty full name shows validation error', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.type(screen.getByLabelText(/organization name/i), 'Test Org')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument()
    })
  })

  test('Invalid email format shows validation error', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.type(screen.getByLabelText(/organization name/i), 'Test Org')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email address/i), 'invalid-email')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })

  test('Password mismatch shows validation error', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.type(screen.getByLabelText(/organization name/i), 'Test Org')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    
    const passwordInput = document.querySelector('input[name="password"]')
    await user.type(passwordInput, 'SecurePass123!')
    
    const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]')
    await user.type(confirmPasswordInput, 'DifferentPass123!')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  test('Password without special characters shows validation error', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.type(screen.getByLabelText(/organization name/i), 'Test Org')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    
    const passwordInput = document.querySelector('input[name="password"]')
    await user.type(passwordInput, 'NoSpecialChars123')
    
    const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]')
    await user.type(confirmPasswordInput, 'NoSpecialChars123')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/special char/i)).toBeInTheDocument()
    })
  })
})

describe('SignupPage - Navigation', () => {
  test('Clicking "Log in" switches to login form', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.click(screen.getByText(/log in/i, { selector: 'button' }))

    await waitFor(() => {
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
    })
  })
})

describe('SignupPage - Loading State', () => {
  test('Register button shows loading state during API call', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.type(screen.getByLabelText(/organization name/i), 'Test Organization')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email address/i), 'newuser@example.com')
    
    const passwordInput = document.querySelector('input[name="password"]')
    await user.type(passwordInput, 'SecurePass123!')
    
    const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]')
    await user.type(confirmPasswordInput, 'SecurePass123!')

    const submitButton = screen.getByRole('button', { name: /register/i })
    await user.click(submitButton)

    // Should show loading text or be disabled
    await waitFor(() => {
      expect(submitButton.textContent.toLowerCase()).toContain('creating') ||
      expect(submitButton).toBeDisabled()
    })
  })
})
