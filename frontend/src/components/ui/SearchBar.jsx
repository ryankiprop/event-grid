import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function SearchBar ({ placeholder = 'Search events...' }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [term, setTerm] = useState(params.get('q') || '')

  const onSubmit = (e) => {
    e.preventDefault()
    const page = 1
    const search = new URLSearchParams({ q: term, page })
    navigate(`/events?${search.toString()}`)
  }

  return (
    <form onSubmit={onSubmit} className='flex gap-2'>
      <input
        className='flex-1 border rounded px-3 py-2'
        placeholder={placeholder}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      <button className='bg-primary-600 text-white px-4 py-2 rounded'>Search</button>
    </form>
  )
}
