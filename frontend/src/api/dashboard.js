import api from './client'

export const getDashboardOverview = async () => {
  const response = await api.get('/dashboard/overview')
  return response.data
}

export const getComplianceDashboard = async () => {
  const response = await api.get('/dashboard/compliance')
  return response.data
}

export const getAssetsDashboard = async (assetType = null) => {
  const params = assetType ? { asset_type: assetType } : {}
  const response = await api.get('/dashboard/assets', { params })
  return response.data
}

export const getRisksDashboard = async () => {
  const response = await api.get('/dashboard/risks')
  return response.data
}
