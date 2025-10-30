import UserDashboard from '../../components/dashboard/UserDashboard'
import OrganizerDashboard from '../../components/dashboard/OrganizerDashboard'
import AdminDashboard from '../../components/dashboard/AdminDashboard'
import { useAuth } from '../../context/AuthContext'

export default function Dashboard () {
  const { user } = useAuth()
  const role = user?.role || 'user'

  return (
    <div className='max-w-6xl mx-auto p-4'>
      <h1 className='text-2xl font-semibold mb-6'>Dashboard</h1>
      {role === 'admin' && <AdminDashboard />}
      {role === 'organizer' && <OrganizerDashboard />}
      {role === 'user' && <UserDashboard />}
    </div>
  )
}
