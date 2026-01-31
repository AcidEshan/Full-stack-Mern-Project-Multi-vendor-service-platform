import apiClient from './apiClient';

export const serviceApi = {
  // Public endpoints
  getAllServices: async (filters = {}) => {
    // Build query params supporting advanced search
    const params = new URLSearchParams();
    
    // Add each filter if it exists
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    
    const response = await apiClient.get(`/services?${params.toString()}`);
    return response.data;
  },

  getServiceById: async (serviceId) => {
    const response = await apiClient.get(`/services/${serviceId}`);
    return response.data;
  },

  getServicesByCategory: async (categoryId, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/services/categories/${categoryId}/services?${params}`);
    return response.data;
  },

  // Vendor endpoints
  getVendorServices: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/services/vendor/services?${params}`);
    return response.data;
  },

  createService: async (serviceData) => {
    const response = await apiClient.post('/services/vendor/services', serviceData);
    return response.data;
  },

  updateService: async (serviceId, serviceData) => {
    const response = await apiClient.put(`/services/vendor/services/${serviceId}`, serviceData);
    return response.data;
  },

  deleteService: async (serviceId) => {
    const response = await apiClient.delete(`/services/vendor/services/${serviceId}`);
    return response.data;
  },

  toggleServiceActive: async (serviceId) => {
    const response = await apiClient.patch(`/services/vendor/services/${serviceId}/toggle-active`);
    return response.data;
  },

  toggleServiceAvailability: async (serviceId) => {
    const response = await apiClient.patch(`/services/vendor/services/${serviceId}/toggle-availability`);
    return response.data;
  },

  // Admin endpoints
  getAllServicesAdmin: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    const response = await apiClient.get(`/services?${params.toString()}`);
    return response.data;
  },

  approveService: async (serviceId) => {
    const response = await apiClient.patch(`/services/admin/${serviceId}/approve`);
    return response.data;
  },

  rejectService: async (serviceId, reason) => {
    const response = await apiClient.patch(`/services/admin/${serviceId}/reject`, { reason });
    return response.data;
  },

  blockService: async (serviceId, reason) => {
    const response = await apiClient.patch(`/services/admin/${serviceId}/block`, { reason });
    return response.data;
  },

  unblockService: async (serviceId) => {
    const response = await apiClient.patch(`/services/admin/${serviceId}/unblock`);
    return response.data;
  },

  deleteServiceAdmin: async (serviceId) => {
    const response = await apiClient.delete(`/services/admin/${serviceId}`);
    return response.data;
  },
};
