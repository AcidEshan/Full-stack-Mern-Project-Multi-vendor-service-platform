import axios from 'axios';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log outgoing request details
    console.log('[API CLIENT] Outgoing Request:', {
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      data: config.data,
      headers: config.headers,
      params: config.params
    });
    
    return config;
  },
  (error) => {
    console.error('[API CLIENT] Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log('[API CLIENT] Response Received:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  async (error) => {
    console.error('[API CLIENT] Response Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    const originalRequest = error.config;
    const errorCode = error.response?.data?.error?.code;

    // Handle vendor deactivation - 403 with VENDOR_DEACTIVATED error code
    // Note: This handles edge cases where a vendor is deactivated AFTER logging in
    // Normally, deactivated vendors cannot log in at all (login is blocked)
    // But this catches operations if vendor is deactivated while already logged in
    if (errorCode === 'VENDOR_DEACTIVATED') {
      console.warn('[API CLIENT] Vendor account deactivated - blocking operations');
      
      // Dispatch custom event that components can listen to
      window.dispatchEvent(new CustomEvent('vendor-deactivated', {
        detail: {
          message: error.response.data.error.message,
          vendor: error.response.data.vendor
        }
      }));
      
      // Return the error so components can handle it specifically
      return Promise.reject(error);
    }

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/auth/refresh-token`,
            { refreshToken }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          // Update both tokens in localStorage
          localStorage.setItem('accessToken', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          // Update Zustand store if available
          if (window.__authStore) {
            window.__authStore.getState().setTokens(accessToken, newRefreshToken || refreshToken);
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
