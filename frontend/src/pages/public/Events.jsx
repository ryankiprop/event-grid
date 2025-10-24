import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchEvents } from '../../services/events'
import SearchBar from '../../components/ui/SearchBar'
import EventCard from '../../components/events/EventCard'
import Pagination from '../../components/ui/Pagination'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'

export default function Events() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const q = params.get('q') || ''
  const page = parseInt(params.get('page') || '1', 10)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchEvents({ q, page, per_page: 12 })
      .then((res) => {
        if (!mounted) return
        setItems(res.items || [])
        setMeta(res.meta || { page: 1, pages: 1 })
        setError(null)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.response?.data?.message || 'Failed to load events')
      })
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [q, page])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Browse Events</h1>
          <div className="w-full max-w-md"><SearchBar /></div>
        </div>
        {loading && <LoadingSpinner />}
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {!loading && !error && (
          <>
            {items.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((e) => <EventCard key={e.id} event={e} />)}
                </div>
                <Pagination page={meta.page} pages={meta.pages} />
              </>
            ) : (
              <div className="bg-white border rounded p-8 text-center">
                <div className="text-lg font-medium mb-2">No events found</div>
                {user?.role === 'organizer' ? (
                  <div>
                    <div className="text-gray-600 mb-3">Create your first event to get started.</div>
                    <Link to="/dashboard/my-events" className="inline-block bg-primary-600 text-white px-4 py-2 rounded">Create Event</Link>
                  </div>
                ) : (
                  <div className="text-gray-600">Please check back later or adjust your search.</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
