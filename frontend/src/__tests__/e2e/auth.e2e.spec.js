import { test, expect } from '@playwright/test'

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173')
  })

  test('[1] full login to dashboard flow', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login')

    // Wait for page to load
    await expect(page.locator('text=Welcome Back')).toBeVisible()

    // Fill in credentials
    await page.fill('input[type="email"]', 'admin@first.com')
    await page.fill('input[type="password"]', 'AdminPassword123!')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })

    // Should show user name in navbar
    await expect(page.locator('text=Admin User')).toBeVisible()
  })

  test('[2] login with invalid credentials shows error', async ({ page }) => {
    await page.goto('http://localhost:5173/login')

    await page.fill('input[type="email"]', 'wrong@email.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=/invalid credentials/i')).toBeVisible({ timeout: 5000 })
  })

  test('[3] login with invalid email format shows validation error', async ({ page }) => {
    await page.goto('http://localhost:5173/login')

    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[type="password"]', 'somepassword')
    await page.click('button[type="submit"]')

    // Should show validation error
    await expect(page.locator('text=/valid email/i')).toBeVisible()
  })

  test('[5] login button is disabled during API call', async ({ page }) => {
    await page.goto('http://localhost:5173/login')

    await page.fill('input[type="email"]', 'admin@first.com')
    await page.fill('input[type="password"]', 'AdminPassword123!')

    // Click and immediately check button state
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Button should be disabled during loading
    await expect(submitButton).toBeDisabled()
  })

  test('[6] registration flow with valid data', async ({ page }) => {
    await page.goto('http://localhost:5173/signup')

    // Wait for page to load
    await expect(page.locator('text=Create Account')).toBeVisible()

    // Fill in registration form
    await page.fill('input[name="organizationName"]', 'Test Organization')
    await page.fill('input[name="fullName"]', 'Test User')
    await page.fill('input[type="email"]', 'newuser@example.com')
    await page.fill('input[name="password"]', 'SecurePass123!')
    await page.fill('input[name="confirmPassword"]', 'SecurePass123!')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })
  })

  test('[7] registration with duplicate email shows error', async ({ page }) => {
    await page.goto('http://localhost:5173/signup')

    await page.fill('input[name="organizationName"]', 'Test Organization')
    await page.fill('input[name="fullName"]', 'Test User')
    await page.fill('input[type="email"]', 'existing@email.com')
    await page.fill('input[name="password"]', 'SecurePass123!')
    await page.fill('input[name="confirmPassword"]', 'SecurePass123!')

    await page.click('button[type="submit"]')

    // Should show error
    await expect(page.locator('text=/email already exists/i')).toBeVisible({ timeout: 5000 })
  })

  test('[8] registration with weak password shows validation error', async ({ page }) => {
    await page.goto('http://localhost:5173/signup')

    await page.fill('input[name="organizationName"]', 'Test Organization')
    await page.fill('input[name="fullName"]', 'Test User')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'weak')
    await page.fill('input[name="confirmPassword"]', 'weak')

    await page.click('button[type="submit"]')

    // Should show password strength error
    await expect(page.locator('text=/8 characters|uppercase|special/i')).toBeVisible()
  })

  test('[9] logout clears session and redirects to home', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login')
    await page.fill('input[type="email"]', 'admin@first.com')
    await page.fill('input[type="password"]', 'AdminPassword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 10000 })

    // Click logout button
    await page.click('button:has-text("Log Out")')

    // Should redirect to home
    await page.waitForURL('**/', { timeout: 5000 })

    // Navbar should show login button
    await expect(page.locator('button:has-text("Log In")')).toBeVisible()
  })

  test('[12] protected route redirects unauthenticated user to login', async ({ page }) => {
    // Try to access dashboard directly without authentication
    await page.goto('http://localhost:5173/dashboard')

    // Should be redirected to login
    await page.waitForURL('**/login', { timeout: 5000 })
    await expect(page.locator('text=Welcome Back')).toBeVisible()
  })

  test('switch between login and signup forms', async ({ page }) => {
    await page.goto('http://localhost:5173/login')

    // Click "Create account" link
    await page.click('button:has-text("Create account")')

    // Should show signup form
    await expect(page.locator('text=Create Account')).toBeVisible()

    // Click "Log in" link
    await page.click('button:has-text("Log in")')

    // Should show login form
    await expect(page.locator('text=Welcome Back')).toBeVisible()
  })
})
