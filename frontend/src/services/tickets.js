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
  // Map frontend form fields to backend fields
  const ticketData = {
    name: data.name || 'General Admission',
    description: data.description || '',
    // If 'type' is used for price tier, map it to price
    price: data.type === 'vip' ? 10000 : 5000, // Example: VIP = $100.00, Regular = $50.00
    quantity_total: parseInt(data.quantity_available) || 100,
    // Set reasonable defaults for required fields
    min_per_order: 1,
    max_per_order: 10,
    is_active: true
  };
  
  const res = await api.post(`/events/${eventId}/tickets`, ticketData);
  return res.data;
}

export const updateTicketType = async (eventId, ticketId, data) => {
  // Convert price to cents before sending to the server
  const ticketData = {
    ...data,
    price: Math.round(parseFloat(data.price || 0) * 100) // Convert to cents
  };
  
  const res = await api.put(`/events/${eventId}/tickets/${ticketId}`, ticketData);
  return res.data;
}

export const deleteTicketType = async (eventId, ticketId) => {
  const res = await api.delete(`/events/${eventId}/tickets/${ticketId}`);
  return res.data;
}
