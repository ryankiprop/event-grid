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

      // Prepare order items
      const orderItems = cart.map(item => ({
        ticket_type_id: item.id,
        quantity: parseInt(item.quantity) || 1
      }));

      // Create order
      const order = await createOrder({
        event_id: eventId,
        items: orderItems
      });

      if (order && order.id) {
        toast.success('Registration successful!');
        onSuccess?.(order);
        navigate(`/orders/${order.id}/confirmation`);
      } else {
        throw new Error('Failed to create order');
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
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Registration Summary</h3>
          
          {cart.map((item, index) => (
            <div key={index} className="flex justify-between py-2 border-b border-gray-100">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleCheckout}
          disabled={isLoading}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-4 px-6 rounded-lg transition-all ${
            isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md'
          }`}
        >
          {isLoading ? 'Processing...' : 'Complete Registration'}
        </button>
      </div>
    </div>
  );
};

export default CheckoutForm;