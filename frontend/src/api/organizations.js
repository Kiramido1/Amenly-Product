import api from './client'

// Current user's organization (includes company profile + profile_completed flag).
export const getMyOrganization = async () => {
  const res = await api.get('/orgs/me')
  return res.data.data?.organization || res.data.data || null
}

// Admin: save the company profile and mark onboarding complete.
export const updateCompanyProfile = async ({ name, industry, companySize, region, website, description }) => {
  const res = await api.put('/orgs/profile', {
    name,
    industry,
    company_size: companySize,
    region,
    website,
    description,
  })
  return res.data.data?.organization || res.data.data || null
}

// --- Admin: join requests + invite code ---

export const getJoinRequests = async () => {
  const res = await api.get('/orgs/join-requests')
  return res.data.data?.join_requests || []
}

export const approveJoinRequest = async (id) => {
  const res = await api.post(`/orgs/join-requests/${id}/approve`)
  return res.data
}

export const rejectJoinRequest = async (id) => {
  const res = await api.post(`/orgs/join-requests/${id}/reject`)
  return res.data
}

export const regenerateInviteCode = async () => {
  const res = await api.post('/orgs/invite-code/regenerate')
  return res.data.data?.invite_code || ''
}
