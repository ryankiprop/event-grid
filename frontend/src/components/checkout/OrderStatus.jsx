import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const OrderStatus = () => {
  const { orderId } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const checkoutRequestId = searchParams.get('checkout_request_id');
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const navigate = useNavigate();

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Check payment status
  const checkPaymentStatus = async () => {
    try {
      const response = await api.get(`/payments/status/${orderId}`);
      const { payment } = response.data;
      
      if (payment) {
        setPaymentStatus(payment.status);
        
        // If payment is successful, update the order
        if (payment.status === 'success') {
          fetchOrder();
        }
        
        return payment.status;
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
    return null;
  };

  // Fetch order details
  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      
      // Set up polling for payment status
      const interval = setInterval(async () => {
        const status = await checkPaymentStatus();
        if (status === 'success' || status === 'failed') {
          clearInterval(interval);
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Not Found</h2>
        <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const isPaid = paymentStatus === 'success';
  const isFailed = paymentStatus === 'failed';
  const isPending = !isPaid && !isFailed;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className={`p-6 ${isPaid ? 'bg-green-50' : isFailed ? 'bg-red-50' : 'bg-yellow-50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {isPaid ? 'Payment Successful!' : isFailed ? 'Payment Failed' : 'Payment Pending'}
            </h2>
            <p className="text-gray-600 mt-1">
              Order #{order.id.split('-')[0].toUpperCase()}
            </p>
          </div>
          <div className={`p-3 rounded-full ${isPaid ? 'bg-green-100 text-green-600' : isFailed ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
            {isPaid ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : isFailed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
        </div>
        
        {isPending && (
          <div className="mt-4 bg-white p-4 rounded-md border border-yellow-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  We're waiting for confirmation of your payment. This may take a few moments.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Order Summary</h3>
        <div className="space-y-4">
          {order.items && order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-3 border-b">
              <div>
                <h4 className="font-medium text-gray-800">{item.ticket_type?.name || 'Ticket'}</h4>
                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
              </div>
              <span className="font-medium">{formatCurrency(item.unit_price * item.quantity)}</span>
            </div>
          ))}
          
          <div className="pt-2">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Tickets */}
        {isPaid && order.items && order.items.some(item => item.qr_code) && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Your Tickets</h3>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="mb-4 md:mb-0 md:mr-4">
                      <h4 className="font-medium text-gray-800">{item.ticket_type?.name || `Ticket ${index + 1}`}</h4>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      {item.qr_code && (
                        <p className="text-xs text-gray-500 mt-1">
                          Scan this QR code at the event entrance
                        </p>
                      )}
                    </div>
                    {item.qr_code && (
                      <div className="flex-shrink-0">
                        <img 
                          src={item.qr_code} 
                          alt="QR Code" 
                          className="h-24 w-24 border p-1 bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 pt-6 border-t">
          {isPaid ? (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-green-700 text-sm">
                  Your payment was successful! A confirmation has been sent to your email.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  View Order Details
                </button>
                <button
                  onClick={() => navigate('/events')}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Browse More Events
                </button>
              </div>
            </div>
          ) : isFailed ? (
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-red-700 text-sm">
                  Your payment was not successful. Please try again or contact support if the problem persists.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/contact')}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Contact Support
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 mr-2"></div>
                <span className="text-sm text-gray-600">Waiting for payment confirmation...</span>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="text-sm font-medium text-primary-600 hover:text-primary-800"
              >
                Refresh Status
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
