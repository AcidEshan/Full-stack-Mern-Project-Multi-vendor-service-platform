import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaTimes, FaImage, FaUpload } from 'react-icons/fa';
import { serviceApi } from '../../api/serviceApi';
import { categoryApi } from '../../api/categoryApi';
import { uploadImages, getFileUrl } from '../../api/uploadApi';
import useAuthStore from '../../store/authStore';

const ServiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);

  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    description: '',
    price: '',
    discount: '',
    billingType: 'per_service',
    duration: '',
    images: [],
    features: [''],
    workProcessSteps: [''],
    terms: '',
    tags: [''],
  });

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchServiceData();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAllCategories();
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    }
  };

  const fetchServiceData = async () => {
    try {
      setLoadingData(true);
      const response = await serviceApi.getServiceById(id);
      const service = response.data.service;

      setFormData({
        categoryId: service.categoryId?._id || service.categoryId || '',
        name: service.name || '',
        description: service.description || '',
        price: service.price || '',
        discount: service.discount || '',
        billingType: service.billingType || 'per_service',
        duration: service.duration || '',
        images: service.images || [],
        features: service.features?.length > 0 ? service.features : [''],
        workProcessSteps: service.workProcessSteps?.length > 0 ? service.workProcessSteps : [''],
        terms: service.terms || '',
        tags: service.tags?.length > 0 ? service.tags : [''],
      });
      setLoadingData(false);
    } catch (err) {
      console.error('Error fetching service:', err);
      setError('Failed to load service data');
      setLoadingData(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleArrayInputChange = (index, value, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const handleAddArrayItem = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const handleRemoveArrayItem = (index, field) => {
    if (formData[field].length > 1) {
      setFormData((prev) => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }));
    }
  };

  const handleImageFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    
    // Validate number of images
    if (formData.images.length + files.length > 10) {
      setError('Maximum 10 images allowed');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Validate file sizes (250KB = 256000 bytes)
    const maxSize = 250 * 1024; // 250KB in bytes
    const invalidFiles = files.filter(file => file.size > maxSize);
    
    if (invalidFiles.length > 0) {
      setError(`Some images exceed 250KB limit. Please compress them before uploading.`);
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidTypes = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidTypes.length > 0) {
      setError('Only JPEG, PNG, GIF, and WebP images are allowed');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Upload images
    try {
      setUploadingImages(true);
      setError(null);
      
      const response = await uploadImages(files);
      
      if (response.success && response.data.files) {
        const uploadedUrls = response.data.files.map(file => {
          // If it's base64, store the base64 string
          if (file.storageType === 'base64') {
            return file.base64;
          }
          // If it's GridFS, store the URL
          return getFileUrl(file.fileId);
        });
        
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
        }));
        
        setSuccess(`${files.length} image(s) uploaded successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setError(err.response?.data?.error?.message || 'Failed to upload images');
      setTimeout(() => setError(null), 5000);
    } finally {
      setUploadingImages(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.categoryId || !formData.name || !formData.description || !formData.price) {
      setError('Please fill in all required fields (Category, Name, Description, Price)');
      return;
    }

    if (formData.price <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    if (formData.discount && (formData.discount < 0 || formData.discount > 100)) {
      setError('Discount must be between 0 and 100');
      return;
    }

    // Filter out empty values from arrays
    const cleanedData = {
      categoryId: formData.categoryId,
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      discount: formData.discount ? parseFloat(formData.discount) : 0,
      billingType: formData.billingType,
      duration: formData.duration ? parseInt(formData.duration) : undefined,
      images: formData.images.filter((img) => img.trim() !== ''),
      features: formData.features.filter((f) => f.trim() !== ''),
      workProcessSteps: formData.workProcessSteps.filter((s) => s.trim() !== ''),
      terms: formData.terms.trim(),
      tags: formData.tags.filter((t) => t.trim() !== ''),
    };

    try {
      setLoading(true);

      if (isEditMode) {
        await serviceApi.updateService(id, cleanedData);
        setSuccess('Service updated successfully!');
      } else {
        await serviceApi.createService(cleanedData);
        setSuccess('Service created successfully!');
      }

      setTimeout(() => {
        navigate('/vendor-dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error saving service:', err);
      setError(err.response?.data?.error?.message || 'Failed to save service');
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg text-[#1B4B36]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B4B36] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/vendor-dashboard')}
              className="btn btn-sm bg-[#FCDE70] text-[#1B4B36] border-none hover:bg-yellow-400"
            >
              <FaArrowLeft />
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold">
                {isEditMode ? 'Edit Service' : 'Create New Service'}
              </h1>
              <p className="text-[#FCDE70] mt-1">
                {isEditMode ? 'Update your service details' : 'Add a new service to your catalog'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert Messages */}
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success mb-4">
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-bold text-[#1B4B36] mb-4">Basic Information</h2>
            
            {/* Category */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">
                  Category <span className="text-red-500">*</span>
                </span>
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className="select select-bordered w-full"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Name */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">
                  Service Name <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Professional Home Cleaning"
                className="input input-bordered w-full"
                required
                minLength={3}
                maxLength={200}
              />
              <label className="label">
                <span className="label-text-alt text-gray-500">
                  3-200 characters
                </span>
              </label>
            </div>

            {/* Description */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">
                  Description <span className="text-red-500">*</span>
                </span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your service in detail..."
                className="textarea textarea-bordered w-full h-32"
                required
                minLength={20}
                maxLength={5000}
              />
              <label className="label">
                <span className="label-text-alt text-gray-500">
                  20-5000 characters ({formData.description.length}/5000)
                </span>
              </label>
            </div>
          </div>

          {/* Pricing & Duration */}
          <div>
            <h2 className="text-xl font-bold text-[#1B4B36] mb-4">Pricing & Duration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Price (৳) <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="input input-bordered w-full"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Discount */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Discount (%)</span>
                </label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="input input-bordered w-full"
                  min="0"
                  max="100"
                  step="1"
                />
              </div>

              {/* Billing Type */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Billing Type</span>
                </label>
                <select
                  name="billingType"
                  value={formData.billingType}
                  onChange={handleInputChange}
                  className="select select-bordered w-full"
                >
                  <option value="per_service">Per Service</option>
                  <option value="per_visit">Per Visit</option>
                </select>
              </div>

              {/* Duration */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Duration (minutes)</span>
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="e.g., 60"
                  className="input input-bordered w-full"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            {/* Price Preview */}
            {formData.price && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Price Preview:</p>
                <div className="flex items-baseline gap-2">
                  {formData.discount > 0 && (
                    <span className="text-lg text-gray-400 line-through">
                      ৳{parseFloat(formData.price).toFixed(2)}
                    </span>
                  )}
                  <span className="text-2xl font-bold text-[#1B4B36]">
                    ৳{(
                      parseFloat(formData.price) -
                      (parseFloat(formData.price) * (parseFloat(formData.discount) || 0)) / 100
                    ).toFixed(2)}
                  </span>
                  {formData.discount > 0 && (
                    <span className="text-sm text-green-600 font-semibold">
                      {formData.discount}% OFF
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Images */}
          <div>
            <h2 className="text-xl font-bold text-[#1B4B36] mb-4">Service Images</h2>
            <p className="text-sm text-gray-600 mb-2">
              Upload up to 10 images (max 250KB per image)
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Supported formats: JPEG, PNG, GIF, WebP
            </p>

            {/* Image Preview Grid */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={image}
                        alt={`Service ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300?text=Image';
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 btn btn-sm btn-circle btn-error text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTimes />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {formData.images.length < 10 && (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[#1B4B36] transition-colors">
                <FaUpload className="text-4xl text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  {uploadingImages ? 'Uploading...' : 'Click to upload images'}
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  {formData.images.length}/10 images uploaded
                </p>
                <label
                  htmlFor="image-upload"
                  className={`btn btn-sm gap-2 ${
                    uploadingImages
                      ? 'btn-disabled loading'
                      : 'bg-[#1B4B36] hover:bg-[#2d6b54] text-white border-none'
                  }`}
                >
                  {!uploadingImages && <FaImage />}
                  {uploadingImages ? 'Uploading...' : 'Choose Images'}
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  multiple
                  onChange={handleImageFileChange}
                  className="hidden"
                  disabled={uploadingImages || formData.images.length >= 10}
                />
              </div>
            )}

            {formData.images.length >= 10 && (
              <div className="alert alert-info">
                <span>Maximum number of images (10) reached</span>
              </div>
            )}
          </div>

          {/* Features */}
          <div>
            <h2 className="text-xl font-bold text-[#1B4B36] mb-4">Features</h2>
            <p className="text-sm text-gray-600 mb-4">List the key features of your service</p>

            <div className="space-y-3">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleArrayInputChange(index, e.target.value, 'features')}
                    placeholder="e.g., Deep cleaning included"
                    className="input input-bordered flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveArrayItem(index, 'features')}
                    className="btn btn-ghost btn-square text-red-600"
                    disabled={formData.features.length === 1}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => handleAddArrayItem('features')}
                className="btn btn-outline btn-sm gap-2"
              >
                <FaPlus />
                Add Feature
              </button>
            </div>
          </div>

          {/* Work Process Steps */}
          <div>
            <h2 className="text-xl font-bold text-[#1B4B36] mb-4">Work Process Steps</h2>
            <p className="text-sm text-gray-600 mb-4">Describe the steps of your service process</p>

            <div className="space-y-3">
              {formData.workProcessSteps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex items-center justify-center w-8 h-10 bg-[#1B4B36] text-white rounded font-semibold">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) =>
                      handleArrayInputChange(index, e.target.value, 'workProcessSteps')
                    }
                    placeholder="e.g., Initial consultation"
                    className="input input-bordered flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveArrayItem(index, 'workProcessSteps')}
                    className="btn btn-ghost btn-square text-red-600"
                    disabled={formData.workProcessSteps.length === 1}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => handleAddArrayItem('workProcessSteps')}
                className="btn btn-outline btn-sm gap-2"
              >
                <FaPlus />
                Add Step
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h2 className="text-xl font-bold text-[#1B4B36] mb-4">Tags</h2>
            <p className="text-sm text-gray-600 mb-4">Add tags to help customers find your service</p>

            <div className="space-y-3">
              {formData.tags.map((tag, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => handleArrayInputChange(index, e.target.value, 'tags')}
                    placeholder="e.g., cleaning"
                    className="input input-bordered flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveArrayItem(index, 'tags')}
                    className="btn btn-ghost btn-square text-red-600"
                    disabled={formData.tags.length === 1}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => handleAddArrayItem('tags')}
                className="btn btn-outline btn-sm gap-2"
              >
                <FaPlus />
                Add Tag
              </button>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div>
            <h2 className="text-xl font-bold text-[#1B4B36] mb-4">Terms & Conditions</h2>
            <textarea
              name="terms"
              value={formData.terms}
              onChange={handleInputChange}
              placeholder="Enter terms and conditions for this service..."
              className="textarea textarea-bordered w-full h-32"
              maxLength={2000}
            />
            <label className="label">
              <span className="label-text-alt text-gray-500">
                Optional, max 2000 characters ({formData.terms.length}/2000)
              </span>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn bg-[#1B4B36] hover:bg-[#143426] text-white flex-1"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{isEditMode ? 'Update Service' : 'Create Service'}</>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/vendor-dashboard')}
              className="btn btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceForm;
