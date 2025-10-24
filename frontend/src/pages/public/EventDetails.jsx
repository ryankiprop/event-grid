import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchEvent } from '../../services/events'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import TicketSelector from '../../components/events/TicketSelector'
import { createOrder } from '../../services/orders'
import { initiateMpesa, getPayment } from '../../services/payments'
import { useAuth } from '../../context/AuthContext'
import TicketManager from '../../components/events/TicketManager'

export default function EventDetails() {
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
  if (error) return <div className="max-w-4xl mx-auto p-4 text-red-600">{error}</div>
  if (!event) return <div className="max-w-4xl mx-auto p-4">Event not found</div>

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-4"><Link to="/events" className="text-primary-600">← Back to events</Link></div>
        <div className="bg-white rounded shadow overflow-hidden">
          {event.banner_image_url && (
            <img src={event.banner_image_url} alt={event.title} className="w-full h-64 object-cover" />
          )}
          <div className="p-6">
            <h1 className="text-2xl font-semibold mb-2">{event.title}</h1>
            <div className="text-sm text-gray-600 mb-4">
              {event.venue_name && <span className="mr-2">{event.venue_name}</span>}
              {event.category && <span className="px-2 py-0.5 bg-gray-100 rounded">{event.category}</span>}
            </div>
            {event.description && <p className="leading-relaxed text-gray-800 whitespace-pre-line mb-6">{event.description}</p>}

            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-2">Tickets</h2>
              <TicketSelector eventId={event.id} onChange={(items, tickets) => { setCartItems(items); setTicketTypes(tickets || []) }} />
              <div className="flex items-center justify-between mt-4">
                <div className="text-lg font-medium">Total KES {totalCents/100}</div>
                <div className="flex items-center gap-2">
                  {import.meta.env.VITE_ENABLE_FREE_CHECKOUT === 'true' && (
                    <button onClick={onPurchase} disabled={submitting || mpesaPending} className="bg-gray-200 text-gray-800 px-4 py-2 rounded">
                      {submitting ? 'Processing…' : 'Free Checkout (dev)'}
                    </button>
                  )}
                  <input
                    className="border rounded px-3 py-2 w-56"
                    placeholder="2547XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <button onClick={onPayMpesa} disabled={mpesaPending} className="bg-primary-600 text-white px-4 py-2 rounded">
                    {mpesaPending ? 'Waiting for M-Pesa…' : 'Pay with M-Pesa'}
                  </button>
                </div>
              </div>
              {status?.err && <div className="text-red-600 mt-2">{status.err}</div>}
              {status?.ok && <div className="text-green-700 mt-2">{status.ok}</div>}
            </div>

            {(user?.role === 'admin' || (user?.role === 'organizer' && user?.id === event.organizer_id)) && (
              <div className="mt-8 border-t pt-4">
                <TicketManager eventId={event.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
