import apiClient from './apiClient';

export const addressApi = {
  // Get all user addresses
  getMyAddresses: async () => {
    return await apiClient.get('/users/addresses');
  },

  // Add new address
  addAddress: async (addressData) => {
    return await apiClient.post('/users/addresses', addressData);
  },

  // Update address
  updateAddress: async (addressId, addressData) => {
    return await apiClient.put(`/users/addresses/${addressId}`, addressData);
  },

  // Delete address
  deleteAddress: async (addressId) => {
    return await apiClient.delete(`/users/addresses/${addressId}`);
  },

  // Set default address
  setDefaultAddress: async (addressId) => {
    return await apiClient.patch(`/users/addresses/${addressId}/default`);
  },

  // Get default address
  getDefaultAddress: async () => {
    return await apiClient.get('/users/addresses/default');
  },

  // Get address by ID
  getAddressById: async (addressId) => {
    return await apiClient.get(`/users/addresses/${addressId}`);
  }
};

export default addressApi;
