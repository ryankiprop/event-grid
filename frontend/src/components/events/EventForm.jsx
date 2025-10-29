import { useState, useRef } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import api from '../../services/api'
import { uploadImage } from '../../services/uploads'

const Schema = Yup.object({
  title: Yup.string().min(3).max(255).required('Required'),
  description: Yup.string(),
  category: Yup.string(),
  venue_name: Yup.string(),
  address: Yup.string(),
  start_date: Yup.string().required('Required'),
  end_date: Yup.string().required('Required'),
  banner_image_url: Yup.string().url('Must be a valid URL').nullable(),
  is_published: Yup.boolean()
})

export default function EventForm ({ onCreated }) {
  const init = {
    title: '',
    description: '',
    category: '',
    venue_name: '',
    address: '',
    start_date: '',
    end_date: '',
    banner_image_url: '',
    is_published: false
  }

  const [imageFile, setImageFile] = useState(null)
  const fileInputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
    }
  }

  const submit = async (values, { setSubmitting, resetForm, setStatus, setErrors }) => {
    try {
      setSubmitting(true)
      setIsUploading(true)
      
      // Upload image first if a new one was selected
      let imageUrl = values.banner_image_url
      if (imageFile) {
        try {
          const formData = new FormData()
          formData.append('image', imageFile)
          
          // Get auth token from localStorage
          const token = localStorage.getItem('token')
          if (!token) {
            throw new Error('Authentication required')
          }
          
          // Upload the image
          const uploadResponse = await uploadImage(imageFile)
          if (!uploadResponse || !uploadResponse.url) {
            throw new Error('Failed to upload image')
          }
          
          imageUrl = uploadResponse.url
        } catch (error) {
          console.error('Image upload failed:', error)
          setStatus({ err: 'Failed to upload image. Please try again.' })
          setIsUploading(false)
          return
        }
      }
      
      // Normalize dates to ISO strings expected by backend
      const payload = { ...values }
      const sd = new Date(values.start_date)
      const ed = new Date(values.end_date)
      
      if (isNaN(sd.getTime()) || isNaN(ed.getTime())) {
        setStatus({ err: 'Please provide valid ISO dates, e.g. 2025-12-01T10:00:00Z' })
        return
      }
      
      payload.start_date = sd.toISOString()
      payload.end_date = ed.toISOString()
      
      // Use the uploaded image URL if available
      if (imageUrl) {
        payload.banner_image_url = imageUrl
      } else {
        delete payload.banner_image_url
      }

      // Submit the event data
      const res = await api.post('/events', payload)
      setStatus({ ok: 'Event created successfully' })
      resetForm()
      setImageFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onCreated?.(res.data)
    } catch (e) {
      const data = e?.response?.data
      if (data?.errors) {
        // Surface field-specific errors from backend
        setErrors(data.errors)
      }
      setStatus({ err: data?.message || 'Failed to create event' })
    } finally {
      setSubmitting(false)
      setIsUploading(false)
    }
  }

  return (
    <div className='bg-white border rounded p-4'>
      <h3 className='text-lg font-semibold mb-3'>Create Event</h3>
      <Formik initialValues={init} validationSchema={Schema} onSubmit={submit}>
        {({ isSubmitting, status, setFieldValue, values }) => (
          <Form className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            <div className='md:col-span-2'>
              <label className='block text-sm mb-1'>Banner Image</label>
              <div className='flex items-center gap-2'>
                <input
                  type='file'
                  ref={fileInputRef}
                  accept='image/*'
                  onChange={handleImageChange}
                  className='flex-1 border rounded px-3 py-2 text-sm'
                />
                {imageFile && (
                  <span className='text-sm text-gray-600'>{imageFile.name}</span>
                )}
              </div>
              <p className='text-xs text-gray-500 mt-1'>
                {values.banner_image_url ? 'Current: ' + values.banner_image_url : 'No image selected'}
              </p>
            </div>
            <div>
              <label className='block text-sm mb-1'>Title</label>
              <Field name='title' className='w-full border rounded px-3 py-2' />
              <ErrorMessage name='title' component='div' className='text-red-600 text-sm' />
            </div>
            <div>
              <label className='block text-sm mb-1'>Category</label>
              <Field name='category' className='w-full border rounded px-3 py-2' />
            </div>
            <div className='md:col-span-2'>
              <label className='block text-sm mb-1'>Description</label>
              <Field name='description' as='textarea' rows='4' className='w-full border rounded px-3 py-2' />
            </div>
            <div>
              <label className='block text-sm mb-1'>Venue</label>
              <Field name='venue_name' className='w-full border rounded px-3 py-2' />
            </div>
            <div>
              <label className='block text-sm mb-1'>Address</label>
              <Field name='address' className='w-full border rounded px-3 py-2' />
            </div>
            <div>
              <label className='block text-sm mb-1'>Start (ISO)</label>
              <Field name='start_date' placeholder='2025-10-15T10:00:00Z' className='w-full border rounded px-3 py-2' />
              <ErrorMessage name='start_date' component='div' className='text-red-600 text-sm' />
            </div>
            <div>
              <label className='block text-sm mb-1'>End (ISO)</label>
              <Field name='end_date' placeholder='2025-10-15T12:00:00Z' className='w-full border rounded px-3 py-2' />
              <ErrorMessage name='end_date' component='div' className='text-red-600 text-sm' />
            </div>
            <div className='flex items-center gap-2'>
              <Field type='checkbox' name='is_published' id='is_published' className='h-4 w-4' />
              <label htmlFor='is_published' className='text-sm'>Publish this event</label>
            </div>
            
            {imageFile && (
              <div className='md:col-span-2 mt-2'>
                <div className='text-sm text-gray-600'>
                  Preview: <span className='font-medium'>{imageFile.name}</span> ({Math.round(imageFile.size / 1024)} KB)
                </div>
              </div>
            )}
            {status?.err && <div className='md:col-span-2 text-red-600'>{status.err}</div>}
            {status?.ok && <div className='md:col-span-2 text-green-700'>{status.ok}</div>}
            <div className='md:col-span-2'>
              <button type='submit' disabled={isSubmitting} className='bg-primary-600 text-white px-4 py-2 rounded'>
                {isSubmitting ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}
