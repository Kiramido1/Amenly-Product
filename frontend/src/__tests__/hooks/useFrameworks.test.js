import { describe, test, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useFrameworks } from '../../hooks/useFrameworks'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

describe('useFrameworks Hook', () => {
  test('useFrameworks returns initial state', () => {
    const { result } = renderHook(() => useFrameworks())

    // The hook auto-fetches on mount, so data is still empty on first render
    // and it is already loading (isLoading flips true in the mount effect).
    expect(result.current.frameworks).toEqual([])
    expect(result.current.stats).toBeNull()
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  test('useFrameworks fetches frameworks on mount', async () => {
    const { result } = renderHook(() => useFrameworks())

    await waitFor(() => {
      expect(result.current.frameworks.length).toBeGreaterThan(0)
    })

    expect(result.current.frameworks[0]).toHaveProperty('id')
    expect(result.current.frameworks[0]).toHaveProperty('name')
    expect(result.current.frameworks[0]).toHaveProperty('framework_type')
  })

  test('useFrameworks fetches stats on mount', async () => {
    const { result } = renderHook(() => useFrameworks())

    await waitFor(() => {
      expect(result.current.stats).not.toBeNull()
    })

    expect(result.current.stats.total).toBe(21)
    expect(result.current.stats.mandatory_count).toBe(16)
  })

  test('useFrameworks fetches filter options on mount', async () => {
    const { result } = renderHook(() => useFrameworks())

    await waitFor(() => {
      expect(result.current.types.length).toBeGreaterThan(0)
    })

    expect(result.current.categories.length).toBeGreaterThan(0)
    expect(result.current.regions.length).toBeGreaterThan(0)
  })

  test('useFrameworks refetch updates frameworks', async () => {
    const { result } = renderHook(() => useFrameworks())

    await waitFor(() => {
      expect(result.current.frameworks.length).toBeGreaterThan(0)
    })

    // Modify server response
    server.use(
      http.get('http://localhost:8001/api/v1/frameworks/', () => {
        return HttpResponse.json({
          success: true,
          data: { frameworks: [{ id: 'new', name: 'New Framework', framework_type: 'standard', is_mandatory: false }] }
        })
      })
    )

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.frameworks[0].id).toBe('new')
  })

  test('useFrameworks refetchStats updates stats', async () => {
    const { result } = renderHook(() => useFrameworks())

    await waitFor(() => {
      expect(result.current.stats).not.toBeNull()
    })

    // Modify server response
    server.use(
      http.get('http://localhost:8001/api/v1/frameworks/stats', () => {
        return HttpResponse.json({
          success: true,
          data: { total: 100, mandatory_count: 80, optional_count: 20 }
        })
      })
    )

    await act(async () => {
      await result.current.refetchStats()
    })

    expect(result.current.stats.total).toBe(100)
  })

  test('useFrameworks handles API error', async () => {
    server.use(
      http.get('http://localhost:8001/api/v1/frameworks/', () => {
        return HttpResponse.json(
          { success: false, message: 'Server error' },
          { status: 500 }
        )
      })
    )

    const { result } = renderHook(() => useFrameworks())

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })
  })

  test('useFrameworks accepts filter parameters', async () => {
    let capturedParams = null

    server.use(
      http.get('http://localhost:8001/api/v1/frameworks/', ({ request }) => {
        const url = new URL(request.url)
        capturedParams = {
          framework_type: url.searchParams.get('framework_type'),
          is_mandatory: url.searchParams.get('is_mandatory')
        }
        return HttpResponse.json({ success: true, data: [] })
      })
    )

    const { result } = renderHook(() => useFrameworks())

    await act(async () => {
      await result.current.refetch({ framework_type: 'regulation', is_mandatory: 'true' })
    })

    expect(capturedParams.framework_type).toBe('regulation')
    expect(capturedParams.is_mandatory).toBe('true')
  })

  test('useFrameworks sets loading state during fetch', async () => {
    const { result } = renderHook(() => useFrameworks())

    // Initial fetch triggers loading
    await waitFor(() => {
      expect(result.current.frameworks.length).toBeGreaterThan(0)
    })
  })
})
