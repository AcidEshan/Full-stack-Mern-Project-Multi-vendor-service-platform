import apiClient from './apiClient';

export const invoiceApi = {
  // Get all invoices for logged-in user
  getMyInvoices: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/invoices/my-invoices?${params}`);
    return response.data;
  },

  // Generate and download invoice PDF
  downloadInvoice: async (orderId) => {
    const response = await apiClient.get(`/invoices/order/${orderId}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Generate and download receipt PDF
  downloadReceipt: async (orderId) => {
    const response = await apiClient.get(`/invoices/order/${orderId}/receipt`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Send invoice via email
  emailInvoice: async (orderId) => {
    const response = await apiClient.post(`/invoices/order/${orderId}/email`);
    return response.data;
  },
};
