import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
})

// Ensure auth header is present on every request if token exists
api.interceptors.request.use((config) => {
  if (!config.headers) config.headers = {}
  if (!config.headers.Authorization) {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
