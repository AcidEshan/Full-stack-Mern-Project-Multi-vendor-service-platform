import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/authApi';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,
      error: null,

      // Login action
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(credentials);
          
          // Extract tokens from nested data structure
          const responseData = response.data?.data || response.data || response;
          const { accessToken, refreshToken, user } = responseData;

          // Store tokens
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return response;
        } catch (error) {
          const errorMessage = error.response?.data?.error?.message || 'Login failed';
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      // Register action
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(userData);
          set({ isLoading: false, error: null });
          return response;
        } catch (error) {
          const errorMessage = error.response?.data?.error?.message || 'Registration failed';
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      // Logout action
      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) {
            await authApi.logout(refreshToken);
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear local storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');

          // Reset state
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      // Get current user
      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const response = await authApi.getMe();
          
          // Handle different response structures - backend returns data.user or data.data.user
          const userData = response.data.data?.user || response.data.user || response.data.data || response.data;
          
          set({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          get().logout();
        }
      },

      // Set tokens (used by apiClient interceptor)
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken, isAuthenticated: true });
      },

      // Update user in state
      updateUser: (user) => {
        set({ user });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => () => {
        set({ hasHydrated: true });
      },
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        hasHydrated: true,
      }),
    }
  )
);

// Expose store globally for apiClient interceptor
if (typeof window !== 'undefined') {
  window.__authStore = useAuthStore;
}

export default useAuthStore;
