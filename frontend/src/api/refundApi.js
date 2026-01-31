import apiClient from './apiClient';

export const refundApi = {
  // User endpoints
  requestRefund: async (orderId, refundData) => {
    const response = await apiClient.post(`/refunds/order/${orderId}`, refundData);
    return response.data;
  },

  getMyRefunds: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/refunds/my-refunds?${params}`);
    return response.data;
  },

  getRefundById: async (refundId) => {
    const response = await apiClient.get(`/refunds/${refundId}`);
    return response.data;
  },

  cancelRefundRequest: async (refundId) => {
    const response = await apiClient.delete(`/refunds/${refundId}`);
    return response.data;
  },

  // Admin endpoints
  getAllRefunds: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/refunds/admin/all?${params}`);
    return response.data;
  },

  approveRefund: async (refundId, data) => {
    const response = await apiClient.patch(`/refunds/admin/${refundId}/approve`, data);
    return response.data;
  },

  rejectRefund: async (refundId, reason) => {
    const response = await apiClient.patch(`/refunds/admin/${refundId}/reject`, { reason });
    return response.data;
  },

  processRefund: async (refundId, data) => {
    const response = await apiClient.patch(`/refunds/admin/${refundId}/process`, data);
    return response.data;
  },

  getRefundStatistics: async () => {
    const response = await apiClient.get('/refunds/admin/statistics');
    return response.data;
  },
};

export default refundApi;
