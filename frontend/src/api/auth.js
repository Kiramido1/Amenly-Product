import api, { setAccessToken, setRefreshToken, clearAccessToken, clearRefreshToken, getRefreshToken } from './client'

export const register = async ({ email, password, fullName, organizationName }) => {
  const response = await api.post('/auth/register', {
    email,
    password,
    full_name: fullName,
    organization_name: organizationName,
  })

  // Persist the tokens the backend issues on registration so the session survives
  // a page reload / navigating home (access token is in-memory, refresh in storage).
  const data = response.data.data || response.data
  if (data?.access_token) {
    setAccessToken(data.access_token)
  }
  if (data?.refresh_token) {
    setRefreshToken(data.refresh_token)
  }

  return response.data
}

// Request to join an EXISTING organization via its invite code. No account is
// created and no token is returned until an org admin approves the request.
export const requestJoin = async ({ email, password, fullName, inviteCode }) => {
  const response = await api.post('/auth/join-request', {
    email,
    password,
    full_name: fullName,
    invite_code: inviteCode,
  })
  return response.data
}

export const login = async ({ email, password }) => {
  const response = await api.post('/auth/login', { email, password })
  const data = response.data.data || response.data

  if (data?.access_token) {
    setAccessToken(data.access_token)
  }
  if (data?.refresh_token) {
    setRefreshToken(data.refresh_token)
  }

  return response.data
}

export const logout = async () => {
  try {
    await api.post('/auth/logout')
  } catch (err) {
    console.warn('Logout API error:', err.message)
  } finally {
    clearAccessToken()
    clearRefreshToken()
  }
}

export const refresh = async () => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token available')

  const response = await api.post('/auth/refresh', { refresh_token: refreshToken })
  const data = response.data.data || response.data

  if (data?.access_token) {
    setAccessToken(data.access_token)
  }

  return response.data
}

export const me = async () => {
  const response = await api.get('/auth/me')
  return response.data
}
