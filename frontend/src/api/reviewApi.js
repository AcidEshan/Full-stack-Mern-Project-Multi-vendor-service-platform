import apiClient from './apiClient';

export const reviewApi = {
  // Public endpoints
  getServiceReviews: async (serviceId, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/reviews/service/${serviceId}?${params}`);
    return response.data;
  },

  getVendorReviews: async (vendorId, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/reviews/vendor/${vendorId}?${params}`);
    return response.data;
  },

  getReviewById: async (reviewId) => {
    const response = await apiClient.get(`/reviews/${reviewId}`);
    return response.data;
  },

  // User endpoints
  submitReview: async (reviewData) => {
    const response = await apiClient.post('/reviews', reviewData);
    return response.data;
  },

  getMyReviews: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/reviews/my-reviews?${params}`);
    return response.data;
  },

  updateReview: async (reviewId, reviewData) => {
    const response = await apiClient.put(`/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  deleteReview: async (reviewId) => {
    const response = await apiClient.delete(`/reviews/${reviewId}`);
    return response.data;
  },

  // Vendor endpoints
  respondToReview: async (reviewId, responseText) => {
    const response = await apiClient.post(`/reviews/${reviewId}/respond`, { response: responseText });
    return response.data;
  },

  updateResponse: async (reviewId, responseText) => {
    const response = await apiClient.put(`/reviews/${reviewId}/respond`, { response: responseText });
    return response.data;
  },

  // Admin endpoints
  getAllReviews: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/reviews/admin/all?${params}`);
    return response.data;
  },

  getReviewStatistics: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/reviews/admin/statistics?${params}`);
    return response.data;
  },

  toggleReviewVisibility: async (reviewId, isHidden) => {
    const response = await apiClient.patch(`/reviews/${reviewId}/visibility`, { isHidden });
    return response.data;
  },

  deleteReviewAdmin: async (reviewId) => {
    const response = await apiClient.delete(`/reviews/admin/${reviewId}`);
    return response.data;
  },
};
