import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'

export default function Navbar () {
  const { user, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const navigate = useNavigate()
  
  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className='bg-white border-b'>
      <div className='max-w-6xl mx-auto px-4 py-3 flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link to='/' className='font-semibold text-primary-700 hover:text-primary-800 transition-colors'>Eventgrid</Link>
          <Link to='/' className='text-sm px-3 py-1 rounded border hover:bg-gray-50 transition'>Home</Link>
        </div>
        <div className='flex items-center gap-3'>
          {!user && (
            <>
              <Link to='/login' className='text-sm hover:text-primary-700 transition'>Login</Link>
              <Link to='/register' className='text-sm bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 transition'>Sign up</Link>
              <Link to='/register-organizer' className='text-sm hover:text-primary-700 transition'>Sign up as Organizer</Link>
            </>
          )}
          {user && (
            <>
              {/* Show Dashboard for all authenticated users */}
              <Link to='/dashboard' className='text-sm hover:text-primary-700 transition'>Dashboard</Link>
              
              {/* Role-based quick links */}
              {user.role === 'organizer' && (
                <Link to='/dashboard/my-events' className='text-sm hover:text-primary-700 transition'>My Events</Link>
              )}
              {user.role === 'admin' && (
                <>
                  <Link to='/dashboard/my-events' className='text-sm hover:text-primary-700 transition'>My Events</Link>
                  <Link to='/dashboard/manage-users' className='text-sm hover:text-primary-700 transition'>Manage Users</Link>
                </>
              )}
              {/* Show My Tickets for all logged-in users */}
              <Link to='/dashboard/my-tickets' className='text-sm hover:text-primary-700 transition'>My Tickets</Link>
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 text-sm hover:text-primary-700 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.first_name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600">
                        {(user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span>{user.first_name || 'Profile'}</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      to="/dashboard/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
              
              {/* Click outside to close dropdown */}
              {isDropdownOpen && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
