import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchEvents } from '../../services/events'
import EventCard from '../../components/events/EventCard'

export default function Home() {
  const navigate = useNavigate()
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [loc, setLoc] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    let mounted = true
    fetchEvents({ per_page: 4 })
      .then((res) => { if (!mounted) return; setFeatured(res.items || []); setError(null) })
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load featured events'))
      .finally(() => setLoading(false))
    return () => { mounted = false }
  }, [])

  const onSearch = (e) => {
    e?.preventDefault()
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    // loc/date are placeholders for future filtering; for now just use q
    navigate(`/events?${params.toString()}`)
  }

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative bg-gray-900 text-white">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-40"
            src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=2000&auto=format&fit=crop"
            alt="vibrant event"
          />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-20">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Discover Unforgettable Experiences</h1>
          <p className="text-lg text-gray-200 mb-6">Find and book tickets for amazing events happening in your city</p>
          <form onSubmit={onSearch} className="bg-white text-gray-800 rounded shadow p-3 grid grid-cols-1 md:grid-cols-4 gap-2">
            <input className="border rounded px-3 py-2" placeholder="Search events..." value={q} onChange={e => setQ(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Location (soon)" value={loc} onChange={e => setLoc(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Date (soon)" value={date} onChange={e => setDate(e.target.value)} />
            <button type="submit" className="bg-primary-600 text-white rounded px-4 py-2">Search</button>
          </form>
          <div className="mt-6 flex items-center gap-3">
            <Link to="/events" className="bg-white text-gray-900 rounded px-4 py-2">Browse Events</Link>
            <Link to="/create-event" className="bg-primary-600 text-white rounded px-4 py-2">Create Event</Link>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-xl font-semibold mb-4">Featured Events</h2>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        )}
      </section>

      
    </div>
  )
}
