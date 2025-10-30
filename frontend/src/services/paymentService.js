import api from './api';

/**
 * Initiate M-Pesa payment
 * @param {Object} paymentData - Payment data including phone, amount, and order ID
 * @returns {Promise<Object>} - Response from the payment gateway
 */
export const initiateMpesaPayment = async (paymentData) => {
  try {
    const response = await api.post('/payments/mpesa/initiate', paymentData);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Payment initiation failed:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to initiate payment',
      details: error.response?.data,
    };
  }
};

/**
 * Check payment status
 * @param {string} paymentId - Payment ID to check
 * @returns {Promise<Object>} - Payment status information
 */
export const checkPaymentStatus = async (paymentId) => {
  try {
    const response = await api.get(`/payments/status/${paymentId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Failed to check payment status:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to check payment status',
    };
  }
};

/**
 * Get order details
 * @param {string} orderId - Order ID to fetch
 * @returns {Promise<Object>} - Order details
 */
export const getOrderDetails = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Failed to fetch order details:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch order details',
    };
  }
};

/**
 * Get user's order history
 * @returns {Promise<Object>} - List of user's orders
 */
export const getUserOrders = async () => {
  try {
    const response = await api.get('/orders/user');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Failed to fetch user orders:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch orders',
    };
  }
};

export default {
  initiateMpesaPayment,
  checkPaymentStatus,
  getOrderDetails,
  getUserOrders,
};
