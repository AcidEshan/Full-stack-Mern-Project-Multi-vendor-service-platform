import apiClient from './apiClient';

export const notificationApi = {
  // User endpoints
  getMyNotifications: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/notifications/my?${params}`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },

  getNotificationById: async (notificationId) => {
    const response = await apiClient.get(`/notifications/${notificationId}`);
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.patch('/notifications/mark-all-read');
    return response.data;
  },

  deleteNotification: async (notificationId) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  deleteAllRead: async () => {
    const response = await apiClient.delete('/notifications/read/all');
    return response.data;
  },

  getPreferences: async () => {
    const response = await apiClient.get('/notifications/preferences/me');
    return response.data;
  },

  updatePreferences: async (preferences) => {
    const response = await apiClient.put('/notifications/preferences/me', preferences);
    return response.data;
  },

  // Admin endpoints
  sendSystemNotification: async (notificationData) => {
    const response = await apiClient.post('/notifications/admin/system', notificationData);
    return response.data;
  },

  sendUserNotification: async (userId, notificationData) => {
    const response = await apiClient.post(`/notifications/admin/user/${userId}`, notificationData);
    return response.data;
  },

  getAllNotifications: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/notifications/admin/all?${params}`);
    return response.data;
  },

  bulkDelete: async (criteria) => {
    const response = await apiClient.delete('/notifications/admin/bulk', { data: criteria });
    return response.data;
  },
};
