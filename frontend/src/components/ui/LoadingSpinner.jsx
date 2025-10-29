export default function LoadingSpinner () {
  return (
    <div className='w-full flex items-center justify-center py-10'>
      <div className='h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600' />
    </div>
  )
}
