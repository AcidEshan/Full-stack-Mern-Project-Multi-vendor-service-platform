import apiClient from './apiClient';

export const authApi = {
  // Register user or vendor
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  // Logout
  logout: async (refreshToken) => {
    const response = await apiClient.post('/auth/logout', { refreshToken });
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await apiClient.post('/auth/change-password', passwordData);
    return response.data;
  },

  // Create admin (super_admin only)
  createAdmin: async (adminData) => {
    const response = await apiClient.post('/auth/create-admin', adminData);
    return response.data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response.data;
  },

  // Resend verification email
  resendVerification: async (email) => {
    const response = await apiClient.post('/auth/resend-verification', { email });
    return response.data;
  },

  // Send verification code (OTP)
  sendVerificationCode: async (email) => {
    const response = await apiClient.post('/auth/send-verification-code', { email });
    return response.data;
  },

  // Verify email code (OTP)
  verifyEmailCode: async (email, code) => {
    const response = await apiClient.post('/auth/verify-email-code', { email, code });
    return response.data;
  },

  // Resend verification code (OTP)
  resendVerificationCode: async (email) => {
    const response = await apiClient.post('/auth/resend-verification-code', { email });
    return response.data;
  },

  // Forgot password - Request password reset
  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password with token
  resetPassword: async (token, newPassword) => {
    const response = await apiClient.post('/auth/reset-password', { 
      token, 
      newPassword,
      confirmPassword: newPassword 
    });
    return response.data;
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    const response = await apiClient.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },
};
