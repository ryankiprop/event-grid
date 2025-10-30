import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchEvent } from '../../services/events'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import TicketSelector from '../../components/events/TicketSelector'
import { createOrder } from '../../services/orders'
import { initiateMpesa, getPayment } from '../../services/payments'
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
  const [mpesaPending, setMpesaPending] = useState(false)
  const [mpesaPaymentId, setMpesaPaymentId] = useState(null)

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

  const onPayMpesa = async () => {
    if (!user) {
      setStatus({ err: 'Please login to purchase tickets.' })
      return
    }
    if (!cartItems.length) {
      setStatus({ err: 'Select at least one ticket.' })
      return
    }
    if (!/^2547\d{8}$/.test(phone.trim())) {
      setStatus({ err: 'Enter phone in format 2547XXXXXXXX' })
      return
    }
    setStatus(null)
    setMpesaPending(true)
    try {
      const res = await initiateMpesa({ event_id: event.id, phone: phone.trim(), items: cartItems })
      const pid = res?.payment?.id
      const oid = res?.order?.id
      setMpesaPaymentId(pid)
      // poll status until success/failed or timeout ~2 minutes
      const started = Date.now()
      const poll = async () => {
        try {
          const st = await getPayment(pid)
          const statusVal = st?.payment?.status
          if (statusVal === 'success') {
            setMpesaPending(false)
            navigate(`/orders/${oid}/confirmation`)
            return
          }
          if (statusVal === 'failed' || Date.now() - started > 120000) {
            setMpesaPending(false)
            setStatus({ err: 'Payment not completed. You can try again.' })
            return
          }
        } catch {}
        setTimeout(poll, 3000)
      }
      poll()
    } catch (e) {
      setMpesaPending(false)
      setStatus({ err: e?.response?.data?.message || 'Failed to initiate M-Pesa payment' })
    }
  }

  const onPurchase = async () => {
    if (!user) {
      setStatus({ err: 'Please login to purchase tickets.' })
      return
    }
    if (!cartItems.length) {
      setStatus({ err: 'Select at least one ticket.' })
      return
    }
    setSubmitting(true)
    setStatus(null)
    try {
      const res = await createOrder({ event_id: event.id, items: cartItems })
      setCartItems([])
      navigate(`/orders/${res.order.id}/confirmation`)
    } catch (e) {
      setStatus({ err: e?.response?.data?.message || 'Checkout failed' })
    } finally {
      setSubmitting(false)
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
                    disabled={submitting || mpesaPending}
                    className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${totalCents > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-primary-600 hover:bg-primary-700'} ${(submitting || mpesaPending) ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {submitting ? (
                      'Processing...'
                    ) : totalCents > 0 ? (
                      'Complete Free Registration'
                    ) : (
                      'Get Free Ticket'
                    )}
                  </button>

                  {/* OR Divider */}
                  <div className='relative my-2'>
                    <div className='absolute inset-0 flex items-center'>
                      <div className='w-full border-t border-gray-300'></div>
                    </div>
                    <div className='relative flex justify-center text-sm'>
                      <span className='px-2 bg-white text-gray-500'>OR</span>
                    </div>
                  </div>

                  {/* M-Pesa Payment */}
                  <div className='space-y-3'>
                    <div className='flex items-center gap-2'>
                      <input
                        type='tel'
                        className='flex-1 border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                        placeholder='2547XXXXXXXX'
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                      <button 
                        onClick={onPayMpesa} 
                        disabled={mpesaPending || !phone}
                        className={`px-6 py-2 rounded-md font-medium text-white ${mpesaPending ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors ${!phone ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {mpesaPending ? 'Processing...' : 'Pay with M-Pesa'}
                      </button>
                    </div>
                    <p className='text-xs text-gray-500'>
                      Enter your M-Pesa registered phone number (e.g., 254712345678)
                    </p>
                  </div>
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
