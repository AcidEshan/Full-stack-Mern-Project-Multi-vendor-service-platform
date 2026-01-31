import apiClient from './apiClient';

export const payoutApi = {
  // Vendor: Request payout
  requestPayout: async (amount) => {
    return await apiClient.post('/payouts/request', { amount });
  },

  // Vendor: Get my payout requests
  getMyPayouts: async (params = {}) => {
    return await apiClient.get('/payouts/my-payouts', { params });
  },

  // Vendor: Get available balance
  getAvailableBalance: async () => {
    return await apiClient.get('/payouts/balance');
  },

  // Vendor: Get payout statistics
  getPayoutStats: async () => {
    return await apiClient.get('/payouts/stats');
  },

  // Admin: Get all payout requests
  getAllPayouts: async (params = {}) => {
    return await apiClient.get('/payouts', { params });
  },

  // Admin: Approve payout
  approvePayout: async (payoutId, data) => {
    return await apiClient.patch(`/payouts/${payoutId}/approve`, data);
  },

  // Admin: Reject payout
  rejectPayout: async (payoutId, reason) => {
    return await apiClient.patch(`/payouts/${payoutId}/reject`, { reason });
  },

  // Get payout by ID
  getPayoutById: async (payoutId) => {
    return await apiClient.get(`/payouts/${payoutId}`);
  }
};

export default payoutApi;
