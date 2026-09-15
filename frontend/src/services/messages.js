import api from './api'

export const sendMessage = (data) => api.post('/messages/', data)
export const getConversation = (userId, skip = 0, limit = 50) =>
  api.get(`/messages/${userId}?skip=${skip}&limit=${limit}`)
export const getConversations = () => api.get('/messages/conversations')
export const deleteMessage = (id) => api.delete(`/messages/${id}`)

export const getAllMessages = () => api.get('/messages/search/all')