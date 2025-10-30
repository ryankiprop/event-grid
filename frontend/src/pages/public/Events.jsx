import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { fetchEvents } from '../../services/events'
import SearchBar from '../../components/ui/SearchBar'
import EventCard from '../../components/events/EventCard'
import Pagination from '../../components/ui/Pagination'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { useAuth } from '../../context/AuthContext'

export default function Events () {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // New filters
  const q = params.get('q') || ''
  const page = parseInt(params.get('page') || '1', 10)
  const category = params.get('category') || ''
  const startDate = params.get('start_date') || ''
  const endDate = params.get('end_date') || ''
  const minPrice = params.get('min_price') || ''
  const maxPrice = params.get('max_price') || ''

  // Helper for updating params
  const updateParam = (name, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    next.set('page', '1') // reset to first page on new filter
    setParams(next)
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchEvents({ q, page, perPage: 12, category, startDate, endDate, minPrice, maxPrice })
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
  }, [q, page, category, startDate, endDate, minPrice, maxPrice])

  // Dummy category options (you can fetch dynamically if needed)
  const categoryOptions = [
    '', 'Music', 'Business', 'Sports', 'Education', 'Food', 'Art', 'Tech'
  ]

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-6xl mx-auto p-4'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2'>
          <h1 className='text-2xl font-semibold'>Browse Events</h1>
          <div className='w-full max-w-md'><SearchBar /></div>
        </div>
        {/* Filters */}
        <div className='flex flex-wrap gap-4 mb-6 bg-white border border-gray-200 rounded p-4'>
          <div>
            <label className='block text-xs mb-1'>Category</label>
            <select className='border rounded px-2 py-1' value={category} onChange={e => updateParam('category', e.target.value)}>
              {categoryOptions.map(cat => <option value={cat} key={cat}>{cat || 'All'}</option>)}
            </select>
          </div>
          <div>
            <label className='block text-xs mb-1'>Start Date</label>
            <input type='date' value={startDate} onChange={e => updateParam('start_date', e.target.value)} className='border rounded px-2 py-1' />
          </div>
          <div>
            <label className='block text-xs mb-1'>End Date</label>
            <input type='date' value={endDate} onChange={e => updateParam('end_date', e.target.value)} className='border rounded px-2 py-1' />
          </div>
          <div>
            <label className='block text-xs mb-1'>Min Price (KES)</label>
            <input type='number' min='0' value={minPrice} onChange={e => updateParam('min_price', e.target.value)} className='border rounded px-2 py-1 w-24' />
          </div>
          <div>
            <label className='block text-xs mb-1'>Max Price (KES)</label>
            <input type='number' min='0' value={maxPrice} onChange={e => updateParam('max_price', e.target.value)} className='border rounded px-2 py-1 w-24' />
          </div>
        </div>
        {loading && <LoadingSpinner />}
        {error && <div className='text-red-600 mb-4'>{error}</div>}
        {!loading && !error && (
          <>
            {items.length > 0
              ? (
                <>
                  <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                    {items.map((e) => <EventCard key={e.id} event={e} />)}
                  </div>
                  <Pagination page={meta.page} pages={meta.pages} />
                </>
                )
              : (
                <div className='bg-white border rounded p-8 text-center'>
                  <div className='text-lg font-medium mb-2'>No events found</div>
                  {user?.role === 'organizer'
                    ? (
                      <div>
                        <div className='text-gray-600 mb-3'>Create your first event to get started.</div>
                        <Link to='/dashboard/my-events' className='inline-block bg-primary-600 text-white px-4 py-2 rounded'>Create Event</Link>
                      </div>
                      )
                    : (
                      <div className='text-gray-600'>Please check back later or adjust your search.</div>
                      )}
                </div>
                )}
          </>
        )}
      </div>
    </div>
  )
}
