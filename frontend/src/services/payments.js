import api from './api'

export const initiateMpesa = async (payload) => {
  // Ensure we have valid ticket data
  if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error('No ticket items provided')
  }

  // Validate ticket type IDs
  const tickets = payload.items.map(item => {
    if (!item.ticket_type_id) {
      throw new Error('Invalid ticket type ID')
    }
    return {
      ticket_type_id: item.ticket_type_id,
      quantity: item.quantity || 1
    }
  })

  const transformedPayload = {
    event_id: payload.event_id,
    phone: payload.phone,
    tickets: tickets
  }
  
  console.log('Sending M-Pesa payment request:', transformedPayload)
  
  try {
    const res = await api.post('/payments/mpesa/initiate', transformedPayload)
    return res.data
  } catch (error) {
    console.error('M-Pesa payment error:', error.response?.data || error.message)
    throw error
  }
}

export const getPayment = async (paymentId) => {
  const res = await api.get(`/payments/${paymentId}`)
  return res.data
}
