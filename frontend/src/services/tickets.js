import api from './api'

export const getEventTickets = async (eventId) => {
  try {
    const res = await api.get(`/events/${eventId}/tickets`)
    // The backend returns the tickets array directly, not wrapped in a 'tickets' property
    return { tickets: Array.isArray(res.data) ? res.data : [] }
  } catch (error) {
    console.error('Error fetching tickets:', error)
    // Return empty array in case of error to prevent UI from breaking
    return { tickets: [] }
  }
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
