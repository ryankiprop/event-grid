import api from './api'

export const fetchEvents = async ({ q = '', page = 1, perPage = 10, mine = false, category = '', startDate = '', endDate = '', minPrice = '', maxPrice = '' } = {}) => {
  const params = {}
  if (q) params.q = q
  if (page) params.page = page
  if (perPage) params.per_page = perPage
  if (mine) params.mine = true
  if (category) params.category = category
  if (startDate) params.start_date = startDate
  if (endDate) params.end_date = endDate
  if (minPrice) params.min_price = minPrice
  if (maxPrice) params.max_price = maxPrice
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
