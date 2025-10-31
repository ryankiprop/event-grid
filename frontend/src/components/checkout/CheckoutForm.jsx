import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createOrder } from '../../services/orders';
import { initiateMpesaPayment } from '../../services/paymentService';

const CheckoutForm = ({ cart, total, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFreeMode, setIsFreeMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Always enable free mode
    const enableFreeMode = () => {
      try {
        localStorage.setItem('freeMode', 'true');
        setIsFreeMode(true);
      } catch (error) {
        console.error('Error enabling free mode:', error);
        setIsFreeMode(true); // Default to free mode even if localStorage fails
      }
    };

    enableFreeMode();
  }, []);

    const handleCheckout = async () => {
    if (!cart || cart.length === 0) {
      toast.error('Please select at least one ticket');
      return;
    }

    try {
      setIsLoading(true);
      
      const eventId = cart[0]?.event_id;
      if (!eventId) {
        throw new Error('Invalid event');
      }

      // Format the order data
      const orderData = {
        event_id: eventId,
        items: cart.map(item => ({
          ticket_type_id: item.ticket_type_id || item.id,
          quantity: parseInt(item.quantity) || 1,
          price: 0 // Force price to 0 in free mode
        })).filter(item => item.ticket_type_id)
      };

      // Always use free mode
      const response = await createOrder(orderData);
      console.log('Order created in free mode:', response);
      
      toast.success('🎉 Tickets booked successfully!');
      setTimeout(() => {
        navigate('/dashboard/tickets');
      }, 1500);
      return;

      // In production mode, process payment
      try {
        // This is where you'd integrate with your payment service
        // For now, we'll simulate a payment flow
        toast.info('Processing payment...');
        
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create order after successful payment
        const response = await createOrder(orderData);
        console.log('Paid order created:', response);
        
        toast.success('✅ Payment successful! Your tickets are ready.');
        onSuccess?.({
          order_id: response.id,
          status: 'completed'
        });
        
      } catch (paymentError) {
        console.error('Payment error:', paymentError);
        throw new Error(paymentError.message || 'Payment processing failed');
      }
      
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to complete checkout. Please try again.';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!cart || cart.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 mb-4">No tickets selected</p>
        <button
          onClick={() => window.history.back()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Back to Event
        </button>
      </div>
    );
  }

  const totalTickets = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
            {isFreeMode && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Free Mode Active
              </span>
            )}
          </div>
          
          <div className="space-y-4 mb-6">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between items-start pb-4 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    KES {(item.price * item.quantity).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{item.price.toLocaleString()} each</p>
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total</span>
                <span className="text-lg font-bold text-gray-900">
                  KES {total.toLocaleString()}
                </span>
              </div>
              {isFreeMode && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-700">
                    Free mode is active. No payment will be processed.
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isLoading}
            className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
              isFreeMode 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : isFreeMode ? (
              'Get Free Tickets'
            ) : (
              'Proceed to Payment'
            )}
          </button>
          
          <p className="mt-3 text-xs text-center text-gray-500">
            {isFreeMode 
              ? 'No payment required in free mode.'
              : 'Secure payment powered by M-Pesa'}
          </p>
        </div>
        
        {/* Security Badge */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center text-xs text-gray-500">
              <svg className="h-4 w-4 text-green-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Secure Checkout
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <svg className="h-4 w-4 text-blue-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Encrypted
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;