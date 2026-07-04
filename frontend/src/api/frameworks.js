import api from './client'

export const listFrameworks = async (params = {}) => {
  const response = await api.get('/frameworks/', { params })
  return response.data
}

export const getFrameworkStats = async () => {
  const response = await api.get('/frameworks/stats')
  return response.data
}

export const getFrameworkTypes = async () => {
  const response = await api.get('/frameworks/types')
  return response.data
}

export const getFrameworkCategories = async () => {
  const response = await api.get('/frameworks/categories')
  return response.data
}

export const getFrameworkRegions = async () => {
  const response = await api.get('/frameworks/regions')
  return response.data
}

export const getFramework = async (id) => {
  const response = await api.get(`/frameworks/${id}`)
  return response.data
}

// All frameworks in the system, each flagged with `is_associated` for this org.
export const getAvailableFrameworks = async (params = {}) => {
  const response = await api.get('/frameworks/available/all', { params })
  return response.data.data?.frameworks || []
}

// Admin: associate one or more catalog frameworks with the org.
export const associateFrameworks = async (frameworkIds) => {
  const response = await api.post('/frameworks/associate', { framework_ids: frameworkIds })
  return response.data
}

// Admin: remove a framework from the org (keeps it in the catalog).
export const dissociateFramework = async (id) => {
  const response = await api.delete(`/frameworks/dissociate/${id}`)
  return response.data
}
