import { useEffect, useState } from 'react'
import { getOrganizerStats } from '../../services/dashboard'

export default function OrganizerDashboard () {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getOrganizerStats().then((res) => {
      if (!mounted) return
      setStats(res.stats)
    }).finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
      <div className='bg-white border rounded p-4'>
        <div className='text-sm text-gray-600'>Events</div>
        <div className='text-2xl font-semibold'>{stats?.events_count ?? 0}</div>
      </div>
      <div className='bg-white border rounded p-4'>
        <div className='text-sm text-gray-600'>Orders</div>
        <div className='text-2xl font-semibold'>{stats?.orders_count ?? 0}</div>
      </div>
    </div>
  )
}
