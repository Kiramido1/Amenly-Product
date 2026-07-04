import { http, HttpResponse, delay } from 'msw'
import { ragSearchResults, ragQueryResponse, ragLowConfidenceResponse } from '../fixtures/rag.fixture'

export const ragHandlers = [
  // GET /api/v1/rag/health
  http.get('http://localhost:8001/api/v1/rag/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      ollama: 'connected',
      qdrant: 'connected'
    })
  }),

  // POST /api/v1/rag/search
  http.post('http://localhost:8001/api/v1/rag/search', async ({ request }) => {
    const body = await request.json()
    const { query, top_k } = body

    // Empty query validation
    if (!query || query.trim() === '') {
      return HttpResponse.json({
        success: false,
        message: 'Query cannot be empty'
      }, { status: 400 })
    }

    // Simulate slow response
    if (query === 'slow query') {
      await delay(2000)
    }

    return HttpResponse.json({
      success: true,
      data: {
        results: ragSearchResults
      }
    })
  }),

  // POST /api/v1/rag/query
  http.post('http://localhost:8001/api/v1/rag/query', async ({ request }) => {
    const body = await request.json()
    const { question, framework, top_k } = body

    // Empty question validation
    if (!question || question.trim() === '') {
      return HttpResponse.json({
        success: false,
        message: 'Question cannot be empty'
      }, { status: 400 })
    }

    // Simulate 60 second response for long-running query test
    if (question === 'long running query') {
      await delay(1000) // Use shorter delay for tests, but test will verify loading state
      return HttpResponse.json({
        success: true,
        data: ragQueryResponse
      })
    }

    // Low confidence response
    if (question === 'low confidence query') {
      return HttpResponse.json({
        success: true,
        data: ragLowConfidenceResponse
      })
    }

    // Failed query
    if (question === 'fail query') {
      return HttpResponse.json({
        success: false,
        message: 'RAG query failed'
      }, { status: 500 })
    }

    // Default successful response
    return HttpResponse.json({
      success: true,
      data: ragQueryResponse
    })
  }),
]
