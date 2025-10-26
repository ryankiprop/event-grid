import api from './api'

export const getOrganizerStats = async () => {
  const res = await api.get('/dashboard/organizer')
  return res.data
}

export const getAdminStats = async () => {
  const res = await api.get('/dashboard/admin')
  return res.data
}
