import { useEffect, useState } from 'react'
import { listUsers, changeUserRole } from '../../services/users'

export default function ManageUsers () {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    listUsers()
      .then((res) => setUsers(res.users || []))
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load users'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateRole = async (id, role) => {
    try {
      await changeUserRole(id, role)
      load()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to change role')
    }
  }

  if (loading) return <div className='p-4'>Loading...</div>
  if (error) return <div className='p-4 text-red-600'>{error}</div>

  return (
    <div className='max-w-6xl mx-auto p-4'>
      <h1 className='text-2xl font-semibold mb-4'>Manage Users</h1>
      <div className='overflow-auto'>
        <table className='min-w-full bg-white border'>
          <thead>
            <tr className='bg-gray-50 text-left'>
              <th className='p-2 border'>Email</th>
              <th className='p-2 border'>Name</th>
              <th className='p-2 border'>Role</th>
              <th className='p-2 border'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className='border-t'>
                <td className='p-2 border'>{u.email}</td>
                <td className='p-2 border'>{[u.first_name, u.last_name].filter(Boolean).join(' ') || '-'}</td>
                <td className='p-2 border'>{u.role}</td>
                <td className='p-2 border'>
                  <div className='flex gap-2'>
                    <button className='px-2 py-1 border rounded' onClick={() => updateRole(u.id, 'user')}>User</button>
                    <button className='px-2 py-1 border rounded' onClick={() => updateRole(u.id, 'organizer')}>Organizer</button>
                    <button className='px-2 py-1 border rounded' onClick={() => updateRole(u.id, 'admin')}>Admin</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
