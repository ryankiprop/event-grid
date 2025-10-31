import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchEvent, updateEvent } from '../../services/events'
import { getEventTickets } from '../../services/tickets'
import TicketTypesManager from '../../components/tickets/TicketTypesManager'

export default function EditEvent () {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    venue_name: '',
    address: '',
    start_date: '',
    end_date: '',
    banner_image_url: '',
    is_published: false
  })
  const [ticketTypes, setTicketTypes] = useState([])
  const [ticketsLoading, setTicketsLoading] = useState(true)

  // Load event data
  useEffect(() => {
    let mounted = true
    
    const loadEventData = async () => {
      try {
        setLoading(true)
        setTicketsLoading(true)
        
        // Fetch event details
        const eventRes = await fetchEvent(id)
        if (!mounted) return
        
        const e = eventRes.event
        setForm({
          title: e.title || '',
          description: e.description || '',
          category: e.category || '',
          venue_name: e.venue_name || '',
          address: e.address || '',
          start_date: e.start_date?.replace('Z', '') || '',
          end_date: e.end_date?.replace('Z', '') || '',
          banner_image_url: e.banner_image_url || '',
          is_published: !!e.is_published
        })
        
        // Fetch ticket types for this event
        const ticketsRes = await getEventTickets(id)
        if (!mounted) return
        
        setTicketTypes(ticketsRes.tickets || [])
        setError(null)
      } catch (err) {
        console.error('Error loading event data:', err)
        setError(err?.response?.data?.message || 'Failed to load event data')
      } finally {
        if (mounted) {
          setLoading(false)
          setTicketsLoading(false)
        }
      }
    }
    
    loadEventData()
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

  if (loading) return <div className='max-w-4xl mx-auto p-4'>Loading...</div>
  if (error) return <div className='max-w-4xl mx-auto p-4 text-red-600'>{error}</div>

  return (
    <div className='max-w-6xl mx-auto p-4'>
      <div className='mb-6'>
        <Link to='/dashboard/events' className='text-blue-600 hover:underline'>&larr; Back to My Events</Link>
        <h1 className='text-2xl font-semibold mt-2'>Edit Event</h1>
      </div>

      {error && <div className='mb-4 p-3 bg-red-100 text-red-700 rounded'>{error}</div>}
      {status && <div className='mb-4 p-3 bg-green-100 text-green-700 rounded'>{status}</div>}

      {loading ? (
        <div>Loading event details...</div>
      ) : (
        <>
          <form onSubmit={onSubmit} className='space-y-6 mb-8'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-gray-700'>Event Title*</label>
                <input
                  type='text'
                  name='title'
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className='w-full p-2 border rounded'
                  required
                />
              </div>

              <div className='space-y-2'>
                <label className='block text-sm font-medium text-gray-700'>Category</label>
                <input
                  type='text'
                  name='category'
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className='w-full p-2 border rounded'
                />
              </div>

              <div className='space-y-2'>
                <label className='block text-sm font-medium text-gray-700'>Start Date & Time*</label>
                <input
                  type='datetime-local'
                  name='start_date'
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className='w-full p-2 border rounded'
                  required
                />
              </div>

              <div className='space-y-2'>
                <label className='block text-sm font-medium text-gray-700'>End Date & Time*</label>
                <input
                  type='datetime-local'
                  name='end_date'
                  value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  className='w-full p-2 border rounded'
                  required
                />
              </div>

              <div className='space-y-2'>
                <label className='block text-sm font-medium text-gray-700'>Venue Name</label>
                <input
                  type='text'
                  name='venue_name'
                  value={form.venue_name}
                  onChange={e => setForm(f => ({ ...f, venue_name: e.target.value }))}
                  className='w-full p-2 border rounded'
                />
              </div>

              <div className='space-y-2'>
                <label className='block text-sm font-medium text-gray-700'>Address</label>
                <input
                  type='text'
                  name='address'
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className='w-full p-2 border rounded'
                />
              </div>

              <div className='space-y-2 md:col-span-2'>
                <label className='block text-sm font-medium text-gray-700'>Banner Image URL</label>
                <input
                  type='url'
                  name='banner_image_url'
                  value={form.banner_image_url}
                  onChange={e => setForm(f => ({ ...f, banner_image_url: e.target.value }))}
                  className='w-full p-2 border rounded'
                  placeholder='https://example.com/image.jpg'
                />
                {form.banner_image_url && (
                  <div className='mt-2'>
                    <img
                      src={form.banner_image_url}
                      alt='Event banner preview'
                      className='h-40 object-cover rounded border'
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              <div className='space-y-2 md:col-span-2'>
                <label className='block text-sm font-medium text-gray-700'>Description</label>
                <textarea
                  name='description'
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows='4'
                  className='w-full p-2 border rounded'
                />
              </div>

              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='is_published'
                  name='is_published'
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  className='h-4 w-4 text-blue-600 rounded'
                />
                <label htmlFor='is_published' className='text-sm font-medium text-gray-700'>
                  Publish this event
                </label>
              </div>
            </div>

            <div className='flex justify-end space-x-3 pt-4 border-t'>
              <button
                type='button'
                onClick={() => navigate('/dashboard/events')}
                className='px-4 py-2 border rounded hover:bg-gray-50'
              >
                Back to Events
              </button>
              <button
                type='submit'
                className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Event Details'}
              </button>
            </div>
          </form>

          {/* Ticket Types Management Section */}
          <div className='mt-12 pt-8 border-t'>
            <h2 className='text-xl font-semibold mb-6'>Ticket Types</h2>
            {ticketsLoading ? (
              <div>Loading ticket types...</div>
            ) : (
              <TicketTypesManager 
                eventId={id} 
                initialTicketTypes={ticketTypes} 
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
