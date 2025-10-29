import api from './api'

export const fetchEvents = async ({ q = '', page = 1, perPage = 10, mine = false } = {}) => {
  const params = {}
  if (q) params.q = q
  if (page) params.page = page
  if (perPage) params.per_page = perPage
  if (mine) params.mine = true
  const res = await api.get('/events', { params })
  return res.data
}

export const fetchEvent = async (id) => {
  const res = await api.get(`/events/${id}`)
  return res.data
}

export const updateEvent = async (id, data) => {
  const res = await api.put(`/events/${id}`, data)
  return res.data
}

export const deleteEvent = async (id) => {
  const res = await api.delete(`/events/${id}`)
  return res.data
}

export const getEventStats = async (id) => {
  const res = await api.get(`/events/${id}/stats`)
  return res.data
}
