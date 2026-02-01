import apiClient from './apiClient';

/**
 * Upload single image
 * @param {File} file - Image file to upload (max 250KB)
 * @returns {Promise<Object>} Upload response with fileId and url
 */
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiClient.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Upload multiple images
 * @param {File[]} files - Array of image files (max 10 images, 250KB each)
 * @returns {Promise<Object>} Upload response with array of file data
 */
export const uploadImages = async (files) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const response = await apiClient.post('/upload/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Upload profile picture
 * @param {File} file - Profile picture file (will be resized to 800x800)
 * @returns {Promise<Object>} Upload response with fileId, url, dimensions, etc.
 */
export const uploadProfilePicture = async (file) => {
  const formData = new FormData();
  formData.append('profilePicture', file);

  const response = await apiClient.post('/upload/profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Upload generic documents (images or PDFs) for flows like payment proofs
export const uploadDocument = async (fileOrFormData) => {
  const formData = fileOrFormData instanceof FormData ? fileOrFormData : new FormData();

  if (!(fileOrFormData instanceof FormData)) {
    formData.append('document', fileOrFormData);
  }

  const response = await apiClient.post('/upload/document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Delete uploaded file
 * @param {string} fileId - ID of the file to delete
 * @returns {Promise<Object>} Delete response
 */
export const deleteFile = async (fileId) => {
  const response = await apiClient.delete(`/upload/${fileId}`);
  return response.data;
};

/**
 * Get file URL
 * @param {string} fileId - ID of the file
 * @returns {string} Full URL to access the file
 */
export const getFileUrl = (fileId) => {
  if (!fileId) return '';
  // If it's already a full URL, return it
  if (fileId.startsWith('http')) return fileId;
  // If it's a base64 string, return it
  if (fileId.startsWith('data:')) return fileId;
  // Otherwise construct the API URL
  const baseURL = import.meta.env.VITE_API_URL || 'https://full-stack-mern-project-multi-vendor.onrender.com/api/v1';
  return `${baseURL}/upload/${fileId}`;
};
