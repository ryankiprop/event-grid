import { Formik, Form, Field, ErrorMessage } from 'formik'
import { useAuth } from '../../context/AuthContext'

export default function RegisterOrganizer() {
  const { registerOrganizer } = useAuth()

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='w-full max-w-md bg-white shadow rounded p-6'>
        <h1 className='text-2xl font-semibold mb-1'>Sign up as Organizer</h1>
        <p className='text-sm text-gray-600 mb-4'>Create an organizer account to publish events and sell tickets.</p>
        <Formik 
          initialValues={{ email: '', password: '', first_name: '', last_name: '' }} 
          onSubmit={(values, { setSubmitting, setFieldError }) => {
            return registerOrganizer(values, { setSubmitting, setFieldError })
          }}
          validateOnBlur={false}
          validateOnChange={false}
        >
          {({ isSubmitting, errors }) => (
            <Form className='space-y-4'>
              {errors.form && (
                <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded text-sm'>
                  {errors.form}
                </div>
              )}
              <div>
                <label className='block text-sm mb-1'>Email</label>
                <Field name='email' type='email' className='w-full border rounded px-3 py-2' />
                <ErrorMessage name='email' component='div' className='text-red-500 text-sm mt-1' />
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='block text-sm mb-1'>First name</label>
                  <Field name='first_name' className='w-full border rounded px-3 py-2' />
                  <ErrorMessage name='first_name' component='div' className='text-red-500 text-sm mt-1' />
                </div>
                <div>
                  <label className='block text-sm mb-1'>Last name</label>
                  <Field name='last_name' className='w-full border rounded px-3 py-2' />
                  <ErrorMessage name='last_name' component='div' className='text-red-500 text-sm mt-1' />
                </div>
              </div>
              <div>
                <label className='block text-sm mb-1'>Password (min 6 characters)</label>
                <Field name='password' type='password' className='w-full border rounded px-3 py-2' />
                <ErrorMessage name='password' component='div' className='text-red-500 text-sm mt-1' />
              </div>
              <button 
                type='submit' 
                disabled={isSubmitting} 
                className='w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isSubmitting ? 'Creating organizer...' : 'Create organizer account'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
}
