/* global localStorage */

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://event-grid.onrender.com/api' // Removed localhost fallback to avoid confusion
})

// Ensure auth header is present on every request if token exists
api.interceptors.request.use((config) => {
  if (!config.headers) config.headers = {}
  if (!config.headers.Authorization) {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  // Always include X-Free-Mode header for all requests
  config.headers['X-Free-Mode'] = 'true'
  return config
})

export default api
