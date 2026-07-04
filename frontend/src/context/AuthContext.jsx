import { createContext, useState, useCallback, useEffect } from 'react'
import * as authApi from '../api/auth'
import { getAccessToken, setAccessToken, clearAccessToken, getRefreshToken, clearRefreshToken } from '../api/client'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const checkAuth = useCallback(async () => {
    const token = getAccessToken()
    const refresh = getRefreshToken()

    if (!token && !refresh) {
      setIsAuthenticated(false)
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const res = await authApi.me()
      // Backend me returns GenericResponse: {success, data: {user}}
      if (res.success && res.data?.user) {
        setUser(res.data.user)
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (err) {
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = useCallback(async (credentials) => {
    setIsLoading(true)
    try {
      const res = await authApi.login(credentials)
      // Backend login returns flat Token: {access_token, refresh_token, user}
      if (res.user) {
        setUser(res.user)
        setIsAuthenticated(true)
        return { success: true, data: res }
      }
      return { success: false, message: res.message || 'Login failed' }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || err.message || 'Login failed'
      return { success: false, message: msg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (data) => {
    setIsLoading(true)
    try {
      const res = await authApi.register(data)
      if (res.success && res.data?.user) {
        setUser(res.data.user)
        setIsAuthenticated(true)
        return { success: true, data: res.data }
      }
      return { success: false, message: res.message || 'Registration failed' }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || err.message || 'Registration failed'
      return { success: false, message: msg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await authApi.logout()
    } catch (err) {
      console.warn('Logout error:', err.message)
    } finally {
      clearAccessToken()
      clearRefreshToken()
      setUser(null)
      setIsAuthenticated(false)
      setIsLoading(false)
    }
  }, [])

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
