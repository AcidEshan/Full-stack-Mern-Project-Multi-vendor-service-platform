import apiClient from './apiClient';

export const contactApi = {
  sendMessage: async (contactData) => {
    const response = await apiClient.post('/contact/send', contactData);
    return response.data;
  },
};
