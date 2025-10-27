import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchEvent, getEventStats } from '../../services/events'
import { getEventOrders } from '../../services/orders'

function toCsv (orders) {
  const header = ['order_id', 'created_at', 'buyer_id', 'event_id', 'item_ticket_type_id', 'item_quantity', 'item_unit_price', 'order_total']
  const rows = []
  orders.forEach(o => {
    if ((o.items || []).length === 0) {
      rows.push([o.id, o.created_at, o.user_id, o.event_id, '', '', '', o.total_amount])
    } else {
      o.items.forEach(it => {
        rows.push([o.id, o.created_at, o.user_id, o.event_id, it.ticket_type_id, it.quantity, it.unit_price, o.total_amount])
      })
    }
  })
  return [header, ...rows].map(r => r.join(',')).join('\n')
}

export default function EventOrders () {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([fetchEvent(id), getEventOrders(id), getEventStats(id)])
      .then(([evRes, orRes, stRes]) => { setEvent(evRes.event); setOrders(orRes.orders || []); setStats(stRes.stats || null); setError(null) })
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load attendees'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const downloadCsv = () => {
    const csv = toCsv(orders)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `event_${id}_orders.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className='max-w-6xl mx-auto p-4'>
      <div className='mb-4 flex items-center justify-between'>
        <div>
          <div className='text-sm'><Link to='/dashboard/my-events' className='text-primary-600'>← Back to My Events</Link></div>
          <h1 className='text-2xl font-semibold'>Attendees / Orders {event ? `- ${event.title}` : ''}</h1>
        </div>
        <button className='bg-primary-600 text-white px-4 py-2 rounded' onClick={downloadCsv}>Export CSV</button>
      </div>
      {stats && (
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-4'>
          <div className='bg-white border rounded p-3'>
            <div className='text-sm text-gray-600'>Tickets Sold</div>
            <div className='text-xl font-semibold'>{stats.tickets_sold} / {stats.tickets_total}</div>
          </div>
          <div className='bg-white border rounded p-3'>
            <div className='text-sm text-gray-600'>Remaining</div>
            <div className='text-xl font-semibold'>{stats.tickets_remaining}</div>
          </div>
          <div className='bg-white border rounded p-3'>
            <div className='text-sm text-gray-600'>Orders</div>
            <div className='text-xl font-semibold'>{stats.orders_count}</div>
          </div>
          <div className='bg-white border rounded p-3'>
            <div className='text-sm text-gray-600'>Revenue</div>
            <div className='text-xl font-semibold'>${(stats.revenue_cents || 0) / 100}</div>
          </div>
        </div>
      )}
      {loading && <div>Loading...</div>}
      {error && <div className='text-red-600'>{error}</div>}
      {!loading && !error && (
        <div className='overflow-x-auto bg-white border rounded'>
          <table className='min-w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='text-left px-3 py-2'>Order ID</th>
                <th className='text-left px-3 py-2'>Created</th>
                <th className='text-left px-3 py-2'>Buyer</th>
                <th className='text-left px-3 py-2'>Items</th>
                <th className='text-left px-3 py-2'>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className='border-t'>
                  <td className='px-3 py-2 text-sm'>{o.id}</td>
                  <td className='px-3 py-2 text-sm'>{o.created_at}</td>
                  <td className='px-3 py-2 text-sm'>{o.user_id}</td>
                  <td className='px-3 py-2 text-sm'>{(o.items || []).map(it => `${it.quantity} x ${it.ticket_type_id}`).join(', ')}</td>
                  <td className='px-3 py-2 text-sm'>${(o.total_amount || 0) / 100}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td className='px-3 py-4 text-center text-gray-600' colSpan={5}>No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
