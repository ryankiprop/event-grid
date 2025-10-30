import api from './api'

export const uploadImage = async (file) => {
  try {
    const formData = new FormData()
    formData.append('image', file)
    
    // Get the JWT token from localStorage
    const token = localStorage.getItem('token')
    
    const response = await api.post('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.data && response.data.url) {
      return { success: true, url: response.data.url, data: response.data }
    } else {
      console.error('Invalid response from server:', response)
      return { 
        success: false, 
        error: response.data?.message || 'Failed to upload image',
        data: response.data
      }
    }
  } catch (error) {
    console.error('Upload error:', error)
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to upload image',
      details: error.response?.data
    }
  }
}

export default uploadImage
