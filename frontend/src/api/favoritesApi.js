import apiClient from './apiClient';

export const favoritesApi = {
  // Add to favorites
  addServiceToFavorites: async (serviceId) => {
    const response = await apiClient.post(`/favorites/service/${serviceId}`);
    return response.data;
  },

  addVendorToFavorites: async (vendorId) => {
    const response = await apiClient.post(`/favorites/vendor/${vendorId}`);
    return response.data;
  },

  // Remove from favorites
  removeServiceFromFavorites: async (serviceId) => {
    const response = await apiClient.delete(`/favorites/service/${serviceId}`);
    return response.data;
  },

  removeVendorFromFavorites: async (vendorId) => {
    const response = await apiClient.delete(`/favorites/vendor/${vendorId}`);
    return response.data;
  },

  // Get favorites
  getFavoriteServices: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/favorites/services?${params}`);
    return response.data;
  },

  getFavoriteVendors: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/favorites/vendors?${params}`);
    return response.data;
  },

  // Check if in favorites
  checkServiceInFavorites: async (serviceId) => {
    const response = await apiClient.get(`/favorites/service/${serviceId}/check`);
    return response.data;
  },

  checkVendorInFavorites: async (vendorId) => {
    const response = await apiClient.get(`/favorites/vendor/${vendorId}/check`);
    return response.data;
  },
};
