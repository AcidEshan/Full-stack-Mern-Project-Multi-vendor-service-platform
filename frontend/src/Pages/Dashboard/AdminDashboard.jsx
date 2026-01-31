import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaStore,
  FaSignOutAlt,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaEye,
  FaToggleOn,
  FaToggleOff,
  FaList,
  FaTags,
  FaStar,
  FaTruck,
  FaChartBar,
  FaBoxOpen,
} from 'react-icons/fa';
import { MdAdd, MdClose } from 'react-icons/md';
import useAuthStore from '../../store/authStore';
import { userApi } from '../../api/userApi';
import { vendorApi } from '../../api/vendorApi';
import { categoryApi } from '../../api/categoryApi';
import VendorFormModal from '../../Components/VendorFormModal';
import AdminCouponManager from '../../Components/Shared/AdminCouponManager';
import AdminReviewModeration from '../../Components/Shared/AdminReviewModeration';
import AdminOrderTracker from '../../Components/Shared/AdminOrderTracker';
import AdminAnalytics from '../../Components/Shared/AdminAnalytics';
import AdminServiceManager from '../../Components/Shared/AdminServiceManager';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('vendors');
  const [vendors, setVendors] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showCreateVendorModal, setShowCreateVendorModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showVendorDetailsModal, setShowVendorDetailsModal] = useState(false);
  const [vendorDetails, setVendorDetails] = useState(null);
  const [loadingVendorDetails, setLoadingVendorDetails] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    confirmClass: 'btn-primary'
  });

  // Category states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '',
    image: '',
    displayOrder: 0
  });

  useEffect(() => {
    if (activeTab === 'vendors') {
      fetchVendors();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'categories') {
      fetchCategories();
    }
  }, [activeTab]);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const response = await vendorApi.getAllVendors();
      setVendors(response.data.vendors || []);
    } catch (err) {
      setError('Failed to fetch vendors');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await userApi.getAllUsers({ role: 'user' });
      setUsers(response.data.users || []);
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await categoryApi.getAllCategories();
      setCategories(response.data.categories || []);
    } catch (err) {
      setError('Failed to fetch categories');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleApproveVendor = async (vendorId) => {
    setConfirmModal({
      show: true,
      title: 'Approve Vendor',
      message: 'Are you sure you want to approve this vendor? They will be able to list their services on the platform.',
      confirmText: 'Approve',
      confirmClass: 'btn-success',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, show: false });
        setIsLoading(true);
        try {
          await vendorApi.approveVendor(vendorId);
          setSuccess('Vendor approved successfully');
          await fetchVendors();
        } catch (err) {
          setError(err.response?.data?.error?.message || 'Failed to approve vendor');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleRejectVendor = async (vendorId) => {
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setIsLoading(true);
    try {
      await vendorApi.rejectVendor(vendorId, rejectReason);
      setSuccess('Vendor rejected successfully');
      setRejectReason('');
      setShowVendorModal(false);
      await fetchVendors();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to reject vendor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVendor = async (vendorData) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create vendor through registration with vendor role
      const dataToSend = {
        email: vendorData.email,
        password: vendorData.password,
        confirmPassword: vendorData.confirmPassword,
        firstName: vendorData.firstName,
        lastName: vendorData.lastName,
        phone: vendorData.phone,
        role: 'vendor',
        companyName: vendorData.companyName,
        description: vendorData.companyDescription,
      };
      
      await vendorApi.createVendor(dataToSend);
      setShowCreateVendorModal(false);
      setSuccess('Vendor created successfully! They need to verify their email to access the platform.');
      // Wait a bit before fetching to allow DB to sync
      setTimeout(() => {
        fetchVendors();
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create vendor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVendorStatus = async (vendorId, isActive) => {
    setIsLoading(true);
    try {
      await vendorApi.toggleVendorStatus(vendorId, !isActive);
      setSuccess(`Vendor ${!isActive ? 'activated' : 'deactivated'} successfully`);
      await fetchVendors();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVendor = async (vendorId) => {
    setConfirmModal({
      show: true,
      title: 'Delete Vendor',
      message: 'Are you sure you want to delete this vendor? This action cannot be undone and will remove all their services and data.',
      confirmText: 'Delete',
      confirmClass: 'btn-error',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, show: false });
        setIsLoading(true);
        try {
          await vendorApi.deleteVendor(vendorId);
          setSuccess('Vendor deleted successfully');
          await fetchVendors();
        } catch (err) {
          setError(err.response?.data?.error?.message || 'Failed to delete vendor');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleToggleBlockUser = async (userId, isBlocked) => {
    setIsLoading(true);
    try {
      await userApi.toggleBlockUser(userId, !isBlocked);
      setSuccess(`User ${!isBlocked ? 'blocked' : 'unblocked'} successfully`);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    setConfirmModal({
      show: true,
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone and will remove all their orders and data.',
      confirmText: 'Delete',
      confirmClass: 'btn-error',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, show: false });
        setIsLoading(true);
        try {
          await userApi.deleteUser(userId);
          setSuccess('User deleted successfully');
          await fetchUsers();
        } catch (err) {
          setError(err.response?.data?.error?.message || 'Failed to delete user');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const openRejectModal = (vendor) => {
    setSelectedVendor(vendor);
    setRejectReason('');
    setShowVendorModal(true);
  };

  const closeRejectModal = () => {
    setShowVendorModal(false);
    setSelectedVendor(null);
    setRejectReason('');
  };

  const handleViewVendorDetails = async (vendorId) => {
    setLoadingVendorDetails(true);
    setShowVendorDetailsModal(true);
    setVendorDetails(null);
    
    try {
      const response = await vendorApi.getVendorById(vendorId);
      setVendorDetails(response.data.vendor);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch vendor details');
      setShowVendorDetailsModal(false);
    } finally {
      setLoadingVendorDetails(false);
    }
  };

  const closeVendorDetailsModal = () => {
    setShowVendorDetailsModal(false);
    setVendorDetails(null);
  };

  // Category handlers
  const handleOpenCategoryModal = (category = null) => {
    setError('');
    setSuccess('');
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name || '',
        description: category.description || '',
        icon: category.icon || '',
        image: category.image || '',
        displayOrder: category.displayOrder || 0
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        icon: '',
        image: '',
        displayOrder: 0
      });
    }
    setShowCategoryModal(true);
  };

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setError('');
    setSuccess('');
    setCategoryForm({
      name: '',
      description: '',
      icon: '',
      image: '',
      displayOrder: 0
    });
  };

  const handleCategoryFormChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm(prev => ({
      ...prev,
      [name]: name === 'displayOrder' ? parseInt(value) || 0 : value
    }));
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingCategory) {
        await categoryApi.updateCategory(editingCategory._id, categoryForm);
        setSuccess('Category updated successfully');
      } else {
        await categoryApi.createCategory(categoryForm);
        setSuccess('Category created successfully');
      }
      handleCloseCategoryModal();
      await fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    setConfirmModal({
      show: true,
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category? This action cannot be undone.',
      confirmText: 'Delete',
      confirmClass: 'btn-error',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, show: false });
        setIsLoading(true);
        try {
          await categoryApi.deleteCategory(categoryId);
          setSuccess('Category deleted successfully');
          await fetchCategories();
        } catch (err) {
          setError(err.response?.data?.error?.message || 'Failed to delete category');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleToggleCategoryActive = async (categoryId) => {
    setIsLoading(true);
    try {
      await categoryApi.toggleCategoryActive(categoryId);
      setSuccess('Category status updated successfully');
      await fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update category status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B4B36] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-[#FCDE70] mt-1">
                Welcome back, {user?.firstName} {user?.lastName}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="btn bg-[#FCDE70] text-[#1B4B36] border-none hover:bg-yellow-400"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {success && (
          <div className="alert alert-success mb-4 bg-green-50 border border-green-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-green-600 shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-green-600">{success}</span>
            <button onClick={() => setSuccess('')} className="btn btn-sm btn-ghost">×</button>
          </div>
        )}

        {error && (
          <div className="alert alert-error mb-4 bg-red-50 border border-red-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-red-600 shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-red-600">{error}</span>
            <button onClick={() => setError('')} className="btn btn-sm btn-ghost">×</button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="tabs tabs-boxed bg-transparent p-4">
            <button
              className={`tab tab-lg gap-2 ${
                activeTab === 'vendors' ? 'tab-active bg-[#1B4B36] text-[#FCDE70]' : ''
              }`}
              onClick={() => setActiveTab('vendors')}
            >
              <FaStore />
              Vendors
            </button>
            <button
              className={`tab tab-lg gap-2 ${
                activeTab === 'users' ? 'tab-active bg-[#1B4B36] text-[#FCDE70]' : ''
              }`}
              onClick={() => setActiveTab('users')}
            >
              <FaUsers />
              Users
            </button>
            <button
              className={`tab tab-lg gap-2 ${
                activeTab === 'categories' ? 'tab-active bg-[#1B4B36] text-[#FCDE70]' : ''
              }`}
              onClick={() => setActiveTab('categories')}
            >
              <FaList />
              Categories
            </button>
            <button
              className={`tab tab-lg gap-2 ${
                activeTab === 'services' ? 'tab-active bg-[#1B4B36] text-[#FCDE70]' : ''
              }`}
              onClick={() => setActiveTab('services')}
            >
              <FaBoxOpen />
              Services
            </button>
            <button
              className={`tab tab-lg gap-2 ${
                activeTab === 'coupons' ? 'tab-active bg-[#1B4B36] text-[#FCDE70]' : ''
              }`}
              onClick={() => setActiveTab('coupons')}
            >
              <FaTags />
              Coupons
            </button>
            <button
              className={`tab tab-lg gap-2 ${
                activeTab === 'reviews' ? 'tab-active bg-[#1B4B36] text-[#FCDE70]' : ''
              }`}
              onClick={() => setActiveTab('reviews')}
            >
              <FaStar />
              Reviews
            </button>
            <button
              className={`tab tab-lg gap-2 ${
                activeTab === 'orders' ? 'tab-active bg-[#1B4B36] text-[#FCDE70]' : ''
              }`}
              onClick={() => setActiveTab('orders')}
            >
              <FaTruck />
              Orders
            </button>
            <button
              className={`tab tab-lg gap-2 ${
                activeTab === 'analytics' ? 'tab-active bg-[#1B4B36] text-[#FCDE70]' : ''
              }`}
              onClick={() => setActiveTab('analytics')}
            >
              <FaChartBar />
              Analytics
            </button>
          </div>
        </div>

        {/* Vendors Tab */}
        {activeTab === 'vendors' && (
          <div>
            {/* Pending Vendors Summary */}
            {vendors.filter(v => v.approvalStatus === 'pending').length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow mb-6">
                <div className="flex items-start">
                  <div className="shrink-0">
                    <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-lg font-semibold text-yellow-800">
                      Pending Vendor Registrations
                    </h3>
                    <p className="mt-2 text-sm text-yellow-700">
                      You have <span className="font-bold">{vendors.filter(v => v.approvalStatus === 'pending').length}</span> vendor(s) waiting for approval. Review and approve them to allow them access to the system.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-[#1B4B36]">Vendor Management</h2>
                  <p className="text-gray-600 mt-1">Manage and approve vendor registrations</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={fetchVendors}
                    className="btn bg-[#FCDE70] text-[#1B4B36] border-none hover:bg-yellow-400 gap-2"
                    disabled={isLoading}
                    title="Refresh vendor list"
                  >
                    {isLoading ? (
                      <span className="loading loading-spinner loading-xs text-[#1B4B36]"></span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowCreateVendorModal(true)}
                    className="btn bg-[#1B4B36] text-white hover:bg-[#2a6b4f] border-none gap-2"
                  >
                    <MdAdd size={20} />
                    Create Vendor
                  </button>
                </div>
              </div>

            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <span className="loading loading-spinner loading-lg text-[#1B4B36]"></span>
              </div>
            ) : vendors.length === 0 ? (
              <div className="text-center p-12 text-gray-500">
                <FaStore className="mx-auto text-6xl mb-4 text-gray-300" />
                <p className="text-lg">No vendors found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead className="bg-[#1B4B36] text-[#FCDE70]">
                    <tr>
                      <th>Company Name</th>
                      <th>Owner</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Approval</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((vendor) => (
                      <tr key={vendor._id}>
                        <td className="font-semibold">{vendor.companyName}</td>
                        <td>
                          {vendor.userId?.firstName} {vendor.userId?.lastName}
                        </td>
                        <td>{vendor.userId?.email}</td>
                        <td>
                          <span
                            className={`badge ${
                              vendor.isActive ? 'badge-success' : 'badge-error'
                            }`}
                          >
                            {vendor.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              vendor.approvalStatus === 'approved'
                                ? 'badge-success'
                                : vendor.approvalStatus === 'rejected'
                                ? 'badge-error'
                                : 'badge-warning'
                            }`}
                          >
                            {vendor.approvalStatus}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            {vendor.approvalStatus === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveVendor(vendor._id)}
                                  className="btn btn-sm btn-success text-white"
                                  title="Approve"
                                >
                                  <FaCheck />
                                </button>
                                <button
                                  onClick={() => openRejectModal(vendor)}
                                  className="btn btn-sm btn-error text-white"
                                  title="Reject"
                                >
                                  <FaTimes />
                                </button>
                              </>
                            )}
                            {vendor.approvalStatus === 'approved' && (
                              <button
                                onClick={() => handleToggleVendorStatus(vendor._id, vendor.isActive)}
                                className={`btn btn-sm ${
                                  vendor.isActive ? 'btn-warning' : 'btn-success'
                                } text-white`}
                                title={vendor.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {vendor.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                            <button
                              onClick={() => handleViewVendorDetails(vendor._id)}
                              className="btn btn-sm btn-info text-white"
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                            <button
                              onClick={() => handleDeleteVendor(vendor._id)}
                              className="btn btn-sm btn-error text-white"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-[#1B4B36]">User Management</h2>
              <p className="text-gray-600 mt-1">Manage registered users</p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <span className="loading loading-spinner loading-lg text-[#1B4B36]"></span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center p-12 text-gray-500">
                <FaUsers className="mx-auto text-6xl mb-4 text-gray-300" />
                <p className="text-lg">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead className="bg-[#1B4B36] text-[#FCDE70]">
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="font-semibold">
                          {user.firstName} {user.lastName}
                        </td>
                        <td>{user.email}</td>
                        <td>{user.phone}</td>
                        <td>
                          <span
                            className={`badge ${
                              user.isBlocked
                                ? 'badge-error'
                                : user.isActive
                                ? 'badge-success'
                                : 'badge-warning'
                            }`}
                          >
                            {user.isBlocked ? 'Blocked' : user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleBlockUser(user._id, user.isBlocked)}
                              className={`btn btn-sm ${
                                user.isBlocked ? 'btn-success' : 'btn-warning'
                              } text-white`}
                              title={user.isBlocked ? 'Unblock' : 'Block'}
                            >
                              {user.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="btn btn-sm btn-error text-white"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="bg-white rounded-lg shadow overflow-hidden p-6">
            <h2 className="text-2xl font-bold text-[#1B4B36] mb-6">Service Management</h2>
            <AdminServiceManager />
          </div>
        )}

        {/* Coupons Tab */}
        {activeTab === 'coupons' && (
          <div className="bg-white rounded-lg shadow overflow-hidden p-6">
            <AdminCouponManager />
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-lg shadow overflow-hidden p-6">
            <AdminReviewModeration />
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow overflow-hidden p-6">
            <AdminOrderTracker />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow overflow-hidden p-6">
            <AdminAnalytics />
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#1B4B36]">Category Management</h2>
                <p className="text-gray-600 mt-1">Manage service categories</p>
              </div>
              <button
                onClick={() => handleOpenCategoryModal()}
                className="btn bg-[#1B4B36] hover:bg-[#143426] text-white gap-2"
              >
                <MdAdd className="text-xl" />
                Add Category
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <span className="loading loading-spinner loading-lg text-[#1B4B36]"></span>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center p-12 text-gray-500">
                <FaList className="mx-auto text-6xl mb-4 text-gray-300" />
                <p className="text-lg">No categories found</p>
                <p className="text-sm mt-2">Create your first category to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead className="bg-[#1B4B36] text-[#FCDE70]">
                    <tr>
                      <th>Order</th>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.sort((a, b) => a.displayOrder - b.displayOrder).map((category) => (
                      <tr key={category._id}>
                        <td className="font-semibold text-center">{category.displayOrder}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            {category.icon && <span className="text-2xl">{category.icon}</span>}
                            <span className="font-semibold">{category.name}</span>
                          </div>
                        </td>
                        <td className="text-gray-600">{category.slug}</td>
                        <td className="max-w-xs truncate">{category.description || 'N/A'}</td>
                        <td>
                          <button
                            onClick={() => handleToggleCategoryActive(category._id)}
                            className="flex items-center gap-1"
                          >
                            {category.isActive ? (
                              <>
                                <FaToggleOn className="text-green-600 text-2xl" />
                                <span className="text-green-600 text-sm">Active</span>
                              </>
                            ) : (
                              <>
                                <FaToggleOff className="text-gray-400 text-2xl" />
                                <span className="text-gray-600 text-sm">Inactive</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td>{new Date(category.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenCategoryModal(category)}
                              className="btn btn-sm btn-info text-white"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category._id)}
                              className="btn btn-sm btn-error text-white"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <button
              className="btn btn-sm btn-circle absolute right-2 top-2"
              onClick={handleCloseCategoryModal}
            >
              <MdClose />
            </button>

            <h3 className="font-bold text-2xl text-[#1B4B36] mb-4">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h3>

            {/* Error Display in Modal */}
            {error && (
              <div className="alert alert-error mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Success Display in Modal */}
            {success && (
              <div className="alert alert-success mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">
                    Category Name <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={categoryForm.name}
                  onChange={handleCategoryFormChange}
                  className="input input-bordered w-full"
                  placeholder="e.g., Home Cleaning"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Description</span>
                </label>
                <textarea
                  name="description"
                  value={categoryForm.description}
                  onChange={handleCategoryFormChange}
                  className="textarea textarea-bordered w-full"
                  placeholder="Brief description of this category"
                  rows={3}
                  maxLength={500}
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">
                    Optional • {categoryForm.description.length}/500 characters
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Icon (Emoji)</span>
                  </label>
                  <input
                    type="text"
                    name="icon"
                    value={categoryForm.icon}
                    onChange={handleCategoryFormChange}
                    className="input input-bordered w-full"
                    placeholder="🏠"
                    maxLength={10}
                  />
                  <label className="label">
                    <span className="label-text-alt text-gray-500">
                      Optional • Shows in admin table
                    </span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Display Order</span>
                  </label>
                  <input
                    type="number"
                    name="displayOrder"
                    value={categoryForm.displayOrder}
                    onChange={handleCategoryFormChange}
                    className="input input-bordered w-full"
                    placeholder="0"
                    min={0}
                  />
                  <label className="label">
                    <span className="label-text-alt text-gray-500">
                      Lower numbers appear first
                    </span>
                  </label>
                </div>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={handleCloseCategoryModal}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn bg-[#1B4B36] hover:bg-[#143426] text-white"
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>{editingCategory ? 'Update Category' : 'Create Category'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Vendor Modal */}
      {showVendorModal && selectedVendor && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-2xl text-[#1B4B36] mb-4">Reject Vendor</h3>
            <p className="mb-4">
              You are about to reject <strong>{selectedVendor.companyName}</strong>. Please provide a
              reason:
            </p>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Rejection Reason</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="textarea textarea-bordered w-full"
                placeholder="Explain why this vendor is being rejected..."
                rows="4"
              ></textarea>
            </div>

            <div className="modal-action">
              <button onClick={closeRejectModal} className="btn btn-ghost">
                Cancel
              </button>
              <button
                onClick={() => handleRejectVendor(selectedVendor._id)}
                disabled={!rejectReason.trim() || isLoading}
                className="btn btn-error text-white"
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Processing...
                  </>
                ) : (
                  'Reject Vendor'
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={closeRejectModal}></div>
        </div>
      )}

      {/* Vendor Details Modal */}
      {showVendorDetailsModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeVendorDetailsModal}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              <MdClose />
            </button>

            <h3 className="font-bold text-2xl text-[#1B4B36] mb-6">Vendor Details</h3>

            {loadingVendorDetails ? (
              <div className="flex justify-center items-center py-12">
                <span className="loading loading-spinner loading-lg text-[#1B4B36]"></span>
              </div>
            ) : vendorDetails ? (
              <div className="space-y-6">
                {/* Company Information */}
                <div className="border-b pb-4">
                  <h4 className="text-lg font-semibold text-[#1B4B36] mb-3">Company Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Company Name</p>
                      <p className="font-semibold">{vendorDetails.companyName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Approval Status</p>
                      <span className={`badge ${
                        vendorDetails.approvalStatus === 'approved' ? 'badge-success' :
                        vendorDetails.approvalStatus === 'rejected' ? 'badge-error' :
                        'badge-warning'
                      }`}>
                        {vendorDetails.approvalStatus}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Active Status</p>
                      <span className={`badge ${vendorDetails.isActive ? 'badge-success' : 'badge-error'}`}>
                        {vendorDetails.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Services</p>
                      <p className="font-semibold">{vendorDetails.totalServices || 0}</p>
                    </div>
                  </div>
                  {vendorDetails.description && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="text-sm mt-1">{vendorDetails.description}</p>
                    </div>
                  )}
                </div>

                {/* Owner Information */}
                {vendorDetails.userId && (
                  <div className="border-b pb-4">
                    <h4 className="text-lg font-semibold text-[#1B4B36] mb-3">Owner Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-semibold">
                          {vendorDetails.userId.firstName} {vendorDetails.userId.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-semibold">{vendorDetails.userId.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-semibold">{vendorDetails.userId.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email Verified</p>
                        <span className={`badge ${vendorDetails.userId.isEmailVerified ? 'badge-success' : 'badge-warning'}`}>
                          {vendorDetails.userId.isEmailVerified ? 'Verified' : 'Not Verified'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Account Status</p>
                        <span className={`badge ${vendorDetails.userId.isBlocked ? 'badge-error' : 'badge-success'}`}>
                          {vendorDetails.userId.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Details */}
                <div>
                  <h4 className="text-lg font-semibold text-[#1B4B36] mb-3">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vendorDetails.address && (
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="text-sm">
                          {[
                            vendorDetails.address.street,
                            vendorDetails.address.city,
                            vendorDetails.address.state,
                            vendorDetails.address.zipCode,
                            vendorDetails.address.country
                          ].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                    {vendorDetails.website && (
                      <div>
                        <p className="text-sm text-gray-500">Website</p>
                        <a href={vendorDetails.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                          {vendorDetails.website}
                        </a>
                      </div>
                    )}
                    {vendorDetails.yearsInBusiness && (
                      <div>
                        <p className="text-sm text-gray-500">Years in Business</p>
                        <p className="font-semibold">{vendorDetails.yearsInBusiness} years</p>
                      </div>
                    )}
                    {vendorDetails.numberOfEmployees && (
                      <div>
                        <p className="text-sm text-gray-500">Number of Employees</p>
                        <p className="font-semibold">{vendorDetails.numberOfEmployees}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Joined Date</p>
                      <p className="text-sm">{new Date(vendorDetails.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="text-sm">{new Date(vendorDetails.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Rejection Info */}
                {vendorDetails.approvalStatus === 'rejected' && vendorDetails.rejectionReason && (
                  <div className="alert alert-warning">
                    <div>
                      <p className="font-semibold">Rejection Reason:</p>
                      <p className="text-sm mt-1">{vendorDetails.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No vendor details available
              </div>
            )}

            <div className="modal-action">
              <button onClick={closeVendorDetailsModal} className="btn btn-ghost">
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/50" onClick={closeVendorDetailsModal}></div>
        </div>
      )}

      {/* Create Vendor Modal */}
      {showCreateVendorModal && (
        <VendorFormModal
          onClose={() => {
            setShowCreateVendorModal(false);
            setError('');
            setSuccess('');
          }}
          onSubmit={handleCreateVendor}
          isLoading={isLoading}
          error={error}
          success={success}
        />
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">{confirmModal.title}</h3>
            <p className="py-4">{confirmModal.message}</p>
            <div className="modal-action">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                className="btn btn-ghost"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`btn ${confirmModal.confirmClass} text-white`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Processing...
                  </>
                ) : (
                  confirmModal.confirmText
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/50" onClick={() => !isLoading && setConfirmModal({ ...confirmModal, show: false })}></div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
