import api from './api'

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export const registerRequest = async (data) => {
  const res = await api.post('/auth/register', data)
  return res.data
}

export const registerOrganizerRequest = async (data) => {
  const res = await api.post('/auth/register-organizer', data)
  return res.data
}

export const updateProfile = async (data) => {
  const res = await api.put('/auth/me', data)
  return res.data.user
}

export const loginRequest = async (data) => {
  try {
    console.log('Attempting login with data:', data);
    const res = await api.post('/auth/login', data);
    console.log('Login response:', res);
    return res.data;
  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      } : 'No response',
      request: error.request ? 'Request was made but no response received' : 'No request was made',
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      }
    });
    throw error;
  }
}
