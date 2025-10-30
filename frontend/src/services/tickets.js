import api from './api'

export const getEventTickets = async (eventId) => {
  const res = await api.get(`/events/${eventId}/tickets`)
  return res.data
}

export const createTicketType = async (eventId, data) => {
  const res = await api.post(`/events/${eventId}/tickets`, data)
  return res.data
}

export const updateTicketType = async (eventId, ticketId, data) => {
  const res = await api.put(`/events/${eventId}/tickets/${ticketId}`, data)
  return res.data
}

export const deleteTicketType = async (eventId, ticketId) => {
  const res = await api.delete(`/events/${eventId}/tickets/${ticketId}`)
  return res.data
}
