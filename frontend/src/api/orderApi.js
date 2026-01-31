import apiClient from './apiClient';

export const orderApi = {
  // User endpoints
  createOrder: async (orderData) => {
    console.log('[ORDER API] Creating order with data:', orderData);
    const response = await apiClient.post('/orders', orderData);
    console.log('[ORDER API] Response received:', response);
    console.log('[ORDER API] Response data:', response.data);
    console.log('[ORDER API] Response status:', response.status);
    console.log('[ORDER API] Response headers:', response.headers);
    return response.data;
  },

  getUserOrders: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/orders/my-orders?${params}`);
    return response.data;
  },

  getOrderById: async (orderId) => {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  },

  cancelOrder: async (orderId, cancellationReason) => {
    const body = cancellationReason ? { cancellationReason } : {};
    const response = await apiClient.patch(`/orders/${orderId}/cancel`, body);
    return response.data;
  },

  rescheduleOrder: async (orderId, scheduleData) => {
    const response = await apiClient.patch(`/orders/${orderId}/reschedule`, scheduleData);
    return response.data;
  },

  // Vendor endpoints
  getVendorOrders: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/orders/vendor/orders?${params}`);
    return response.data;
  },

  acceptOrder: async (orderId) => {
    const response = await apiClient.patch(`/orders/vendor/${orderId}/accept`);
    return response.data;
  },

  rejectOrder: async (orderId, reason) => {
    const response = await apiClient.patch(`/orders/vendor/${orderId}/reject`, { reason });
    return response.data;
  },

  startOrder: async (orderId) => {
    const response = await apiClient.patch(`/orders/vendor/${orderId}/start`);
    return response.data;
  },

  completeOrder: async (orderId) => {
    const response = await apiClient.patch(`/orders/vendor/${orderId}/complete`);
    return response.data;
  },

  cancelOrderByVendor: async (orderId, reason) => {
    const response = await apiClient.patch(`/orders/vendor/${orderId}/cancel`, { reason });
    return response.data;
  },

  // Admin endpoints
  getAllOrders: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/orders/admin/all?${params}`);
    return response.data;
  },
};
