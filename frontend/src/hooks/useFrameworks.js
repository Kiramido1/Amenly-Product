import { useState, useEffect, useCallback } from 'react'
import * as frameworksApi from '../api/frameworks'

export const useFrameworks = () => {
  const [frameworks, setFrameworks] = useState([])
  const [stats, setStats] = useState(null)
  const [types, setTypes] = useState([])
  const [categories, setCategories] = useState([])
  const [regions, setRegions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchFrameworks = useCallback(async (params = {}) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await frameworksApi.listFrameworks(params)
      if (res.success) {
        setFrameworks(res.data?.frameworks || [])
      } else {
        setError(new Error(res.message || 'Failed to fetch frameworks'))
      }
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await frameworksApi.getFrameworkStats()
      if (res.success) {
        setStats(res.data)
      }
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchFilters = useCallback(async () => {
    try {
      const [typesRes, catsRes, regsRes] = await Promise.all([
        frameworksApi.getFrameworkTypes(),
        frameworksApi.getFrameworkCategories(),
        frameworksApi.getFrameworkRegions(),
      ])
      if (typesRes.success) setTypes(typesRes.data?.types || [])
      if (catsRes.success) setCategories(catsRes.data?.categories || [])
      if (regsRes.success) setRegions(regsRes.data?.regions || [])
    } catch (err) {
      console.warn('Failed to fetch filters:', err)
    }
  }, [])

  useEffect(() => {
    fetchFrameworks()
    fetchStats()
    fetchFilters()
  }, [fetchFrameworks, fetchStats, fetchFilters])

  return {
    frameworks,
    stats,
    types,
    categories,
    regions,
    isLoading,
    error,
    refetch: fetchFrameworks,
    refetchStats: fetchStats,
  }
}
