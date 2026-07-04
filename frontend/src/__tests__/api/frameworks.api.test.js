import { describe, test, expect, beforeEach } from 'vitest'
import * as frameworksApi from '../../api/frameworks'
import { setAccessToken, clearAccessToken } from '../../api/client'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

describe('Frameworks API - List', () => {
  test('[13] Fetch frameworks list returns array of frameworks', async () => {
    const result = await frameworksApi.listFrameworks()

    expect(result.success).toBe(true)
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
  })

  test('[14] Filter by framework_type=regulation returns only regulations', async () => {
    const result = await frameworksApi.listFrameworks({ framework_type: 'regulation' })

    expect(result.success).toBe(true)
    result.data.forEach(fw => {
      expect(fw.framework_type).toBe('regulation')
    })
  })

  test('[15] Filter by is_mandatory=true returns only mandatory frameworks', async () => {
    const result = await frameworksApi.listFrameworks({ is_mandatory: 'true' })

    expect(result.success).toBe(true)
    result.data.forEach(fw => {
      expect(fw.is_mandatory).toBe(true)
    })
  })

  test('[16] Search by keyword filters results correctly', async () => {
    const result = await frameworksApi.listFrameworks({ search: 'GDPR' })

    expect(result.success).toBe(true)
    result.data.forEach(fw => {
      expect(
        fw.name.toLowerCase().includes('gdpr') ||
        fw.description.toLowerCase().includes('gdpr')
      ).toBe(true)
    })
  })

  test('[17] Combined filters send correct query params to API', async () => {
    let capturedUrl = null
    server.use(
      http.get('http://localhost:8001/api/v1/frameworks/', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ success: true, data: [] })
      })
    )

    await frameworksApi.listFrameworks({
      framework_type: 'regulation',
      is_mandatory: 'true',
      search: 'data',
      skip: 0,
      limit: 10
    })

    expect(capturedUrl).toContain('framework_type=regulation')
    expect(capturedUrl).toContain('is_mandatory=true')
    expect(capturedUrl).toContain('search=data')
    expect(capturedUrl).toContain('skip=0')
    expect(capturedUrl).toContain('limit=10')
  })

  test('[22] Pagination - skip/limit params sent correctly on page change', async () => {
    let capturedUrl = null
    server.use(
      http.get('http://localhost:8001/api/v1/frameworks/', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ success: true, data: [] })
      })
    )

    // Page 2 (skip=20, limit=20)
    await frameworksApi.listFrameworks({ skip: 20, limit: 20 })

    expect(capturedUrl).toContain('skip=20')
    expect(capturedUrl).toContain('limit=20')
  })
})

describe('Frameworks API - Single Framework', () => {
  test('[18] Fetch single framework by ID displays correct data', async () => {
    const result = await frameworksApi.getFramework('1')

    expect(result.success).toBe(true)
    expect(result.data.id).toBe('1')
    expect(result.data.name).toBe('GDPR')
  })

  test('[19] Framework not found returns 404', async () => {
    await expect(frameworksApi.getFramework('nonexistent')).rejects.toThrow()
  })
})

describe('Frameworks API - Stats', () => {
  test('[20] Stats endpoint returns correct numbers', async () => {
    const result = await frameworksApi.getFrameworkStats()

    expect(result.success).toBe(true)
    expect(result.data.total).toBe(21)
    expect(result.data.mandatory_count).toBe(16)
    expect(result.data.optional_count).toBe(5)
    expect(result.data.by_type.regulation).toBe(13)
    expect(result.data.by_type.standard).toBe(8)
  })
})

describe('Frameworks API - Filters', () => {
  test('getFrameworkTypes returns array of types', async () => {
    const result = await frameworksApi.getFrameworkTypes()

    expect(result.success).toBe(true)
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data).toContain('regulation')
    expect(result.data).toContain('standard')
  })

  test('getFrameworkCategories returns array of categories', async () => {
    const result = await frameworksApi.getFrameworkCategories()

    expect(result.success).toBe(true)
    expect(Array.isArray(result.data)).toBe(true)
  })

  test('getFrameworkRegions returns array of regions', async () => {
    const result = await frameworksApi.getFrameworkRegions()

    expect(result.success).toBe(true)
    expect(Array.isArray(result.data)).toBe(true)
  })
})

describe('Frameworks API - Error Handling', () => {
  test('[21] API down → graceful fallback, no crash', async () => {
    server.use(
      http.get('http://localhost:8001/api/v1/frameworks/', () => {
        return HttpResponse.json(
          { success: false, message: 'Service unavailable' },
          { status: 503 }
        )
      })
    )

    await expect(frameworksApi.listFrameworks()).rejects.toThrow()
  })
})
