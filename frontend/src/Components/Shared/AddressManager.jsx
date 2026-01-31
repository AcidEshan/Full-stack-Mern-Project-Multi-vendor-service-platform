import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaCheck, FaTimes, FaHome, FaBriefcase, FaMapPin } from 'react-icons/fa';
import { addressApi } from '../../api/addressApi';
import Toast from './Toast';

const AddressManager = ({ onSelectAddress, selectionMode = false }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    label: 'Home',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Bangladesh',
    isDefault: false
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await addressApi.getMyAddresses();
      setAddresses(response.data.data.addresses || []);
    } catch (error) {
      setToast({ message: 'Failed to load addresses', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      if (editingAddress) {
        response = await addressApi.updateAddress(editingAddress._id, formData);
      } else {
        response = await addressApi.addAddress(formData);
      }
      
      setToast({ 
        message: response.data?.message || (editingAddress ? 'Address updated successfully' : 'Address added successfully'), 
        type: 'success' 
      });
      
      await fetchAddresses();
      handleCloseModal();
    } catch (error) {
      setToast({ 
        message: error.response?.data?.error?.message || error.response?.data?.message || 'Failed to save address', 
        type: 'error' 
      });
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label || 'Home',
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode || '',
      country: address.country || 'Bangladesh',
      isDefault: address.isDefault || false
    });
    setShowModal(true);
  };

  const handleDelete = (addressId) => {
    setAddressToDelete(addressId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!addressToDelete) return;
    
    try {
      const response = await addressApi.deleteAddress(addressToDelete);
      setToast({ 
        message: response.data?.message || 'Address deleted successfully', 
        type: 'success' 
      });
      await fetchAddresses();
      setShowDeleteModal(false);
      setAddressToDelete(null);
    } catch (error) {
      setToast({ 
        message: error.response?.data?.error?.message || error.response?.data?.message || 'Failed to delete address', 
        type: 'error' 
      });
      setShowDeleteModal(false);
      setAddressToDelete(null);
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const response = await addressApi.setDefaultAddress(addressId);
      setToast({ 
        message: response.data?.message || 'Default address updated', 
        type: 'success' 
      });
      await fetchAddresses();
    } catch (error) {
      setToast({ 
        message: error.response?.data?.error?.message || error.response?.data?.message || 'Failed to set default address', 
        type: 'error' 
      });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAddress(null);
    setFormData({
      label: 'Home',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Bangladesh',
      isDefault: false
    });
  };

  const getLabelIcon = (label) => {
    const lowerLabel = label?.toLowerCase();
    switch (lowerLabel) {
      case 'home': return <FaHome />;
      case 'work': case 'office': return <FaBriefcase />;
      default: return <FaMapPin />;
    }
  };

  const formatAddress = (address) => {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="loading loading-spinner loading-lg text-[#1B4B36]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          {selectionMode ? 'Select Address' : 'Saved Addresses'}
        </h3>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-sm bg-[#1B4B36] text-white hover:bg-[#2d7a54]"
        >
          <FaPlus /> Add Address
        </button>
      </div>

      {/* Address List */}
      {addresses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaMapMarkerAlt className="mx-auto text-5xl text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">No saved addresses yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn bg-[#1B4B36] text-white hover:bg-[#2d7a54]"
          >
            <FaPlus /> Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address._id}
              className={`bg-white border-2 rounded-lg p-4 transition-all ${
                address.isDefault 
                  ? 'border-[#1B4B36] shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              } ${selectionMode ? 'cursor-pointer hover:shadow-lg' : ''}`}
              onClick={() => selectionMode && onSelectAddress?.(address)}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[#1B4B36] text-xl">
                    {getLabelIcon(address.label)}
                  </span>
                  <span className="font-semibold text-gray-800 capitalize">
                    {address.label}
                  </span>
                  {address.isDefault && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                      Default
                    </span>
                  )}
                </div>
                
                {!selectionMode && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(address)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <FaEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(address._id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Address */}
              <p className="text-gray-700 text-sm mb-3">
                {formatAddress(address)}
              </p>

              {/* Actions */}
              {!selectionMode && !address.isDefault && (
                <button
                  onClick={() => handleSetDefault(address._id)}
                  className="text-sm text-[#1B4B36] hover:underline font-medium"
                >
                  Set as Default
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Label
                </label>
                <select
                  name="label"
                  value={formData.label}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
                  required
                >
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Street Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="123 Main St"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
                  required
                />
              </div>

              {/* City and State */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Dhaka"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Division *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Dhaka Division"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Postal Code and Country */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zip Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="10001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Default Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-[#1B4B36] border-gray-300 rounded focus:ring-[#1B4B36]"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-700">
                  Set as default address
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#1B4B36] text-white rounded-lg font-semibold hover:bg-[#2d7a54] transition-colors"
                >
                  <FaCheck className="inline mr-2" />
                  {editingAddress ? 'Update Address' : 'Save Address'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Address</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this address? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setAddressToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AddressManager;
