import api from './api'

export const initiateMpesa = async (payload) => {
  // Ensure we have valid ticket data
  if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error('No ticket items provided')
  }

  // Validate ticket type IDs and calculate total amount
  let totalAmount = 0;
  const tickets = payload.items.map(item => {
    if (!item.ticket_type_id) {
      throw new Error('Invalid ticket type ID')
    }
    if (!item.price || isNaN(item.price) || item.price < 0) {
      throw new Error('Invalid ticket price')
    }
    const quantity = parseInt(item.quantity) || 1
    totalAmount += item.price * quantity
    
    return {
      ticket_type_id: item.ticket_type_id,
      quantity: quantity
    }
  })

  // Format phone number if needed
  let phone = (payload.phone || '').trim()
  if (phone.startsWith('0')) {
    phone = '254' + phone.substring(1)
  } else if (phone.startsWith('+254')) {
    phone = phone.substring(1)
  } else if (!phone.startsWith('254')) {
    phone = '254' + phone
  }

  const transformedPayload = {
    event_id: payload.event_id,
    phone: phone,
    tickets: tickets,
    amount: totalAmount
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
