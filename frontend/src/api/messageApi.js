import apiClient from './apiClient';

export const messageApi = {
  // Send a message
  sendMessage: async (messageData) => {
    const response = await apiClient.post('/messages', messageData);
    return response.data;
  },

  // Get all conversations
  getConversations: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/messages/conversations?${params}`);
    return response.data;
  },

  // Get conversation with specific user
  getConversation: async (userId, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/messages/conversation/${userId}?${params}`);
    return response.data;
  },

  // Get unread message count
  getUnreadCount: async () => {
    const response = await apiClient.get('/messages/unread-count');
    return response.data;
  },

  // Search messages
  searchMessages: async (keyword) => {
    const response = await apiClient.get(`/messages/search?keyword=${keyword}`);
    return response.data;
  },

  // Mark message as read
  markAsRead: async (messageId) => {
    const response = await apiClient.patch(`/messages/${messageId}/read`);
    return response.data;
  },

  // Delete message
  deleteMessage: async (messageId) => {
    const response = await apiClient.delete(`/messages/${messageId}`);
    return response.data;
  },
};
