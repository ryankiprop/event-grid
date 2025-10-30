import api from './api'

export const initiateMpesa = async (payload) => {
  // Transform the payload to match the backend's expected format
  const transformedPayload = {
    event_id: payload.event_id,
    phone: payload.phone,
    tickets: payload.items.map(item => ({
      ticket_type_id: item.ticket_type_id,
      quantity: item.quantity || 1
    }))
  }
  
  const res = await api.post('/payments/mpesa/initiate', transformedPayload)
  return res.data
}

export const getPayment = async (paymentId) => {
  const res = await api.get(`/payments/${paymentId}`)
  return res.data
}
