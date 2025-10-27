import { useEffect, useState } from 'react'
import { getEventTickets } from '../../services/tickets'

export default function TicketSelector({ eventId, onChange }) {
  const [tickets, setTickets] = useState([])
  const [quantities, setQuantities] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getEventTickets(eventId)
      .then((res) => {
        if (!mounted) return
        const list = res.tickets || []
        setTickets(list)
        const initial = {}
        list.forEach(t => { initial[t.id] = 0 })
        setQuantities(initial)
        setError(null)
      })
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load ticket types'))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [eventId])

  useEffect(() => {
    const items = Object.entries(quantities)
      .filter(([, q]) => q > 0)
      .map(([ticket_type_id, quantity]) => ({ ticket_type_id, quantity }))
    onChange?.(items, tickets)
  }, [quantities, onChange, tickets])

  const updateQty = (id, delta) => {
    setQuantities(q => ({ ...q, [id]: Math.max(0, (q[id] || 0) + delta) }))
  }

  if (loading) return <div>Loading tickets...</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!tickets.length) return <div>No ticket types available.</div>

  return (
    <div className="space-y-3">
      {tickets.map(t => (
        <div key={t.id} className="flex items-center justify-between border rounded p-3">
          <div>
            <div className="font-medium">{t.name}</div>
            <div className="text-sm text-gray-600">${(t.price||0)/100} • {t.quantity_total - (t.quantity_sold||0)} left</div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="px-2 py-1 border rounded" onClick={() => updateQty(t.id, -1)}>-</button>
            <span>{quantities[t.id] || 0}</span>
            <button type="button" className="px-2 py-1 border rounded" onClick={() => updateQty(t.id, 1)}>+</button>
          </div>
        </div>
      ))}
    </div>
  )
}