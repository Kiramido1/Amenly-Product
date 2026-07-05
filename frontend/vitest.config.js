// vitest.config.js
import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Several source/test files contain JSX inside plain .js files; tell the React
  // plugin to transform .js as JSX too (default only handles .jsx/.tsx).
  plugins: [react({ include: /\.(js|jsx)$/ })],
  test: {
    environment: 'jsdom',
    // Force an ABSOLUTE API base URL in tests so requests match the MSW handlers
    // (which register absolute http://localhost:8001 URLs), regardless of any
    // .env.local that sets a relative /api/v1 for the dev proxy.
    env: { VITE_API_BASE_URL: 'http://localhost:8001/api/v1' },
    // axios resolves request URLs against window.location at import time; give
    // jsdom a real base URL so `new URL('/')` does not throw "Invalid URL".
    environmentOptions: { jsdom: { url: 'http://localhost:3000' } },
    setupFiles: ['./src/__tests__/setup.js'],
    globals: true,
    // Playwright e2e specs are run by Playwright, not vitest.
    exclude: [...configDefaults.exclude, '**/__tests__/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/__tests__/'],
      thresholds: { lines: 80, functions: 80, branches: 70 }
    }
  }
})
