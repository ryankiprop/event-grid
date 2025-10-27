/* global localStorage */

import {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react'
import { useNavigate } from 'react-router-dom'
import { loginRequest, registerRequest, registerOrganizerRequest, setAuthToken } from '../services/auth'

const AuthContext = createContext()

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export function AuthProvider ({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Restore persisted auth on refresh
    try {
      const t = localStorage.getItem('token')
      const u = localStorage.getItem('user')
      if (t) {
        setToken(t)
        setAuthToken(t)
      }
      if (u) {
        setUser(JSON.parse(u))
      }
    } catch {}
  }, [])

  const login = async (values) => {
    const res = await loginRequest(values)
    setToken(res.token)
    setUser(res.user)
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
    setAuthToken(res.token)
    navigate('/')
  }

  const register = async (values) => {
    const res = await registerRequest(values)
    setToken(res.token)
    setUser(res.user)
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
    setAuthToken(res.token)
    navigate('/')
  }

  const registerOrganizer = async (values) => {
    const res = await registerOrganizerRequest(values)
    setToken(res.token)
    setUser(res.user)
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
    setAuthToken(res.token)
    navigate('/create-event')
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setAuthToken(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, registerOrganizer, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
