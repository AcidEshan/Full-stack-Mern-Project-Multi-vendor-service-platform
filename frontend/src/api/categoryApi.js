import apiClient from './apiClient';

export const categoryApi = {
  // Public endpoints
  getAllCategories: async () => {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  getCategoryById: async (categoryId) => {
    const response = await apiClient.get(`/categories/${categoryId}`);
    return response.data;
  },

  // Admin endpoints
  createCategory: async (categoryData) => {
    const response = await apiClient.post('/categories', categoryData);
    return response.data;
  },

  updateCategory: async (categoryId, categoryData) => {
    const response = await apiClient.put(`/categories/${categoryId}`, categoryData);
    return response.data;
  },

  deleteCategory: async (categoryId) => {
    const response = await apiClient.delete(`/categories/${categoryId}`);
    return response.data;
  },

  toggleCategoryActive: async (categoryId) => {
    const response = await apiClient.patch(`/categories/${categoryId}/toggle-active`);
    return response.data;
  },
};
