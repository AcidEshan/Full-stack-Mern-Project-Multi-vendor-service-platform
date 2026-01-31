import apiClient from './apiClient';

export const userApi = {
  // Get all users (admin only)
  getAllUsers: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/users?${params}`);
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  // Update user
  updateUser: async (userId, userData) => {
    const response = await apiClient.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },

  // Block/unblock user
  toggleBlockUser: async (userId, isBlocked) => {
    const response = await apiClient.patch(`/users/${userId}/block`, { isBlocked });
    return response.data;
  },

  // Upload profile picture
  uploadProfilePicture: async (userId, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await apiClient.post(`/users/${userId}/profile-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Remove profile picture
  removeProfilePicture: async (userId) => {
    const response = await apiClient.delete(`/users/${userId}/profile-picture`);
    return response.data;
  },

  // Update my profile (current user)
  updateMyProfile: async (userData) => {
    const response = await apiClient.put('/users/me', userData);
    return response.data;
  },

  // Upload my profile picture
  uploadMyProfilePicture: async (imageFile) => {
    const formData = new FormData();
    formData.append('profilePicture', imageFile);
    const response = await apiClient.post('/upload/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Remove my profile picture
  removeMyProfilePicture: async () => {
    const response = await apiClient.delete('/users/me/profile-picture');
    return response.data;
  },
};
