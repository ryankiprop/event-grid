import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createOrder } from '../../services/orders';

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
      
      const eventId = cart[0]?.event_id;
      if (!eventId) {
        throw new Error('No event ID found in cart');
      }

      // Prepare order items in the format expected by the createOrder service
      const orderItems = cart.map(item => ({
        ticket_type_id: item.id,
        quantity: parseInt(item.quantity) || 1
      }));

      // Use the createOrder service which handles the correct payload format
      const order = await createOrder({
        event_id: eventId,
        items: orderItems
      });

      if (order && order.id) {
        toast.success('Registration successful!');
        onSuccess?.(order);
        navigate(`/orders/${order.id}/confirmation`);
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
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="text-gray-700 mb-1">You're all set to complete your registration.</p>
          <p className="font-medium text-gray-800">Total: <span className="text-green-600 font-bold">FREE</span></p>
        </div>

        <button
          onClick={handleCheckout}
          disabled={isLoading}
          className={`w-full bg-green-600 hover:bg-green-700 text-white font-semibold text-lg py-4 px-6 rounded-lg transition-all transform hover:scale-[1.02] ${
            isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg'
          }`}
        >
          {isLoading ? 'Processing...' : 'Complete Checkout'}
        </button>
      </div>
    </div>
  );
};

export default CheckoutForm;