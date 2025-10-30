import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react';
import api from '../../services/api';

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export default function EventCard ({ event }) {
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTicketTypes = async () => {
      try {
        const response = await api.get(`/events/${event.id}/tickets`);
        setTicketTypes(response.data.tickets || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching ticket types:', err);
        setError('Failed to load ticket types');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketTypes();
  }, [event.id]);

  // Get the lowest and highest ticket prices
  const getPriceRange = () => {
    if (!ticketTypes.length) return 'Free';
    
    const prices = ticketTypes
      .filter(ticket => ticket.price > 0)
      .map(ticket => ticket.price);
    
    if (prices.length === 0) return 'Free';
    
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    return min === max 
      ? formatCurrency(min / 100) 
      : `${formatCurrency(min / 100)} - ${formatCurrency(max / 100)}`;
  };

  return (
    <div className='border rounded overflow-hidden bg-white hover:shadow-lg transition transform hover:-translate-y-0.5 flex flex-col h-full'>
      <Link to={`/events/${event.id}`} className='block flex-grow'>
        {event.banner_image_url && (
          <img 
            src={event.banner_image_url} 
            alt={event.title} 
            className='w-full h-40 object-cover'
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/400x200?text=Event+Image';
            }}
          />
        )}
        <div className='p-4'>
          <h3 className='text-lg font-semibold mb-1 line-clamp-1'>{event.title}</h3>
          <div className='text-primary-600 font-medium text-sm mb-2'>{getPriceRange()}</div>
          <p className='text-sm text-gray-600 line-clamp-2 mb-2'>{event.description}</p>
          <div className='text-xs text-gray-500 flex flex-wrap gap-1 mb-2'>
            {event.category && <span className='px-2 py-0.5 bg-gray-100 rounded'>{event.category}</span>}
            {event.venue_name && <span className='px-2 py-0.5 bg-gray-100 rounded'>{event.venue_name}</span>}
          </div>
          
          {/* Display ticket types */}
          {!loading && ticketTypes.length > 0 && (
            <div className='mt-2'>
              <div className='text-xs font-medium text-gray-700 mb-1'>Tickets:</div>
              <div className='space-y-1 max-h-24 overflow-y-auto pr-1'>
                {ticketTypes.map((ticket) => (
                  <div key={ticket.id} className='flex justify-between text-xs'>
                    <span className='truncate'>{ticket.name}</span>
                    <span className='whitespace-nowrap ml-2'>
                      {ticket.price > 0 ? formatCurrency(ticket.price / 100) : 'Free'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {loading && !error && (
            <div className='text-xs text-gray-500 mt-1'>Loading tickets...</div>
          )}
          
          {error && !loading && (
            <div className='text-xs text-red-500 mt-1'>{error}</div>
          )}
        </div>
      </Link>
      
      <div className='p-4 pt-0 mt-auto'>
        <Link 
          to={`/events/${event.id}`} 
          className='w-full text-center block text-sm bg-primary-600 text-white px-3 py-2 rounded hover:bg-primary-700 transition'
        >
          View Details
        </Link>
      </div>
    </div>
  )
}
