import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1'
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || API_BASE_URL.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '/ws')

let accessToken = null
let refreshPromise = null

export const setAccessToken = (token) => { accessToken = token }
export const getAccessToken = () => accessToken
export const clearAccessToken = () => { accessToken = null }

export const getRefreshToken = () => sessionStorage.getItem('refresh_token')
export const setRefreshToken = (token) => sessionStorage.setItem('refresh_token', token)
export const clearRefreshToken = () => sessionStorage.removeItem('refresh_token')

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // A 401 from the auth endpoints themselves means bad credentials / an
    // invalid refresh token — NOT an expired access token. Attempting a token
    // refresh here would swallow the real error (and redirect on login pages),
    // so let those responses pass through untouched.
    const reqUrl = originalRequest?.url || ''
    const isAuthEndpoint = /\/auth\/(login|register|refresh|join-request)/.test(reqUrl)

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true

      if (refreshPromise) {
        await refreshPromise
        originalRequest.headers.Authorization = `Bearer ${getAccessToken()}`
        return api(originalRequest)
      }

      refreshPromise = (async () => {
        try {
          const refreshToken = getRefreshToken()
          if (!refreshToken) throw new Error('No refresh token')

          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })

          // Backend refresh returns flat Token: {access_token, refresh_token, user}
          const newAccess = res.data.access_token
          const newRefresh = res.data.refresh_token
          if (newAccess) {
            setAccessToken(newAccess)
          }
          if (newRefresh) {
            setRefreshToken(newRefresh)
          }
        } catch (err) {
          clearAccessToken()
          clearRefreshToken()
          window.location.href = '/login'
          throw err
        } finally {
          refreshPromise = null
        }
      })()

      await refreshPromise
      originalRequest.headers.Authorization = `Bearer ${getAccessToken()}`
      return api(originalRequest)
    }

    return Promise.reject(error)
  }
)

export default api

export { API_BASE_URL, WS_BASE_URL }
