import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchEvent, updateEvent } from '../../services/events'

export default function EditEvent() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState(null)
  const [form, setForm] = useState({
    title: '', description: '', category: '', venue_name: '', address: '',
    start_date: '', end_date: '', banner_image_url: '', is_published: false,
  })

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchEvent(id)
      .then((res) => {
        if (!mounted) return
        const e = res.event
        setForm({
          title: e.title || '',
          description: e.description || '',
          category: e.category || '',
          venue_name: e.venue_name || '',
          address: e.address || '',
          start_date: e.start_date?.replace('Z', '') || '',
          end_date: e.end_date?.replace('Z', '') || '',
          banner_image_url: e.banner_image_url || '',
          is_published: !!e.is_published,
        })
        setError(null)
      })
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load event'))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [id])

  const onSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)
    try {
      const payload = { ...form }
      // If the timestamps look like 'YYYY-MM-DDTHH:mm:ss', keep as-is; backend expects ISO
      await updateEvent(id, payload)
      setStatus({ ok: 'Event updated' })
      navigate('/dashboard/my-events')
    } catch (err) {
      setStatus({ err: err?.response?.data?.message || 'Failed to update event' })
    }
  }

  if (loading) return <div className="max-w-4xl mx-auto p-4">Loading...</div>
  if (error) return <div className="max-w-4xl mx-auto p-4 text-red-600">{error}</div>

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4"><Link to="/dashboard/my-events" className="text-primary-600">← Back to My Events</Link></div>
      <h1 className="text-2xl font-semibold mb-4">Edit Event</h1>
      {status?.err && <div className="text-red-600 mb-2">{status.err}</div>}
      {status?.ok && <div className="text-green-700 mb-2">{status.ok}</div>}
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input className="w-full border rounded px-3 py-2" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm mb-1">Category</label>
          <input className="w-full border rounded px-3 py-2" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Description</label>
          <textarea rows={4} className="w-full border rounded px-3 py-2" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm mb-1">Venue</label>
          <input className="w-full border rounded px-3 py-2" value={form.venue_name} onChange={e => setForm(f => ({ ...f, venue_name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm mb-1">Address</label>
          <input className="w-full border rounded px-3 py-2" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm mb-1">Start (ISO)</label>
          <input className="w-full border rounded px-3 py-2" placeholder="2025-10-15T10:00:00" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm mb-1">End (ISO)</label>
          <input className="w-full border rounded px-3 py-2" placeholder="2025-10-15T12:00:00" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Banner image URL</label>
          <input className="w-full border rounded px-3 py-2" value={form.banner_image_url} onChange={e => setForm(f => ({ ...f, banner_image_url: e.target.value }))} />
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <input id="is_published" type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
          <label htmlFor="is_published">Published</label>
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded">Save Changes</button>
        </div>
      </form>
    </div>
  )
}