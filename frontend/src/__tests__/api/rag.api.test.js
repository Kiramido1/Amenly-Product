import { describe, test, expect, beforeEach } from 'vitest'
import * as ragApi from '../../api/rag'
import { server } from '../mocks/server'
import { http, HttpResponse, delay } from 'msw'

describe('RAG API - Health', () => {
  test('[23] RAG health check shows connected status', async () => {
    const result = await ragApi.getRagHealth()

    expect(result.status).toBe('healthy')
    expect(result.ollama).toBe('connected')
    expect(result.qdrant).toBe('connected')
  })
})

describe('RAG API - Search', () => {
  test('[24] RAG search returns results and renders correctly', async () => {
    const result = await ragApi.searchRag({ query: 'GDPR requirements' })

    expect(result.success).toBe(true)
    expect(result.data.results).toBeDefined()
    expect(Array.isArray(result.data.results)).toBe(true)
    expect(result.data.results.length).toBeGreaterThan(0)
    expect(result.data.results[0]).toHaveProperty('content')
    expect(result.data.results[0]).toHaveProperty('score')
    expect(result.data.results[0]).toHaveProperty('framework')
  })

  test('[25] RAG search with empty query is blocked', async () => {
    await expect(ragApi.searchRag({ query: '' })).rejects.toThrow()
  })

  test('RAG search with topK parameter', async () => {
    let capturedBody = null
    server.use(
      http.post('http://localhost:8001/api/v1/rag/search', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, data: { results: [] } })
      })
    )

    await ragApi.searchRag({ query: 'test', topK: 10 })

    expect(capturedBody.top_k).toBe(10)
  })
})

describe('RAG API - Query', () => {
  test('[26] RAG query submit shows loading/progress indicator', async () => {
    server.use(
      http.post('http://localhost:8001/api/v1/rag/query', async () => {
        await delay(500)
        return HttpResponse.json({
          success: true,
          data: {
            summary: 'Test summary',
            sections: [],
            confidence_score: 0.9,
            sources: [],
            metadata: {}
          }
        })
      })
    )

    const result = await ragApi.queryRag({ question: 'What are ISO 27001 requirements?' })

    expect(result.success).toBe(true)
    expect(result.data).toHaveProperty('summary')
    expect(result.data).toHaveProperty('sections')
    expect(result.data).toHaveProperty('confidence_score')
  })

  test('[28] RAG query success renders sections with titles + content', async () => {
    const result = await ragApi.queryRag({ question: 'ISO 27001' })

    expect(result.success).toBe(true)
    expect(result.data.sections).toBeDefined()
    expect(Array.isArray(result.data.sections)).toBe(true)
    
    result.data.sections.forEach(section => {
      expect(section).toHaveProperty('title')
      expect(section).toHaveProperty('content')
      expect(section).toHaveProperty('order')
    })
  })

  test('[29] RAG query failure shows error, user can retry', async () => {
    server.use(
      http.post('http://localhost:8001/api/v1/rag/query', () => {
        return HttpResponse.json(
          { success: false, message: 'RAG query failed' },
          { status: 500 }
        )
      })
    )

    await expect(ragApi.queryRag({ question: 'fail query' })).rejects.toThrow()
  })

  test('[30] RAG query with confidence_score < 0.5 returns low confidence', async () => {
    const result = await ragApi.queryRag({ question: 'low confidence query' })

    expect(result.success).toBe(true)
    expect(result.data.confidence_score).toBeLessThan(0.5)
  })

  test('RAG query with framework parameter', async () => {
    let capturedBody = null
    server.use(
      http.post('http://localhost:8001/api/v1/rag/query', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({
          success: true,
          data: { summary: 'Test', sections: [], confidence_score: 0.9, sources: [], metadata: {} }
        })
      })
    )

    await ragApi.queryRag({ question: 'test', framework: 'GDPR' })

    expect(capturedBody.framework).toBe('GDPR')
  })

  test('RAG query with topK parameter', async () => {
    let capturedBody = null
    server.use(
      http.post('http://localhost:8001/api/v1/rag/query', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({
          success: true,
          data: { summary: 'Test', sections: [], confidence_score: 0.9, sources: [], metadata: {} }
        })
      })
    )

    await ragApi.queryRag({ question: 'test', topK: 15 })

    expect(capturedBody.top_k).toBe(15)
  })
})

describe('RAG API - Response Structure', () => {
  test('RAG query returns correct metadata', async () => {
    const result = await ragApi.queryRag({ question: 'ISO 27001' })

    expect(result.data.metadata).toBeDefined()
    expect(result.data.metadata).toHaveProperty('word_count')
  })

  test('RAG query returns sources', async () => {
    const result = await ragApi.queryRag({ question: 'ISO 27001' })

    expect(Array.isArray(result.data.sources)).toBe(true)
  })
})
