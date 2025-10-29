import { useEffect, useState } from 'react'
import { getMyOrders } from '../../services/orders'
import { Link } from 'react-router-dom'

export default function UserDashboard () {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    getMyOrders().then((res) => {
      if (!mounted) return
      setOrders(res.orders || [])
      setError(null)
    }).catch((e) => {
      if (!mounted) return
      setError(e?.response?.data?.message || 'Failed to load orders')
    }).finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div className='text-red-600'>Error: {error}</div>

  return (
    <div>
      <h2 className='text-xl font-semibold mb-4'>My Orders</h2>
      {orders.length === 0 ? (
        <div className='text-gray-600'>No orders yet. <Link to='/events' className='text-primary-600'>Browse events</Link></div>
      ) : (
        <div className='space-y-4'>
          {orders.map(order => (
            <div key={order.id} className='bg-white border rounded p-4'>
              <div className='flex justify-between items-start mb-2'>
                <div>
                  <Link to={`/orders/${order.id}/confirmation`} className='font-medium text-primary-600'>
                    Order #{order.id.slice(-8)}
                  </Link>
                  <div className='text-sm text-gray-600'>
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className='text-right'>
                  <div className={`text-sm px-2 py-1 rounded ${
                    order.status === 'paid' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </div>
                  <div className='text-lg font-semibold mt-1'>
                    KES {order.total_amount / 100}
                  </div>
                </div>
              </div>
              {order.items && order.items.length > 0 && (
                <div className='text-sm text-gray-600'>
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)} tickets
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}