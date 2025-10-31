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
  // Convert price to cents before sending to the server
  const ticketData = {
    ...data,
    price: Math.round(parseFloat(data.price || 0) * 100) // Convert to cents
  };
  
  const res = await api.post(`/events/${eventId}/tickets`, ticketData);
  return res.data;
}

export const updateTicketType = async (ticketId, data) => {
  // Convert price to cents before sending to the server
  const ticketData = {
    ...data,
    price: Math.round(parseFloat(data.price || 0) * 100) // Convert to cents
  };
  
  const res = await api.put(`/tickets/${ticketId}`, ticketData);
  return res.data;
}

export const deleteTicketType = async (ticketId) => {
  const res = await api.delete(`/tickets/${ticketId}`);
  return res.data;
}
