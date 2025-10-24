import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import EventForm from '../../components/events/EventForm'

export default function CreateEvent() {
  const { user } = useAuth()
  const canCreate = !!user && (user.role === 'organizer' || user.role === 'admin')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4">Create an Event</h1>
        <p className="text-gray-700 mb-6">Launch your next gathering on Eventgrid. Follow these steps to publish and start selling tickets.</p>

        <ol className="list-decimal pl-6 space-y-2 mb-8 text-gray-800">
          <li><span className="font-medium">Sign in</span> or <Link to="/register" className="text-primary-600">create an account</Link>.</li>
          <li>If you don't have organizer access, go to <Link to="/dashboard/manage-users" className="text-primary-600">Manage Users</Link> (admin) to set your role to <span className="font-medium">organizer</span>, or ask an admin.</li>
          <li><span className="font-medium">Create your event</span> with title, dates, venue, description, and banner.</li>
          <li><span className="font-medium">Add ticket types</span> (e.g., General, VIP) and set price and quantity.</li>
          <li><span className="font-medium">Publish</span> the event so it appears on the public listing.</li>
          <li>Share your event link and watch orders come in. Export attendees anytime.</li>
        </ol>

        {!user && (
          <div className="bg-white border rounded p-4">
            <div className="mb-2 font-medium">You're not signed in</div>
            <p className="text-gray-700 mb-3">Sign in or create an account to proceed.</p>
            <div className="flex items-center gap-3">
              <Link to="/login" className="bg-primary-600 text-white px-4 py-2 rounded">Login</Link>
              <Link to="/register" className="px-4 py-2 border rounded">Sign up</Link>
            </div>
          </div>
        )}

        {user && !canCreate && (
          <div className="bg-white border rounded p-4">
            <div className="mb-2 font-medium">Organizer access required</div>
            <p className="text-gray-700">Your current role is <span className="font-medium">{user.role}</span>. Ask an admin to grant you organizer access, or if you are an admin, update your role in <Link to="/dashboard/manage-users" className="text-primary-600">Manage Users</Link>.</p>
          </div>
        )}

        {canCreate && (
          <div className="bg-white border rounded p-4">
            <div className="mb-2 font-medium">Event details</div>
            <EventForm onCreated={() => { /* The MyEvents page will refresh when you navigate */ }} />
            <div className="mt-4 text-sm text-gray-600">After creating, go to <Link to="/dashboard/my-events" className="text-primary-600">My Events</Link> to publish/unpublish, edit details, and view attendees.</div>
          </div>
        )}
      </div>
    </div>
  )
}
