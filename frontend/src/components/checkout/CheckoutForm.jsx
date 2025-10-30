import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createOrder } from '../../services/orders';

const CheckoutForm = ({ cart, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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
          ticket_type_id: item.ticket_type_id || item.id, // Use ticket_type_id if available, fallback to id
          quantity: parseInt(item.quantity) || 1
        })).filter(item => item.ticket_type_id) // Filter out any items without an ID
      };

      console.log('Creating order with data:', orderData);
      
      // Create order with selected tickets
      const response = await createOrder(orderData);
      console.log('Order created:', response);

      // Redirect to tickets dashboard
      navigate('/dashboard/tickets');
      toast.success('Tickets booked successfully!');
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to complete checkout. Please try again.';
      toast.error(errorMessage);
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
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Your Tickets</h2>
        
        <div className="space-y-4 mb-6">
          {cart.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleCheckout}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Get Tickets'}
        </button>
      </div>
    </div>
  );
};

export default CheckoutForm;