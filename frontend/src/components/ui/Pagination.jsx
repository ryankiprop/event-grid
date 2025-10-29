import { Link, useSearchParams } from 'react-router-dom'

export default function Pagination ({ page, pages }) {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const mk = (p) => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    sp.set('page', String(p))
    return `/events?${sp.toString()}`
  }
  if (!pages || pages <= 1) return null
  return (
    <div className='flex items-center gap-2 justify-center mt-4'>
      <Link to={mk(Math.max(1, page - 1))} className={`px-3 py-1 border rounded ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}>Prev</Link>
      <span className='text-sm'>Page {page} of {pages}</span>
      <Link to={mk(Math.min(pages, page + 1))} className={`px-3 py-1 border rounded ${page >= pages ? 'pointer-events-none opacity-50' : ''}`}>Next</Link>
    </div>
  )
}
