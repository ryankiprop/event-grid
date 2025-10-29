import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Events from './pages/public/Events'
import EventDetails from './pages/public/EventDetails'
import Navbar from './components/ui/Navbar'
import Dashboard from './pages/dashboard/Dashboard'
import MyEvents from './pages/dashboard/MyEvents'
import MyTickets from './pages/dashboard/MyTickets'
import ManageUsers from './pages/dashboard/ManageUsers'
import EditEvent from './pages/dashboard/EditEvent'
import EventOrders from './pages/dashboard/EventOrders'
import CreateEvent from './pages/public/CreateEvent'
import Home from './pages/public/Home'
import RegisterOrganizer from './pages/auth/RegisterOrganizer'
import Checkin from './pages/dashboard/Checkin'
import OrderConfirmation from './pages/public/OrderConfirmation'
import Profile from './pages/dashboard/Profile'

function PrivateRoute ({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to='/login' replace />
}

export default function App () {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className='min-h-screen flex flex-col'>
          <Navbar />
          <div className='flex-1'>
            <Routes>
              <Route path='/login' element={<Login />} />
              <Route path='/register' element={<Register />} />
              <Route path='/register-organizer' element={<RegisterOrganizer />} />
              <Route path='/events' element={<Events />} />
              <Route path='/events/:id' element={<EventDetails />} />
              <Route path='/create-event' element={<CreateEvent />} />
              <Route path='/dashboard' element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path='/dashboard/my-events' element={<PrivateRoute><MyEvents /></PrivateRoute>} />
              <Route path='/dashboard/my-tickets' element={<PrivateRoute><MyTickets /></PrivateRoute>} />
              <Route path='/dashboard/manage-users' element={<PrivateRoute><ManageUsers /></PrivateRoute>} />
              <Route path='/dashboard/events/:id/edit' element={<PrivateRoute><EditEvent /></PrivateRoute>} />
              <Route path='/dashboard/events/:id/orders' element={<PrivateRoute><EventOrders /></PrivateRoute>} />
              <Route path='/dashboard/events/:id/checkin' element={<PrivateRoute><Checkin /></PrivateRoute>} />
              <Route path='/dashboard/profile' element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path='/orders/:id/confirmation' element={<PrivateRoute><OrderConfirmation /></PrivateRoute>} />
              <Route path='/' element={<Home />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  )
}
