import apiClient from './apiClient';

export const couponApi = {
  // User endpoints
  validateCoupon: async (couponData) => {
    const response = await apiClient.post('/coupons/validate', couponData);
    return response.data;
  },

  getAvailableCoupons: async () => {
    const response = await apiClient.get('/coupons/available');
    return response.data;
  },

  // Admin endpoints
  createCoupon: async (couponData) => {
    const response = await apiClient.post('/coupons', couponData);
    return response.data;
  },

  getAllCoupons: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/coupons/admin/all?${params}`);
    return response.data;
  },

  getCouponStatistics: async () => {
    const response = await apiClient.get('/coupons/admin/statistics');
    return response.data;
  },

  getCouponById: async (couponId) => {
    const response = await apiClient.get(`/coupons/${couponId}`);
    return response.data;
  },

  updateCoupon: async (couponId, couponData) => {
    const response = await apiClient.put(`/coupons/${couponId}`, couponData);
    return response.data;
  },

  deleteCoupon: async (couponId) => {
    const response = await apiClient.delete(`/coupons/${couponId}`);
    return response.data;
  },

  toggleCouponStatus: async (couponId) => {
    const response = await apiClient.patch(`/coupons/${couponId}/toggle-status`);
    return response.data;
  },
};
