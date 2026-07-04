import api from './client'

export const getRagHealth = async () => {
  const response = await api.get('/rag/health')
  return response.data
}

export const searchRag = async ({ query, topK = 5 }) => {
  const response = await api.post('/rag/search', {
    query,
    top_k: topK,
  })
  return response.data
}

export const queryRag = async ({ question, framework = null, topK = 10 }) => {
  const response = await api.post('/rag/query', {
    question,
    framework,
    top_k: topK,
  })
  return response.data
}
