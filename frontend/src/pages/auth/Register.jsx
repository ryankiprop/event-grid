import { Formik, Form, Field, ErrorMessage } from 'formik'
import { useAuth } from '../../context/AuthContext'

export default function Register () {
  const { register } = useAuth()

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='w-full max-w-md bg-white shadow rounded p-6'>
        <h1 className='text-2xl font-semibold mb-4'>Register</h1>
        <Formik initialValues={{ email: '', password: '', first_name: '', last_name: '' }} onSubmit={register}>
          {({ isSubmitting }) => (
            <Form className='space-y-4'>
              <div>
                <label className='block text-sm mb-1'>Email</label>
                <Field name='email' type='email' className='w-full border rounded px-3 py-2' />
                <ErrorMessage name='email' component='div' className='text-red-500 text-sm' />
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='block text-sm mb-1'>First name</label>
                  <Field name='first_name' className='w-full border rounded px-3 py-2' />
                </div>
                <div>
                  <label className='block text-sm mb-1'>Last name</label>
                  <Field name='last_name' className='w-full border rounded px-3 py-2' />
                </div>
              </div>
              <div>
                <label className='block text-sm mb-1'>Password</label>
                <Field name='password' type='password' className='w-full border rounded px-3 py-2' />
                <ErrorMessage name='password' component='div' className='text-red-500 text-sm' />
              </div>
              <button type='submit' disabled={isSubmitting} className='w-full bg-primary-600 text-white py-2 rounded'>
                {isSubmitting ? 'Loading...' : 'Create account'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
}
