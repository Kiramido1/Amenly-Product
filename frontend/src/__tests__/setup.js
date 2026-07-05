import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { server } from './mocks/server'

// jsdom lacks these browser APIs that framer-motion (whileInView) and recharts
// (ResponsiveContainer) rely on — provide no-op mocks so components render.
class MockObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}
global.IntersectionObserver = MockObserver
global.ResizeObserver = MockObserver
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })
}

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
  // Reset to a FULL absolute URL — a bare '/' breaks MSW's URL resolver
  // (`new URL(reqUrl, '/')` throws "Invalid base URL: /") for every request
  // made after the first test in a file.
  window.location.href = 'http://localhost:3000/'
  window.location.pathname = '/'
})

// Close server after all tests
afterAll(() => server.close())
