import api from './client'

export const createAssessment = async ({ name, frameworkId }) => {
  const response = await api.post('/assessments', {
    name,
    framework_id: frameworkId,
  })
  return response.data
}

export const listAssessments = async () => {
  const response = await api.get('/assessments')
  return response.data
}

export const getAssessment = async (id) => {
  const response = await api.get(`/assessments/${id}`)
  return response.data
}

export const startAssessmentSession = async (assessmentId) => {
  const response = await api.post(`/assessments/${assessmentId}/sessions/start`)
  return response.data
}

export const getAssessmentSession = async (sessionId) => {
  const response = await api.get(`/assessments/sessions/${sessionId}`)
  return response.data
}

export const completeAssessmentSession = async (sessionId) => {
  const response = await api.post(`/assessments/sessions/${sessionId}/complete`)
  return response.data
}

export const saveAssessmentAnswer = async ({ sessionId, questionId, positionId, answerText, evidenceUrls = [] }) => {
  const response = await api.post('/assessments/answers', {
    session_id: sessionId,
    question_id: questionId,
    position_id: positionId,
    answer_text: answerText,
    evidence_urls: evidenceUrls,
  })
  return response.data
}

export const sendChatMessage = async ({ sessionId, messageText }) => {
  const response = await api.post(`/assessments/sessions/${sessionId}/chat`, {
    session_id: sessionId,
    message_text: messageText,
  })
  return response.data
}

export const getChatHistory = async (sessionId) => {
  const response = await api.get(`/assessments/sessions/${sessionId}/chat`)
  return response.data
}

// --- Campaign lifecycle (admin only) ---

export const launchCampaign = async (assessmentId) => {
  const response = await api.post(`/assessments/${assessmentId}/launch`)
  return response.data
}

export const advanceCampaignPhase = async (assessmentId) => {
  const response = await api.post(`/assessments/${assessmentId}/advance-phase`)
  return response.data
}

export const closeCampaign = async (assessmentId) => {
  const response = await api.post(`/assessments/${assessmentId}/close`)
  return response.data
}

export const listCampaignSessions = async (assessmentId) => {
  const response = await api.get(`/assessments/${assessmentId}/sessions`)
  return response.data
}

export const getCampaignOverview = async (assessmentId) => {
  const response = await api.get(`/assessments/${assessmentId}/overview`)
  return response.data
}
