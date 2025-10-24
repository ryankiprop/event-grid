import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getOrder } from '../../services/orders'
import QRCode from 'react-qr-code'

export default function OrderConfirmation() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getOrder(id)
      .then((res) => {
        if (!mounted) return
        setOrder(res.order)
      })
      .catch(() => mounted && setError('Unable to load order'))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [id])

  if (loading) return <div className="max-w-3xl mx-auto p-4">Loading...</div>
  if (error) return <div className="max-w-3xl mx-auto p-4 text-red-600">{error}</div>
  if (!order) return <div className="max-w-3xl mx-auto p-4">Order not found.</div>

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-2">Order Confirmed</h1>
      <div className="text-sm text-gray-600 mb-4">Order #{order.id}</div>
      <div className="mb-4">Total ${(order.total_amount || 0)/100}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {(order.items || []).map((it, idx) => (
          <div key={it.id || idx} className="border rounded p-3 flex flex-col items-center bg-white">
            <div className="text-sm text-gray-700 mb-2">Ticket #{idx+1}</div>
            <div className="bg-white p-2">
              <QRCode value={it.qr_code || ''} size={128} />
            </div>
            <div className="mt-2 text-xs text-gray-500 break-all">{it.qr_code}</div>
            <div className="mt-2 text-xs">Qty: {it.quantity} • Price: ${(it.unit_price||0)/100}</div>
            {it.checked_in && (
              <div className="mt-2 text-xs text-green-700">Checked in at {it.checked_in_at ? new Date(it.checked_in_at).toLocaleString() : ''}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
