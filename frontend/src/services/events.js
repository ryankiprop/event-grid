import api from './api'

export const fetchEvents = async ({ q = '', page = 1, per_page = 10, mine = false } = {}) => {
  const params = {}
  if (q) params.q = q
  if (page) params.page = page
  if (per_page) params.per_page = per_page
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
