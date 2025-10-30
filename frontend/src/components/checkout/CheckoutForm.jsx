import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const CheckoutForm = ({ cart, total, onSuccess }) => {
  const handleFreeCheckout = async () => {
    try {
      setIsLoading(true);
      // Create order items array for the backend
      const orderItems = cart.map(item => ({
        ticket_type_id: item.id,
        quantity: item.quantity,
        price: item.price || 0  // Include price for validation
      }));

      // Get event ID from the first item in cart
      const eventId = cart[0]?.event_id;
      if (!eventId) {
        throw new Error('No event ID found in cart');
      }

      // Call the free checkout endpoint
      const response = await api.post('/orders', {
        event_id: eventId,
        items: orderItems,
        payment_method: 'free',
        amount: total,  // Include total amount for validation
        currency: 'KES' // Include currency for consistency
      });

      const order = response.data;
      
      if (order) {
        toast.success('Registration completed successfully!');
        if (onSuccess) {
          onSuccess({ order_id: order.id });
        }
        // Redirect to confirmation page with order ID
        navigate(`/orders/${order.id}/confirmation`);
      }
    } catch (error) {
      console.error('Free checkout error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to complete registration. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  // Handle form submission - only free checkout is available
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Show message that M-Pesa is disabled
    if (e.nativeEvent.submitter?.textContent?.includes('M-Pesa')) {
      toast.info('M-Pesa payment is currently disabled. Please use free checkout.');
      return;
    }
    
    try {
      setIsLoading(true);
      await handleFreeCheckout();
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to complete registration. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Complete Your Order</h2>
        
        {/* Order Summary */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b">Order Summary</h3>
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <h4 className="font-medium text-gray-800">{item.name}</h4>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            
            <div className="flex justify-between pt-3 border-t border-gray-200">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-lg font-bold text-primary-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Payment Details</h3>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-700">
                You'll receive an M-Pesa payment request on your phone to complete the transaction.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  M-Pesa Phone Number
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">+254</span>
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => {
                      // Remove non-numeric characters
                      const value = e.target.value.replace(/\D/g, '');
                      setPhone(value);
                    }}
                    placeholder="712345678"
                    className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-16 pr-12 sm:text-sm border-gray-300 rounded-md py-3"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter your M-Pesa registered phone number (e.g., 712345678)
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            {total > 0 ? (
              <>
                <div className="relative">
                  <div className="absolute inset-0 bg-gray-200 opacity-50 rounded-md"></div>
                  <button
                    type="button"
                    disabled
                    className="relative w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-500 bg-gray-200 cursor-not-allowed"
                  >
                    M-Pesa (Temporarily Unavailable)
                  </button>
                </div>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleFreeCheckout()}
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Complete Free Registration
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleFreeCheckout()}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Complete Free Registration
              </button>
            )}
            
            <p className="mt-2 text-xs text-gray-500 text-center">
              By completing your registration, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutForm;
