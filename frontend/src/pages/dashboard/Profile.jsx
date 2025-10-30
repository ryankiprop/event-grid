import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { updateProfile } from '../../services/auth'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    avatar_url: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        avatar_url: user.avatar_url || '',
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const updatedUser = await updateProfile(formData)
      setUser(updatedUser)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setIsEditing(false)
    } catch (error) {
      console.error('Update failed:', error)
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update profile'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div>Loading user data...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>

        {message.text && (
          <div className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-4">
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl text-gray-500">
                  {user.first_name?.[0] || 'U'}
                </span>
              )}
            </div>
            {isEditing && (
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar URL
                </label>
                <input
                  type="text"
                  name="avatar_url"
                  value={formData.avatar_url}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            )}
          </div>

          <div className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  ) : (
                    <div className="p-2 bg-gray-50 rounded">
                      {user.first_name || 'Not set'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                    />
                  ) : (
                    <div className="p-2 bg-gray-50 rounded">
                      {user.last_name || 'Not set'}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="p-2 bg-gray-50 rounded">
                  {user.email}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Contact support to change your email address
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="p-2 bg-gray-50 rounded capitalize">
                  {user.role}
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        first_name: user.first_name || '',
                        last_name: user.last_name || '',
                        email: user.email || '',
                        avatar_url: user.avatar_url || '',
                      })
                      setMessage({ type: '', text: '' })
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
