import { useEffect, useState } from 'react'
import { getMyOrders } from '../../services/orders'
import QRCode from 'react-qr-code'

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
                <div className='text-sm text-gray-600'>Order #{o.id}</div>
                <div className='font-medium'>Total KES {(o.total_amount || 0) / 100}</div>
                <div className='text-xs text-gray-500'>Created {new Date(o.created_at).toLocaleString()}</div>
              </div>
              <div className='text-sm px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200'>{o.status}</div>
            </div>
            <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
              {(o.items || []).map((it, idx) => (
                <div key={it.id || idx} className='border rounded p-3 flex flex-col items-center'>
                  <div className='text-sm text-gray-700 mb-2'>Ticket #{idx + 1}</div>
                  <div className='bg-white p-2'>
                    <QRCode value={it.qr_code || ''} size={128} />
                  </div>
                  <div className='mt-2 text-xs text-gray-500 break-all'>{it.qr_code}</div>
                  <div className='mt-2 text-xs'>Qty: {it.quantity} • Price: KES {(it.unit_price || 0) / 100}</div>
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
