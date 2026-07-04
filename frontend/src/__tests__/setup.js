import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { server } from './mocks/server'

// Mock window.location for navigation tests
const originalLocation = window.location
delete window.location
window.location = {
  ...originalLocation,
  href: 'http://localhost:3000/',
  origin: 'http://localhost:3000',
  pathname: '/',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
}

// Mock sessionStorage
const sessionStorageMock = {
  store: {},
  getItem(key) {
    return this.store[key] || null
  },
  setItem(key, value) {
    this.store[key] = String(value)
  },
  removeItem(key) {
    delete this.store[key]
  },
  clear() {
    this.store = {}
  },
}
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock })

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem(key) {
    return this.store[key] || null
  },
  setItem(key, value) {
    this.store[key] = String(value)
  },
  removeItem(key) {
    delete this.store[key]
  },
  clear() {
    this.store = {}
  },
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Start MSW server
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers and storage after each test
afterEach(() => {
  server.resetHandlers()
  sessionStorageMock.clear()
  localStorageMock.clear()
  window.location.href = '/'
  window.location.pathname = '/'
})

// Close server after all tests
afterAll(() => server.close())
