import { http, HttpResponse, delay } from 'msw'
import { frameworksList, frameworkStats, singleFramework } from '../fixtures/frameworks.fixture'

export const frameworkHandlers = [
  // GET /api/v1/frameworks/
  http.get('http://localhost:8001/api/v1/frameworks/', async ({ request }) => {
    const url = new URL(request.url)
    const frameworkType = url.searchParams.get('framework_type')
    const isMandatory = url.searchParams.get('is_mandatory')
    const search = url.searchParams.get('search')
    const skip = parseInt(url.searchParams.get('skip') || '0')
    const limit = parseInt(url.searchParams.get('limit') || '100')

    // Simulate API delay
    if (search === 'slow') {
      await delay(2000)
    }

    let filtered = [...frameworksList]

    // Filter by framework_type
    if (frameworkType) {
      filtered = filtered.filter(f => f.framework_type === frameworkType)
    }

    // Filter by is_mandatory
    if (isMandatory !== null) {
      filtered = filtered.filter(f => f.is_mandatory === (isMandatory === 'true'))
    }

    // Filter by search keyword
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(searchLower) ||
        f.description.toLowerCase().includes(searchLower)
      )
    }

    // Apply pagination
    const paginated = filtered.slice(skip, skip + limit)

    return HttpResponse.json({
      success: true,
      data: paginated
    })
  }),

  // GET /api/v1/frameworks/stats
  http.get('http://localhost:8001/api/v1/frameworks/stats', () => {
    return HttpResponse.json({
      success: true,
      data: frameworkStats
    })
  }),

  // GET /api/v1/frameworks/types
  http.get('http://localhost:8001/api/v1/frameworks/types', () => {
    return HttpResponse.json({
      success: true,
      data: ['regulation', 'standard']
    })
  }),

  // GET /api/v1/frameworks/categories
  http.get('http://localhost:8001/api/v1/frameworks/categories', () => {
    return HttpResponse.json({
      success: true,
      data: ['data_protection', 'financial', 'healthcare', 'security']
    })
  }),

  // GET /api/v1/frameworks/regions
  http.get('http://localhost:8001/api/v1/frameworks/regions', () => {
    return HttpResponse.json({
      success: true,
      data: ['United States', 'Global', 'European Union', 'United Kingdom']
    })
  }),

  // GET /api/v1/frameworks/{id}
  http.get('http://localhost:8001/api/v1/frameworks/:id', ({ params }) => {
    const { id } = params

    // Find framework by ID
    const framework = frameworksList.find(f => f.id === id || f.id === parseInt(id))

    if (!framework) {
      return HttpResponse.json({
        success: false,
        message: 'Framework not found'
      }, { status: 404 })
    }

    return HttpResponse.json({
      success: true,
      data: framework
    })
  }),

  // Simulate API down
  http.get('http://localhost:8001/api/v1/frameworks/down', () => {
    return HttpResponse.json({
      success: false,
      message: 'Service unavailable'
    }, { status: 503 })
  }),
]
