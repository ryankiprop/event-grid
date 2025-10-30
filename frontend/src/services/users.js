import api from './api'

export const listUsers = async () => {
  const res = await api.get('/users')
  return res.data
}

export const changeUserRole = async (userId, role) => {
  const res = await api.put(`/users/${userId}/role`, { role })
  return res.data
}
