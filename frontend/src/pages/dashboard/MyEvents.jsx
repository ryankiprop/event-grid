/* global alert */

import { useEffect, useState } from 'react'
import { fetchEvents, updateEvent, deleteEvent } from '../../services/events'
import EventForm from '../../components/events/EventForm'
import { Link } from 'react-router-dom'

export default function MyEvents () {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    fetchEvents({ mine: true, per_page: 50 })
      .then((res) => {
        setItems(res.items || [])
        setError(null)
      })
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load events'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className='max-w-6xl mx-auto p-4 space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold mb-2'>My Events</h1>
        <p className='text-gray-600'>Create and manage your events.</p>
      </div>
      <EventForm onCreated={() => load()} />
      <div>
        <h2 className='text-xl font-semibold mb-2'>Your Events</h2>
        {loading && <div>Loading...</div>}
        {error && <div className='text-red-600'>{error}</div>}
        {!loading && !error && (
          <ul className='space-y-2'>
            {items.map(ev => (
              <li key={ev.id} className='p-3 border rounded bg-white'>
                <div className='flex items-center justify-between gap-4'>
                  <div>
                    <div className='font-medium'>{ev.title}</div>
                    <div className='text-sm text-gray-600'>{ev.start_date} → {ev.end_date}</div>
                    <div className='mt-1 text-xs'>
                      <span className={`px-2 py-0.5 rounded ${ev.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {ev.is_published ? 'Published' : 'Unpublished'}
                      </span>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {ev.is_published
                      ? (
                        <button
                          className='px-3 py-1 border rounded'
                          onClick={async () => { await updateEvent(ev.id, { is_published: false }); load() }}
                        >Unpublish
                        </button>
                        )
                      : (
                        <button
                          className='px-3 py-1 border rounded'
                          onClick={async () => { await updateEvent(ev.id, { is_published: true }); load() }}
                        >Publish
                        </button>
                        )}
                    <Link to={`/dashboard/events/${ev.id}/edit`} className='px-3 py-1 border rounded'>Edit</Link>
                    <Link to={`/dashboard/events/${ev.id}/orders`} className='px-3 py-1 border rounded'>Attendees</Link>
                    <Link to={`/dashboard/events/${ev.id}/checkin`} className='px-3 py-1 border rounded'>Check-in</Link>
                    <button
                      className='px-3 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50'
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to delete "${ev.title}"? This action cannot be undone.`)) {
                          try {
                            await deleteEvent(ev.id)
                            load()
                          } catch (e) {
                            alert('Failed to delete event')
                          }
                        }
                      }}
                    >Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {items.length === 0 && <li className='text-gray-600'>No events yet.</li>}
          </ul>
        )}
      </div>
    </div>
  )
}
