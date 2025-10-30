import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchEvent } from '../../services/events'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import TicketSelector from '../../components/events/TicketSelector'
import { createOrder } from '../../services/orders'
import { useAuth } from '../../context/AuthContext'
import TicketManager from '../../components/events/TicketManager'

export default function EventDetails () {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [ticketTypes, setTicketTypes] = useState([])
  const [phone, setPhone] = useState('')
  

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchEvent(id)
      .then((res) => {
        if (!mounted) return
        setEvent(res.event)
        setError(null)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.response?.data?.message || 'Failed to load event')
      })
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [id])

  if (loading) return <LoadingSpinner />
  if (error) return <div className='max-w-4xl mx-auto p-4 text-red-600'>{error}</div>
  if (!event) return <div className='max-w-4xl mx-auto p-4'>Event not found</div>

  const totalCents = (cartItems || []).reduce((sum, it) => {
    const tt = ticketTypes?.find(t => t.id === it.ticket_type_id)
    return sum + ((tt?.price || 0) * (it.quantity || 0))
  }, 0)

  

  const onPurchase = async () => {
    if (!user) {
      setStatus({ err: 'Please login to get tickets.' });
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    
    if (!cartItems.length) {
      setStatus({ err: 'Please select at least one ticket.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      // Prepare the order data
      const orderData = {
        event_id: event.id,
        items: cartItems.map(item => ({
          ticket_type_id: item.ticket_type_id || item.id,
          quantity: parseInt(item.quantity) || 1
        }))
      };

      // Create the order
      const response = await createOrder(orderData);
      
      // Clear the cart
      setCartItems([]);
      
      // Navigate to the tickets dashboard or order confirmation
      if (response && response.id) {
        navigate(`/dashboard/tickets`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error?.response?.data?.message || 
                         error?.message || 
                         'Failed to process your request. Please try again.';
      setStatus({ err: errorMessage });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-4xl mx-auto p-4'>
        <div className='mb-4'><Link to='/events' className='text-primary-600'>← Back to events</Link></div>
        <div className='bg-white rounded shadow overflow-hidden'>
          {event.banner_image_url && (
            <img src={event.banner_image_url} alt={event.title} className='w-full h-64 object-cover' />
          )}
          <div className='p-6'>
            <h1 className='text-2xl font-semibold mb-2'>{event.title}</h1>
            <div className='text-sm text-gray-600 mb-4'>
              {event.venue_name && <span className='mr-2'>{event.venue_name}</span>}
              {event.category && <span className='px-2 py-0.5 bg-gray-100 rounded'>{event.category}</span>}
            </div>
            {event.description && <p className='leading-relaxed text-gray-800 whitespace-pre-line mb-6'>{event.description}</p>}

            <div className='border-t pt-6'>
              <h2 className='text-xl font-semibold mb-4'>Get Your Tickets</h2>
              <TicketSelector eventId={event.id} onChange={(items, tickets) => { setCartItems(items); setTicketTypes(tickets || []) }} />
              
              {cartItems.length > 0 && (
                <div className='mt-6 space-y-4'>
                  <div className='flex items-center justify-between border-t border-b border-gray-200 py-4'>
                    <span className='text-lg font-medium'>Total:</span>
                    <span className='text-xl font-bold text-primary-600'>KES {totalCents / 100}</span>
                  </div>

                  {/* Free Checkout Button */}
                  <button 
                    onClick={onPurchase} 
                    disabled={submitting}
                    className={`w-full py-3 px-4 rounded-md font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors ${submitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {submitting ? 'Processing...' : 'Get Tickets'}
                  </button>
                  
                </div>
              )}
              
              {status?.err && <div className='mt-3 p-3 bg-red-50 text-red-700 rounded-md text-sm'>{status.err}</div>}
              {status?.ok && <div className='mt-3 p-3 bg-green-50 text-green-700 rounded-md text-sm'>{status.ok}</div>}
            </div>

            {(user?.role === 'admin' || (user?.role === 'organizer' && user?.id === event.organizer_id)) && (
              <div className='mt-8 border-t pt-4'>
                <TicketManager eventId={event.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
