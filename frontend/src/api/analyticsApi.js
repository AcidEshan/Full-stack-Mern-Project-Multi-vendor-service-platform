import apiClient from './apiClient';

export const analyticsApi = {
  // Generate comprehensive analytics report
  generateReport: async (params) => {
    const response = await apiClient.post('/analytics/generate-report', params);
    return response.data;
  },
};
