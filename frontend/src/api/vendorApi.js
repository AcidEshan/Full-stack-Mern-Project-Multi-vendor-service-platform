import apiClient from './apiClient';

export const vendorApi = {
  // Get my vendor profile (for logged-in vendor)
  getMyProfile: async () => {
    const response = await apiClient.get('/vendors/me');
    return response.data;
  },

  // Get all vendors
  getAllVendors: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/vendors?${params}`);
    return response.data;
  },

  // Create vendor (admin only) - uses registration endpoint
  createVendor: async (vendorData) => {
    const response = await apiClient.post('/auth/register', vendorData);
    return response.data;
  },

  // Get vendor by ID
  getVendorById: async (vendorId) => {
    const response = await apiClient.get(`/vendors/${vendorId}`);
    return response.data;
  },

  // Update vendor
  updateVendor: async (vendorId, vendorData) => {
    const response = await apiClient.put(`/vendors/${vendorId}`, vendorData);
    return response.data;
  },

  // Delete vendor
  deleteVendor: async (vendorId) => {
    const response = await apiClient.delete(`/vendors/${vendorId}`);
    return response.data;
  },

  // Approve vendor (admin only)
  approveVendor: async (vendorId) => {
    const response = await apiClient.patch(`/vendors/${vendorId}/approve`);
    return response.data;
  },

  // Reject vendor (admin only)
  rejectVendor: async (vendorId, reason) => {
    const response = await apiClient.patch(`/vendors/${vendorId}/reject`, { reason });
    return response.data;
  },

  // Toggle vendor active status
  toggleVendorStatus: async (vendorId, isActive) => {
    const response = await apiClient.patch(`/vendors/${vendorId}/status`, { isActive });
    return response.data;
  },

  // Update working hours
  updateWorkingHours: async (workingHoursData) => {
    const response = await apiClient.put('/vendors/working-hours', workingHoursData);
    return response.data;
  },

  // Add holiday
  addHoliday: async (holidayData) => {
    const response = await apiClient.post('/vendors/me/holidays', holidayData);
    return response.data;
  },

  // Remove holiday
  removeHoliday: async (holidayId) => {
    const response = await apiClient.delete(`/vendors/me/holidays/${holidayId}`);
    return response.data;
  },
};
