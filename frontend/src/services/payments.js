import api from './api'

export const initiateMpesa = async (payload) => {
  const res = await api.post('/payments/mpesa/initiate', payload)
  return res.data
}

export const getPayment = async (paymentId) => {
  const res = await api.get(`/payments/${paymentId}`)
  return res.data
}
