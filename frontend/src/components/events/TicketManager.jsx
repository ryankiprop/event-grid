import { useEffect, useState } from 'react'
import { getEventOrders } from '../../services/orders'

export default function TicketManager ({ eventId }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (eventId) {
      getEventOrders(eventId)
        .then(res => {
          setOrders(res.orders || [])
          setError(null)
        })
        .catch(e => setError(e?.response?.data?.message || 'Failed to load orders'))
        .finally(() => setLoading(false))
    }
  }, [eventId])

  if (loading) return <div>Loading orders...</div>
  if (error) return <div className='text-red-600'>Error: {error}</div>

  return (
    <div>
      <h3 className='text-lg font-semibold mb-2'>Orders ({orders.length})</h3>
      {orders.length === 0 ? (
        <div className='text-gray-600'>No orders yet</div>
      ) : (
        <div className='space-y-2'>
          {orders.slice(0, 5).map(order => (
            <div key={order.id} className='border rounded p-3 bg-gray-50'>
              <div className='flex justify-between text-sm'>
                <span>Order #{order.id.slice(-8)}</span>
                <span>{order.status}</span>
              </div>
              <div className='text-xs text-gray-600 mt-1'>
                {order.items?.length || 0} tickets • KES {order.total_amount / 100}
              </div>
            </div>
          ))}
          {orders.length > 5 && (
            <div className='text-center text-sm text-gray-600 mt-2'>
              And {orders.length - 5} more orders...
            </div>
          )}
        </div>
      )}
    </div>
  )
}