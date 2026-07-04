import api from './client'

export const extractAssets = async ({ messageText, sessionId, messageId }) => {
  const response = await api.post('/assets/extract', {
    message_text: messageText,
    session_id: sessionId,
    message_id: messageId,
  })
  return response.data
}

export const listInfrastructureAssets = async (assetType = null) => {
  const params = assetType ? { asset_type: assetType } : {}
  const response = await api.get('/assets/', { params })
  return response.data
}

export const getAssetStatistics = async () => {
  const response = await api.get('/assets/statistics')
  return response.data
}

// --- Vulnerabilities + infrastructure map (admin) ---

export const scanVulnerabilities = async () => {
  const response = await api.post('/assets/scan-vulnerabilities')
  return response.data
}

export const listVulnerabilities = async (onlyOpen = false) => {
  const params = onlyOpen ? { only_open: true } : {}
  const response = await api.get('/assets/vulnerabilities', { params })
  return response.data
}

export const getInfrastructureMap = async () => {
  const response = await api.get('/assets/map')
  return response.data
}
