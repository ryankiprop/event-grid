import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'

export default function Checkin () {
  const { id } = useParams()
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(!!window.Html5Qrcode)
  const scannerRef = useRef(null)
  const html5qrcodeRef = useRef(null)

  // Lazy load html5-qrcode from CDN once
  useEffect(() => {
    let mounted = true
    if (window.Html5Qrcode) {
      setScriptLoaded(true)
    } else {
      let script = document.getElementById('html5qrcode-cdn')
      if (!script) {
        script = document.createElement('script')
        script.src = 'https://unpkg.com/html5-qrcode@2.3.10/html5-qrcode.min.js'
        script.async = true
        script.id = 'html5qrcode-cdn'
        document.body.appendChild(script)
      }
      const onLoad = () => { if (mounted) setScriptLoaded(true) }
      script.addEventListener('load', onLoad)
      // in case it was cached and load already fired
      if (window.Html5Qrcode) setScriptLoaded(true)
      return () => { script.removeEventListener('load', onLoad) }
    }
    return () => { mounted = false }
  }, [])

  const markUsed = async () => {
    if (!result?.valid || !code) return
    try {
      setLoading(true)
      setError(null)
      await api.post('/checkin/mark', { event_id: id, code })
      // refresh verification to show updated state
      const verify = await api.post('/checkin/verify', { event_id: id, code })
      setResult(verify.data)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to mark as used')
    } finally {
      setLoading(false)
    }
  }

  const onVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await api.post('/checkin/verify', { event_id: id, code })
      setResult(res.data)
    } catch (e) {
      setError(e?.response?.data?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const startScan = async () => {
    if (!scriptLoaded || !window.Html5Qrcode) {
      setError('Scanner is still loading. Please wait a moment and try again.')
      return
    }
    try {
      setError(null)
      setResult(null)
      setScanning(true)
      const idEl = 'qr-region'
      if (!scannerRef.current) scannerRef.current = document.getElementById(idEl)
      if (!html5qrcodeRef.current) html5qrcodeRef.current = new window.Html5Qrcode(idEl)
      await html5qrcodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          setCode(decodedText)
          // auto verify once read
          try {
            setLoading(true)
            const res = await api.post('/checkin/verify', { event_id: id, code: decodedText })
            setResult(res.data)
          } catch (e) {
            setError(e?.response?.data?.message || 'Verification failed')
          } finally {
            setLoading(false)
          }
        },
        (errMsg) => {
          // ignore scan errors
        }
      )
    } catch (e) {
      setError('Failed to start camera. Please allow camera access or try another device.')
      setScanning(false)
    }
  }

  const stopScan = async () => {
    try {
      if (html5qrcodeRef.current && html5qrcodeRef.current.isScanning) {
        await html5qrcodeRef.current.stop()
      }
    } catch {}
    setScanning(false)
  }

  return (
    <div className='max-w-3xl mx-auto p-4'>
      <div className='mb-4'><Link to='/dashboard/my-events' className='text-primary-600'>← Back to My Events</Link></div>
      <h1 className='text-2xl font-semibold mb-4'>Check-in</h1>
      <form onSubmit={onVerify} className='flex items-center gap-2 mb-4'>
        <input className='flex-1 border rounded px-3 py-2' placeholder='Scan or paste code' value={code} onChange={e => setCode(e.target.value)} />
        <button type='submit' disabled={loading || !code.trim()} className='bg-primary-600 text-white px-4 py-2 rounded'>{loading ? 'Verifying...' : 'Verify'}</button>
      </form>
      <div className='mb-3 flex items-center gap-2'>
        {!scanning
          ? (
            <button onClick={startScan} className='px-3 py-2 border rounded'>Use Camera</button>
            )
          : (
            <button onClick={stopScan} className='px-3 py-2 border rounded'>Stop Camera</button>
            )}
      </div>
      <div id='qr-region' className='w-full max-w-md aspect-square bg-black/10 rounded mb-4' />
      {error && <div className='text-red-600 mb-2'>{error}</div>}
      {result && (
        <div className='bg-white border rounded p-4'>
          {result.valid
            ? (
              <div>
                <div className='text-green-700 font-semibold mb-2'>Valid ticket</div>
                <div className='text-sm text-gray-700'>Order: {result.order.id}</div>
                <div className='text-sm text-gray-700'>Buyer: {result.order.user_id}</div>
                <div className='text-sm text-gray-700'>Ticket Type: {result.order_item.ticket_type_id}</div>
                <div className='text-sm text-gray-700'>Quantity: {result.order_item.quantity}</div>
                {result.order_item.checked_in
                  ? (
                    <div className='mt-2 text-sm text-gray-700'>Already used at {result.order_item.checked_in_at || 'unknown time'}</div>
                    )
                  : (
                    <div className='mt-3'>
                      <button onClick={markUsed} disabled={loading} className='px-3 py-2 bg-primary-600 text-white rounded'>{loading ? 'Marking...' : 'Mark as used'}</button>
                    </div>
                    )}
              </div>
              )
            : (
              <div className='text-red-700 font-semibold'>Invalid ticket: {result.message}</div>
              )}
        </div>
      )}
    </div>
  )
}
