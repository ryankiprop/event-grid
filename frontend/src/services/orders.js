import api from './api'

export const createOrder = async (payload) => {
  const res = await api.post('/orders', payload)
  return res.data
}

export const getMyOrders = async () => {
  const res = await api.get('/orders/user')
  return res.data
}

export const getOrder = async (id) => {
  const res = await api.get(`/orders/${id}`)
  return res.data
}

export const getEventOrders = async (eventId) => {
  const res = await api.get(`/events/${eventId}/orders`)
  return res.data
}
