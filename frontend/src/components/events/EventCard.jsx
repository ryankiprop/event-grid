import { Link } from 'react-router-dom'

export default function EventCard({ event }) {
  return (
    <div className="border rounded overflow-hidden bg-white hover:shadow-lg transition transform hover:-translate-y-0.5">
      <Link to={`/events/${event.id}`} className="block">
        {event.banner_image_url && (
          <img src={event.banner_image_url} alt={event.title} className="w-full h-40 object-cover" />
        )}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-1 line-clamp-1">{event.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{event.description}</p>
          <div className="text-xs text-gray-500 flex gap-2">
            {event.category && <span className="px-2 py-0.5 bg-gray-100 rounded">{event.category}</span>}
            {event.venue_name && <span className="px-2 py-0.5 bg-gray-100 rounded">{event.venue_name}</span>}
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <Link to={`/events/${event.id}`} className="inline-block text-sm bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 transition">
          Checkout
        </Link>
      </div>
    </div>
  )
}
