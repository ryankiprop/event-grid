import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const CheckoutForm = ({ cart, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFreeCheckout = async () => {
    if (!cart || cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      setIsLoading(true);
      
      // Prepare order items with proper validation
      const orderItems = cart.map(item => {
        console.log('Processing cart item:', item);
        
        // Ensure we have the required fields
        if (!item.id || !item.quantity) {
          console.error('Invalid item format:', item);
          throw new Error('One or more items in your cart are invalid');
        }

        return {
          ticket_type_id: item.id,
          quantity: parseInt(item.quantity) || 1
        };
      });

      const eventId = cart[0]?.event_id;
      if (!eventId) {
        throw new Error('No event ID found in cart');
      }

      // Log the data we're about to send
      console.log('Sending order data:', {
        event_id: eventId,
        items: orderItems
      });

      const response = await api.post('/orders', {
        event_id: eventId,
        items: orderItems
      });
      
      const order = response.data;
      console.log('Order response:', order);

      if (order && order.order_id) {
        toast.success('Registration successful!');
        if (onSuccess) {
          onSuccess({ order_id: order.order_id });
        }
        navigate(`/orders/${order.order_id}/confirmation`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Checkout error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Failed to complete registration. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Complete Registration</h2>
      
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-gray-600 mb-2">You're about to register for the event.</p>
          <p className="font-medium">Total: <span className="text-green-600">FREE</span></p>
        </div>

        <button
          onClick={handleFreeCheckout}
          disabled={isLoading}
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Processing...' : 'Complete Free Registration'}
        </button>
      </div>
    </div>
  );
};

export default CheckoutForm;