import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const CheckoutForm = ({ cart, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (!cart || cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      setIsLoading(true);
      
      // Prepare order items with proper validation
      const orderItems = cart.map(item => {
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

      const response = await api.post('/orders', {
        event_id: eventId,
        items: orderItems
      });
      
      const order = response.data;

      if (order && order.order_id) {
        toast.success('Registration successful!');
        onSuccess?.({ order_id: order.order_id });
        navigate(`/orders/${order.order_id}/confirmation`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to complete checkout. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Complete Your Registration</h2>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
          <p className="text-gray-700 mb-1">You're all set to register for this event.</p>
          <p className="font-medium text-gray-800">Total: <span className="text-green-600">FREE</span></p>
        </div>

        <button
          onClick={handleCheckout}
          disabled={isLoading}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition-colors ${
            isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md'
          }`}
        >
          {isLoading ? 'Processing...' : 'Register Now'}
        </button>
      </div>
    </div>
  );
};

export default CheckoutForm;