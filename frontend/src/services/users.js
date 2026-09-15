import api from './api'

export const getMe = () => api.get('/users/me')
export const updateMe = (data) => api.put('/users/me', data)
export const updatePublicKey = (public_key) => api.put('/users/me/public-key', { public_key })
export const searchUsers = (q) => api.get(`/users/search?q=${encodeURIComponent(q)}`)
export const getUserById = (id) => api.get(`/users/${id}`)
export const addContact = (contact_username) => api.post('/users/contacts', { contact_username })
export const getContacts = () => api.get('/users/contacts/list')
