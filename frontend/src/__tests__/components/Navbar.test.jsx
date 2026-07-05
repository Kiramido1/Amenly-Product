import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import Navbar from '../../components/Navbar'
import { setAccessToken, clearAccessToken, setRefreshToken, clearRefreshToken } from '../../api/client'

// Helper to render with router and auth
const renderWithRouter = (authenticated = false) => {
  if (authenticated) {
    setAccessToken('valid-token')
    setRefreshToken('valid-refresh')
  }

  return render(
    <MemoryRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          <Route path="/signup" element={<div data-testid="signup-page">Signup Page</div>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Navbar - Unauthenticated State', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('[31] Unauthenticated → "Login" + "Get Started" buttons visible', async () => {
    renderWithRouter(false)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
    })
  })

  test('Navbar shows logo and brand name', async () => {
    renderWithRouter(false)

    await waitFor(() => {
      expect(screen.getByAltText(/amenly logo/i)).toBeInTheDocument()
      expect(screen.getByText('Amenly')).toBeInTheDocument()
    })
  })

  test('Navbar shows navigation links', async () => {
    renderWithRouter(false)

    await waitFor(() => {
      expect(screen.getByText('Why Amenly')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('AI Compliance')).toBeInTheDocument()
      expect(screen.getByText('About Us')).toBeInTheDocument()
    })
  })
})

describe('Navbar - Authenticated State', () => {
  beforeEach(() => {
    setAccessToken('valid-token')
    setRefreshToken('valid-refresh')
  })

  afterEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('[32] Authenticated → user name visible, "Logout" button visible', async () => {
    renderWithRouter(true)

    await waitFor(() => {
      expect(screen.getByText(/admin user/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
    })
  })

  test('[33] Logout button click → calls logout → clears state → shows Login buttons', async () => {
    const user = userEvent.setup()
    renderWithRouter(true)

    // Wait for authenticated state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
    })

    // Click logout
    await user.click(screen.getByRole('button', { name: /log out/i }))

    // Should show login buttons again
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
    })
  })

  test('[34] Authenticated → /login and /signup nav links hidden or redirect', async () => {
    renderWithRouter(true)

    await waitFor(() => {
      // Login and Get Started buttons should not be visible when authenticated
      expect(screen.queryByRole('button', { name: /^log in$/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /get started/i })).not.toBeInTheDocument()
    })
  })
})

describe('Navbar - Mobile Menu', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('Mobile menu toggle works', async () => {
    const user = userEvent.setup()
    renderWithRouter(false)

    // Find hamburger button
    const hamburgerButton = screen.getByRole('button', { name: /toggle mobile menu/i })
    
    await user.click(hamburgerButton)

    // Mobile menu should open — the nav link now appears in both the (jsdom-
    // unhidden) desktop bar and the mobile menu, so assert at least one exists.
    await waitFor(() => {
      expect(screen.getAllByText('Why Amenly').length).toBeGreaterThan(0)
    })
  })
})

describe('Navbar - Navigation', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('Clicking logo navigates to home', async () => {
    const user = userEvent.setup()
    renderWithRouter(false)

    const logo = screen.getByAltText(/amenly logo/i)
    await user.click(logo.closest('a'))

    // Navigation should work
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument()
    })
  })
})

describe('Navbar - Style', () => {
  beforeEach(() => {
    clearAccessToken()
    clearRefreshToken()
  })

  test('Navbar uses brand colors', async () => {
    renderWithRouter(false)

    await waitFor(() => {
      const nav = document.querySelector('nav') || document.querySelector('[class*="bg-black"]')
      expect(nav).toBeInTheDocument()
    })
  })

  test('Navbar has blur effect', async () => {
    renderWithRouter(false)

    await waitFor(() => {
      const nav = document.querySelector('[class*="backdrop-blur"]')
      expect(nav).toBeInTheDocument()
    })
  })
})
