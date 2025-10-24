import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import api from '../../services/api'
import uploadImage from '../../services/uploads'

const Schema = Yup.object({
  title: Yup.string().min(3).max(255).required('Required'),
  description: Yup.string(),
  category: Yup.string(),
  venue_name: Yup.string(),
  address: Yup.string(),
  start_date: Yup.string().required('Required'),
  end_date: Yup.string().required('Required'),
  banner_image_url: Yup.string().url('Must be a valid URL').nullable(),
  is_published: Yup.boolean(),
})

export default function EventForm({ onCreated }) {
  const init = {
    title: '', description: '', category: '', venue_name: '', address: '',
    start_date: '', end_date: '', banner_image_url: '', is_published: false,
  }

  const submit = async (values, { setSubmitting, resetForm, setStatus, setErrors }) => {
    try {
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
      if (!payload.banner_image_url || !payload.banner_image_url.trim()) {
        delete payload.banner_image_url
      }

      const res = await api.post('/events', payload)
      setStatus({ ok: 'Event created' })
      resetForm()
      onCreated?.(res.data.event)
    } catch (e) {
      const data = e?.response?.data
      if (data?.errors) {
        // Surface field-specific errors from backend
        setErrors(data.errors)
      }
      setStatus({ err: data?.message || 'Failed to create event' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white border rounded p-4">
      <h3 className="text-lg font-semibold mb-3">Create Event</h3>
      <Formik initialValues={init} validationSchema={Schema} onSubmit={submit}>
        {({ isSubmitting, status, setFieldValue }) => (
          <Form className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Title</label>
              <Field name="title" className="w-full border rounded px-3 py-2" />
              <ErrorMessage name="title" component="div" className="text-red-600 text-sm" />
            </div>
            <div>
              <label className="block text-sm mb-1">Category</label>
              <Field name="category" className="w-full border rounded px-3 py-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Description</label>
              <Field name="description" as="textarea" rows="4" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Venue</label>
              <Field name="venue_name" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Address</label>
              <Field name="address" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Start (ISO)</label>
              <Field name="start_date" placeholder="2025-10-15T10:00:00Z" className="w-full border rounded px-3 py-2" />
              <ErrorMessage name="start_date" component="div" className="text-red-600 text-sm" />
            </div>
            <div>
              <label className="block text-sm mb-1">End (ISO)</label>
              <Field name="end_date" placeholder="2025-10-15T12:00:00Z" className="w-full border rounded px-3 py-2" />
              <ErrorMessage name="end_date" component="div" className="text-red-600 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Banner image URL</label>
              <Field name="banner_image_url" className="w-full border rounded px-3 py-2" />
              <div className="mt-2 flex items-center gap-2">
                <label className="text-sm">or upload:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.currentTarget.files?.[0]
                    if (!file) return
                    try {
                      const res = await uploadImage(file)
                      if (res?.url) setFieldValue('banner_image_url', res.url)
                    } catch (err) {
                      // ignore
                    }
                  }}
                />
              </div>
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <Field type="checkbox" name="is_published" />
              <label>Publish now</label>
            </div>
            {status?.err && <div className="md:col-span-2 text-red-600">{status.err}</div>}
            {status?.ok && <div className="md:col-span-2 text-green-700">{status.ok}</div>}
            <div className="md:col-span-2">
              <button type="submit" disabled={isSubmitting} className="bg-primary-600 text-white px-4 py-2 rounded">
                {isSubmitting ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}
