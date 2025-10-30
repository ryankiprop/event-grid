import api from './api'

export const createOrder = async (payload) => {
  // Transform the payload to match the backend's expected format
  const transformedPayload = {
    event_id: payload.event_id,
    items: payload.items.map(item => ({
      ticket_type_id: item.ticket_type_id,
      quantity: item.quantity || 1
    }))
  }
  
  const res = await api.post('/orders', transformedPayload)
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
