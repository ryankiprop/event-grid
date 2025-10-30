import api from './api'

export const createOrder = async (payload) => {
  const items = Array.isArray(payload.items) ? payload.items : []
  const mapped = items
    .map((item) => ({
      ticket_type_id: item.ticket_type_id || item.ticketTypeId,
      quantity: Math.max(1, parseInt(item.quantity || 1, 10)),
    }))
    .filter((it) => !!it.ticket_type_id && it.quantity > 0)

  if (!payload.event_id || mapped.length === 0) {
    throw new Error('Invalid order: event_id or items are missing')
  }

  const transformedPayload = {
    event_id: payload.event_id,
    items: mapped,
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
