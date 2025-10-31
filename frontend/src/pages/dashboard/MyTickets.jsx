import { useEffect, useState } from 'react'
import { getMyOrders } from '../../services/orders'
import QRCode from 'react-qr-code'

// Format date as 'MMM d, yyyy'
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
import { format } from 'date-fns'

export default function MyTickets () {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getMyOrders().then((res) => {
      if (!mounted) return
      setOrders(res.orders || [])
    }).finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  return (
    <div className='max-w-6xl mx-auto p-4'>
      <h1 className='text-2xl font-semibold mb-4'>My Tickets</h1>
      {loading && <div>Loading...</div>}
      {!loading && orders.length === 0 && <div>No orders yet.</div>}
      <ul className='space-y-4'>
        {orders.map(o => (
          <li key={o.id} className='border rounded p-4 bg-white'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-sm text-gray-600'>Order #{o.id?.slice(0, 8) || 'N/A'}</div>
                <div className='font-medium text-lg'>{o.event?.title || 'Event'}</div>
                <div className='text-sm text-gray-700 mt-1'>
                  {o.event?.venue_name || 'Venue not specified'}
                </div>
                <div className='text-xs text-gray-500 mt-1'>
                  {o.event?.start_date ? formatDate(o.event.start_date) : 'Date not specified'}
                </div>
                <div className='text-xs text-gray-500 mt-1'>
                  Ordered on {o.created_at ? formatDate(o.created_at) : 'N/A'}
                </div>
              </div>
              <div className='text-sm px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200'>{o.status}</div>
            </div>
            <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
              {(o.items || []).map((it, idx) => (
                <div key={it.id || idx} className='border rounded p-3 flex flex-col items-center'>
                  <div className='w-full'>
                    <div className='text-sm font-medium mb-2 text-center'>
                      {it.ticket_type?.name || 'General Admission'}
                    </div>
                    <div className='flex justify-center bg-white p-2 mb-2 border rounded'>
                      <QRCode 
                        value={it.qr_code || ''} 
                        size={120} 
                        level='M' 
                        includeMargin={false}
                      />
                    </div>
                    <div className='text-xs text-gray-600 text-center mb-1'>
                      {o.event?.title}
                    </div>
                    <div className='text-xs text-gray-500 text-center'>
                      {o.event?.venue_name}
                    </div>
                    <div className='text-xs text-gray-500 text-center mt-1'>
                      {o.event?.start_date ? formatDate(o.event.start_date) : ''}
                    </div>
                    <div className='mt-2 text-xs text-center'>
                      <span className='font-medium'>Qty:</span> {it.quantity} • 
                      <span className='font-medium'>KES</span> {(it.unit_price || 0).toFixed(2)}
                    </div>
                    {it.qr_code && (
                      <div className='mt-1 text-[10px] text-gray-400 text-center break-all'>
                        {it.qr_code}
                      </div>
                    )}
                  </div>
                  {it.checked_in && (
                    <div className='mt-2 text-xs text-green-700'>Checked in at {it.checked_in_at ? new Date(it.checked_in_at).toLocaleString() : ''}</div>
                  )}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
