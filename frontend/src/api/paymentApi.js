import apiClient from './apiClient';

export const paymentApi = {
  // Payment Intent Creation (Stripe)
  createPaymentIntent: async (orderData) => {
    const response = await apiClient.post('/payments/create-intent', orderData);
    return response.data;
  },

  // Payment Confirmation (Stripe)
  confirmPayment: async (paymentIntentId) => {
    const response = await apiClient.post('/payments/confirm', { paymentIntentId });
    return response.data;
  },

  // SSLCommerz Payment Initiation
  initSSLCommerzPayment: async (orderId) => {
    const response = await apiClient.post('/payments/sslcommerz/init', { orderId });
    return response.data;
  },

  // Manual Payment - Upload Proof
  uploadPaymentProof: async (transactionId, formData) => {
    const response = await apiClient.post(`/payments/${transactionId}/upload-proof`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // User Transactions
  getUserTransactions: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/payments/user/transactions?${params}`);
    return response.data;
  },

  // Vendor Transactions
  getVendorTransactions: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/payments/vendor/transactions?${params}`);
    return response.data;
  },

  // Admin endpoints
  getAllTransactions: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/payments/admin/transactions?${params}`);
    return response.data;
  },

  getTransactionById: async (transactionId) => {
    const response = await apiClient.get(`/payments/admin/transactions/${transactionId}`);
    return response.data;
  },

  issueRefund: async (transactionId, refundData) => {
    const response = await apiClient.post(`/payments/admin/refund/${transactionId}`, refundData);
    return response.data;
  },

  // Platform Revenue
  getPlatformRevenue: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/payments/admin/platform-revenue?${params}`);
    return response.data;
  },
};
