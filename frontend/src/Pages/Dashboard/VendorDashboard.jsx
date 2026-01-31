import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaBox, FaShoppingBag, FaStar, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaEye, FaCheck, FaTimes, FaImage, FaUpload, FaBuilding, FaInfoCircle, FaMapMarkerAlt, FaGlobe, FaFacebook, FaInstagram, FaTwitter, FaLinkedin, FaComments, FaClock, FaCheckCircle } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import Toast from '../../Components/Shared/Toast';
import useAuthStore from '../../store/authStore';
import { serviceApi } from '../../api/serviceApi';
import { orderApi } from '../../api/orderApi';
import { paymentApi } from '../../api/paymentApi';
import { vendorApi } from '../../api/vendorApi';
import { reviewApi } from '../../api/reviewApi';
import MessagingCenter from '../../Components/Shared/MessagingCenter';
import WorkingHoursManager from '../../Components/Shared/WorkingHoursManager';
import ReviewCard from '../../Components/Shared/ReviewCard';
import VendorDeactivationBanner from '../../Components/Shared/VendorDeactivationBanner';
import VendorDeactivationModal from '../../Components/Shared/VendorDeactivationModal';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  const [stats, setStats] = useState({
    totalServices: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [toast, setToast] = useState(null);
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);

  // Services state
  const [services, setServices] = useState([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Transactions state
  const [transactions, setTransactions] = useState([]);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [responseText, setResponseText] = useState('');

  // Vendor profile
  const [vendorProfile, setVendorProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    companyName: '',
    description: '',
    website: '',
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    yearsInBusiness: '',
    numberOfEmployees: ''
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }

    // Listen for vendor deactivation events from API interceptor
    // This handles the edge case where a vendor is deactivated WHILE already logged in
    const handleVendorDeactivated = (event) => {
      console.warn('⚠️ Vendor deactivated event received - account deactivated while logged in:', event.detail);
      setToast({ 
        message: '🚫 Your account has been deactivated. You will be logged out.', 
        type: 'error' 
      });
      // Refresh dashboard data to update vendor profile and show deactivation banner
      fetchDashboardData(true);
      
      // Auto-logout after 5 seconds to ensure they cannot continue using the system
      setTimeout(() => {
        logout();
        navigate('/');
      }, 5000);
    };

    window.addEventListener('vendor-deactivated', handleVendorDeactivated);

    return () => {
      window.removeEventListener('vendor-deactivated', handleVendorDeactivated);
    };
  }, [user]);

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      // Fetch vendor profile
      const profileResponse = await vendorApi.getMyProfile();
      const vendor = profileResponse.data.vendor;
      setVendorProfile(vendor);
      
      // Populate profile form
      setProfileForm({
        companyName: vendor.companyName || '',
        description: vendor.description || '',
        website: vendor.website || '',
        facebook: vendor.facebook || '',
        twitter: vendor.twitter || '',
        instagram: vendor.instagram || '',
        linkedin: vendor.linkedin || '',
        address: {
          street: vendor.address?.street || '',
          city: vendor.address?.city || '',
          state: vendor.address?.state || '',
          zipCode: vendor.address?.zipCode || '',
          country: vendor.address?.country || ''
        },
        yearsInBusiness: vendor.yearsInBusiness || '',
        numberOfEmployees: vendor.numberOfEmployees || ''
      });

      // Fetch services
      const servicesResponse = await serviceApi.getVendorServices();
      console.log('Vendor Services Response:', servicesResponse);
      const vendorServices = Array.isArray(servicesResponse.data) ? servicesResponse.data : (servicesResponse.data?.services || []);
      setServices(vendorServices);

      // Fetch orders (request all by passing limit=0 -> no limit)
      const ordersResponse = await orderApi.getVendorOrders({ limit: 0 });
      console.log('Vendor Orders Response:', ordersResponse);
      const vendorOrders = Array.isArray(ordersResponse.data) ? ordersResponse.data : (ordersResponse.data?.orders || []);
      setOrders(vendorOrders);

      // Fetch transactions
      const transactionsResponse = await paymentApi.getVendorTransactions();
      console.log('Vendor Transactions Response:', transactionsResponse);
      const vendorTransactions = Array.isArray(transactionsResponse.data) ? transactionsResponse.data : (transactionsResponse.data?.transactions || []);
      setTransactions(vendorTransactions);

      // Calculate stats - revenue from completed/paid orders
      console.log('Calculating Revenue - Transactions:', vendorTransactions);
      console.log('Calculating Revenue - Orders:', vendorOrders);
      
      // Calculate revenue from both transactions and completed orders
      const transactionRevenue = vendorTransactions.reduce(
        (sum, t) => {
          const amount = t.vendorAmount || t.amount || t.totalAmount || 0;
          console.log('Transaction:', t._id, 'Amount:', amount, 'Status:', t.status);
          return sum + (t.status === 'completed' || t.status === 'success' ? amount : 0);
        },
        0
      );
      
      // Also calculate from orders with paymentStatus = 'paid' or 'completed'
      const orderRevenue = vendorOrders.reduce(
        (sum, order) => {
          const amount = order.totalAmount || order.price || 0;
          console.log('Order:', order._id, 'Amount:', amount, 'Payment Status:', order.paymentStatus);
          return sum + (order.paymentStatus === 'paid' || order.paymentStatus === 'completed' || order.paymentStatus === 'success' ? amount : 0);
        },
        0
      );
      
      // Use whichever gives a value (prefer transaction revenue)
      const totalRevenue = transactionRevenue > 0 ? transactionRevenue : orderRevenue;

      // Fetch reviews to calculate accurate rating
      let avgRating = 0;
      try {
        const reviewsResponse = await reviewApi.getVendorReviews(vendor._id);
        const vendorReviews = Array.isArray(reviewsResponse.data) 
          ? reviewsResponse.data 
          : (reviewsResponse.data?.reviews || []);
        setReviews(vendorReviews);
        
        if (vendorReviews.length > 0) {
          const totalRating = vendorReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
          avgRating = totalRating / vendorReviews.length;
        }
      } catch (reviewErr) {
        console.error('Error fetching reviews:', reviewErr);
        // Fallback to service ratings if reviews API fails
        const totalRatings = vendorServices.reduce((sum, s) => sum + (s.rating || 0), 0);
        avgRating = vendorServices.length > 0 ? totalRatings / vendorServices.length : 0;
      }

      setStats({
        totalServices: vendorServices.length,
        totalOrders: vendorOrders.length,
        totalRevenue: totalRevenue.toFixed(2),
        averageRating: avgRating,
      });

      if (!silent) {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setProfileForm(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setProfileForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please upload an image file (JPG, PNG, etc.)', type: 'error' });
      return;
    }

    // Validate file size (250KB)
    if (file.size > 250 * 1024) {
      setToast({ message: `Logo size is ${(file.size / 1024).toFixed(0)}KB. Must be less than 250KB (Recommended: 512x512px)`, type: 'error' });
      return;
    }

    try {
      setUploadingLogo(true);
      const { uploadImage } = await import('../../api/uploadApi');
      const response = await uploadImage(file);
      
      if (response.success) {
        const logoUrl = response.data.base64 || response.data.url;
        await vendorApi.updateVendor(vendorProfile._id, { companyLogo: logoUrl });
        setToast({ message: 'Logo updated successfully!', type: 'success' });
        fetchDashboardData(true);
      }
    } catch (err) {
      console.error('Error uploading logo:', err);
      setToast({ message: 'Failed to upload logo', type: 'error' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please upload an image file (JPG, PNG, etc.)', type: 'error' });
      return;
    }

    // Validate file size (250KB)
    if (file.size > 250 * 1024) {
      setToast({ message: `Cover image size is ${(file.size / 1024).toFixed(0)}KB. Must be less than 250KB (Recommended: 1920x400px)`, type: 'error' });
      return;
    }

    try {
      setUploadingCover(true);
      const { uploadImage } = await import('../../api/uploadApi');
      const response = await uploadImage(file);
      
      if (response.success) {
        const coverUrl = response.data.base64 || response.data.url;
        await vendorApi.updateVendor(vendorProfile._id, { coverImage: coverUrl });
        setToast({ message: 'Cover image updated successfully!', type: 'success' });
        fetchDashboardData(true);
      }
    } catch (err) {
      console.error('Error uploading cover:', err);
      setToast({ message: 'Failed to upload cover image', type: 'error' });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await vendorApi.updateVendor(vendorProfile._id, profileForm);
      setToast({ message: 'Profile updated successfully!', type: 'success' });
      await fetchDashboardData(true);
    } catch (err) {
      console.error('Error updating profile:', err);
      setToast({ message: err.response?.data?.error?.message || 'Failed to update profile', type: 'error' });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Service handlers
  const handleToggleServiceActive = async (serviceId) => {
    try {
      await serviceApi.toggleServiceActive(serviceId);
      setToast({ message: 'Service status updated successfully', type: 'success' });
      fetchDashboardData(true);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to update service status', type: 'error' });
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    
    try {
      await serviceApi.deleteService(serviceId);
      setToast({ message: 'Service deleted successfully', type: 'success' });
      fetchDashboardData(true);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to delete service', type: 'error' });
    }
  };

  // Order handlers
  const handleAcceptOrder = async (orderId) => {
    if (vendorProfile?.isActive === false) {
      setToast({ message: 'Your account is deactivated. You cannot accept orders.', type: 'error' });
      return;
    }
    try {
      await orderApi.acceptOrder(orderId);
      setToast({ message: 'Order accepted successfully', type: 'success' });
      fetchDashboardData(true);
    } catch (err) {
      const errorCode = err.response?.data?.error?.code;
      if (errorCode === 'VENDOR_DEACTIVATED') {
        setToast({ message: err.response.data.error.message, type: 'error' });
        setShowDeactivationModal(true);
        fetchDashboardData(true); // Refresh to update vendor status
      } else {
        setToast({ message: err.response?.data?.message || 'Failed to accept order', type: 'error' });
      }
    }
  };

  const handleRejectOrder = async (orderId) => {
    if (vendorProfile?.isActive === false) {
      setToast({ message: 'Your account is deactivated. You cannot reject orders.', type: 'error' });
      return;
    }
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await orderApi.rejectOrder(orderId, reason);
      setToast({ message: 'Order rejected successfully', type: 'success' });
      fetchDashboardData(true);
    } catch (err) {
      const errorCode = err.response?.data?.error?.code;
      if (errorCode === 'VENDOR_DEACTIVATED') {
        setToast({ message: err.response.data.error.message, type: 'error' });
        setShowDeactivationModal(true);
        fetchDashboardData(true);
      } else {
        setToast({ message: err.response?.data?.message || 'Failed to reject order', type: 'error' });
      }
    }
  };

  const handleStartOrder = async (orderId) => {
    if (vendorProfile?.isActive === false) {
      setToast({ message: 'Your account is deactivated. You cannot start orders.', type: 'error' });
      return;
    }
    try {
      await orderApi.startOrder(orderId);
      setToast({ message: 'Order started successfully', type: 'success' });
      fetchDashboardData(true);
    } catch (err) {
      const errorCode = err.response?.data?.error?.code;
      if (errorCode === 'VENDOR_DEACTIVATED') {
        setToast({ message: err.response.data.error.message, type: 'error' });
        setShowDeactivationModal(true);
        fetchDashboardData(true);
      } else {
        setToast({ message: err.response?.data?.message || 'Failed to start order', type: 'error' });
      }
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      await orderApi.completeOrder(orderId);
      setToast({ message: 'Order completed successfully', type: 'success' });
      fetchDashboardData(true);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to complete order', type: 'error' });
    }
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg text-[#1B4B36]"></div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-[#1B4B36] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
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
        {/* Vendor Deactivation Banner */}
        <VendorDeactivationBanner 
          vendor={vendorProfile} 
          showContactModal={() => setShowDeactivationModal(true)}
          onLogout={handleLogout}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Services */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Services</p>
                <p className="text-3xl font-bold text-[#1B4B36] mt-2">{stats.totalServices}</p>
              </div>
              <div className="bg-[#1B4B36] p-4 rounded-full">
                <FaBox className="text-white text-2xl" />
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Orders</p>
                <p className="text-3xl font-bold text-[#1B4B36] mt-2">{stats.totalOrders}</p>
              </div>
              <div className="bg-blue-500 p-4 rounded-full">
                <FaShoppingBag className="text-white text-2xl" />
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-[#1B4B36] mt-2">৳{stats.totalRevenue}</p>
              </div>
              <div className="bg-green-500 p-4 rounded-full">
                <span className="text-white text-3xl font-bold">৳</span>
              </div>
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Average Rating</p>
                <p className="text-3xl font-bold text-[#1B4B36] mt-2">
                  {(stats.averageRating || 0).toFixed(1)} ⭐
                </p>
              </div>
              <div className="bg-yellow-500 p-4 rounded-full">
                <FaStar className="text-white text-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-b-2 border-[#1B4B36] text-[#1B4B36]'
                  : 'text-gray-600 hover:text-[#1B4B36]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-b-2 border-[#1B4B36] text-[#1B4B36]'
                  : 'text-gray-600 hover:text-[#1B4B36]'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'services'
                  ? 'border-b-2 border-[#1B4B36] text-[#1B4B36]'
                  : 'text-gray-600 hover:text-[#1B4B36]'
              }`}
            >
              Services
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-b-2 border-[#1B4B36] text-[#1B4B36]'
                  : 'text-gray-600 hover:text-[#1B4B36]'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'messages'
                  ? 'border-b-2 border-[#1B4B36] text-[#1B4B36]'
                  : 'text-gray-600 hover:text-[#1B4B36]'
              }`}
            >
              <FaComments className="inline mr-1" /> Messages
            </button>
            {/* <button
              onClick={() => setActiveTab('hours')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'hours'
                  ? 'border-b-2 border-[#1B4B36] text-[#1B4B36]'
                  : 'text-gray-600 hover:text-[#1B4B36]'
              }`}
            >
              <FaClock className="inline mr-1" /> Working Hours
            </button> */}
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'reviews'
                  ? 'border-b-2 border-[#1B4B36] text-[#1B4B36]'
                  : 'text-gray-600 hover:text-[#1B4B36]'
              }`}
            >
              <FaStar className="inline mr-1" /> Reviews
            </button>
            
            {/* <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'transactions'
                  ? 'border-b-2 border-[#1B4B36] text-[#1B4B36]'
                  : 'text-gray-600 hover:text-[#1B4B36]'
              }`}
            >
              Transactions
            </button> */}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-[#1B4B36] mb-4">Quick Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Recent Orders</h3>
                {Array.isArray(orders) && orders.slice(0, 5).map((order) => (
                  <div key={order._id} className="border-b py-2 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{order.service?.name || order.service?.title || 'N/A'}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(order.status)}`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                ))}
                {(!Array.isArray(orders) || orders.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No orders yet</p>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Active Services</h3>
                {Array.isArray(services) && services.filter(s => s.isActive).slice(0, 5).map((service) => (
                  <div key={service._id} className="border-b py-2">
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-gray-600">৳{service.price} • {service.totalBookings || 0} bookings</p>
                  </div>
                ))}
                {(!Array.isArray(services) || services.filter(s => s.isActive).length === 0) && (
                  <p className="text-gray-500 text-center py-4">No active services</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && vendorProfile && (
          <div className="space-y-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#1B4B36]">Vendor Profile</h1>
              <p className="text-gray-500 mt-1">Manage your company information and public profile details.</p>
              
              {/* Account Status Indicator */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Account Status:</span>
                {vendorProfile.isActive === false ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                    🔴 Deactivated
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    🟢 Active
                  </span>
                )}
              </div>
              
              {vendorProfile.isActive === false && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    Your account is deactivated. Contact support at{' '}
                    <a href="mailto:support@example.com" className="font-medium underline">
                      support@example.com
                    </a>
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Company Identity */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <FaImage className="text-[#1B4B36] text-xl" />
                  <h2 className="text-lg font-semibold">Company Identity</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cover Image */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Cover Image</label>
                    <div className="relative group border-2 border-dashed border-gray-300 rounded-xl bg-white p-4 transition-all hover:border-[#1B4B36]">
                      {uploadingCover && (
                        <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center z-10">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-4 border-[#1B4B36] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-600 font-medium">Uploading...</p>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col items-center justify-center text-center">
                        {vendorProfile.coverImage ? (
                          <img 
                            src={vendorProfile.coverImage} 
                            alt="Cover" 
                            className="w-full h-32 mb-3 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FaImage className="text-gray-400 text-4xl" />
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <label className={`bg-[#1B4B36] hover:bg-[#143426] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all ${uploadingCover ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <FaUpload className="text-sm" />
                            {uploadingCover ? 'Uploading...' : 'Upload Cover'}
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleCoverUpload}
                              disabled={uploadingCover}
                              className="hidden"
                            />
                          </label>
                          <p className="text-xs text-gray-400">Max 250KB • 1920x400px</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Company Logo */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Company Logo</label>
                    <div className="relative group border-2 border-dashed border-gray-300 rounded-xl bg-white p-4 transition-all hover:border-[#1B4B36]">
                      {uploadingLogo && (
                        <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center z-10">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-4 border-[#1B4B36] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-600 font-medium">Uploading...</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        {vendorProfile.companyLogo ? (
                          <img 
                            src={vendorProfile.companyLogo} 
                            alt="Logo" 
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm flex-shrink-0"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-100 rounded-full flex flex-shrink-0 items-center justify-center border-4 border-white shadow-sm">
                            <FaBuilding className="text-gray-400 text-3xl" />
                          </div>
                        )}
                        <div className="flex-grow">
                          <label className={`bg-[#1B4B36] hover:bg-[#143426] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all mb-2 inline-flex ${uploadingLogo ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <FaUpload className="text-sm" />
                            {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleLogoUpload}
                              disabled={uploadingLogo}
                              className="hidden"
                            />
                          </label>
                          <p className="text-xs text-gray-400">Max 250KB • 512x512px</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* General Information */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <FaInfoCircle className="text-[#1B4B36] text-xl" />
                  <h2 className="text-lg font-semibold">General Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Company Name</label>
                    <input
                      type="text"
                      name="companyName"
                      value={profileForm.companyName}
                      onChange={handleProfileInputChange}
                      className="w-full px-4 py-2.5 bg-white border-gray-300 rounded-lg shadow-sm focus:ring-[#1B4B36] focus:border-[#1B4B36] text-base"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1 md:row-span-2">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      value={profileForm.description}
                      onChange={handleProfileInputChange}
                      className="w-full px-4 py-2.5 bg-white border-gray-300 rounded-lg shadow-sm focus:ring-[#1B4B36] focus:border-[#1B4B36] text-base"
                      placeholder="Tell customers about your company..."
                      rows="5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Years in Business</label>
                      <input
                        type="number"
                        name="yearsInBusiness"
                        value={profileForm.yearsInBusiness}
                        onChange={handleProfileInputChange}
                        className="w-full px-4 py-2.5 bg-white border-gray-300 rounded-lg shadow-sm focus:ring-[#1B4B36] focus:border-[#1B4B36] text-base"
                        min="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">No. of Employees</label>
                      <input
                        type="number"
                        name="numberOfEmployees"
                        value={profileForm.numberOfEmployees}
                        onChange={handleProfileInputChange}
                        className="w-full px-4 py-2.5 bg-white border-gray-300 rounded-lg shadow-sm focus:ring-[#1B4B36] focus:border-[#1B4B36] text-base"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Location Details */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <FaMapMarkerAlt className="text-[#1B4B36] text-xl" />
                  <h2 className="text-lg font-semibold">Location Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-sm font-medium text-gray-700">Street Address</label>
                    <input
                      type="text"
                      name="address.street"
                      value={profileForm.address.street}
                      onChange={handleProfileInputChange}
                      className="w-full px-4 py-2.5 bg-white border-gray-300 rounded-lg shadow-sm focus:ring-[#1B4B36] focus:border-[#1B4B36] text-base"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      name="address.city"
                      value={profileForm.address.city}
                      onChange={handleProfileInputChange}
                      className="w-full px-4 py-2.5 bg-white border-gray-300 rounded-lg shadow-sm focus:ring-[#1B4B36] focus:border-[#1B4B36] text-base"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">State / Province</label>
                    <input
                      type="text"
                      name="address.state"
                      value={profileForm.address.state}
                      onChange={handleProfileInputChange}
                      className="w-full px-4 py-2.5 bg-white border-gray-300 rounded-lg shadow-sm focus:ring-[#1B4B36] focus:border-[#1B4B36] text-base"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Zip / Postal Code</label>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={profileForm.address.zipCode}
                      onChange={handleProfileInputChange}
                      className="w-full px-4 py-2.5 bg-white border-gray-300 rounded-lg shadow-sm focus:ring-[#1B4B36] focus:border-[#1B4B36] text-base"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Country</label>
                    <input
                      type="text"
                      name="address.country"
                      value={profileForm.address.country}
                      onChange={handleProfileInputChange}
                      className="w-full px-4 py-2.5 bg-white border-gray-300 rounded-lg shadow-sm focus:ring-[#1B4B36] focus:border-[#1B4B36] text-base"
                      placeholder="e.g., Bangladesh"
                    />
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Online Presence */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <FaGlobe className="text-[#1B4B36] text-xl" />
                  <h2 className="text-lg font-semibold">Online Presence</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Website</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <FaGlobe />
                      </span>
                      <input
                        type="url"
                        name="website"
                        value={profileForm.website}
                        onChange={handleProfileInputChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border-gray-300 rounded-lg shadow-sm focus:ring-[#1B4B36] focus:border-[#1B4B36] text-base"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Facebook</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <FaFacebook />
                      </span>
                      <input
                        type="url"
                        name="facebook"
                        value={profileForm.facebook}
                        onChange={handleProfileInputChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border-gray-300 rounded-lg shadow-sm focus:ring-[#1B4B36] focus:border-[#1B4B36] text-base"
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Instagram</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <FaInstagram />
                      </span>
                      <input
                        type="url"
                        name="instagram"
                        value={profileForm.instagram}
                        onChange={handleProfileInputChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border-gray-300 rounded-lg shadow-sm focus:ring-[#1B4B36] focus:border-[#1B4B36] text-base"
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Twitter (X)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <FaTwitter />
                      </span>
                      <input
                        type="url"
                        name="twitter"
                        value={profileForm.twitter}
                        onChange={handleProfileInputChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border-gray-300 rounded-lg shadow-sm focus:ring-[#1B4B36] focus:border-[#1B4B36] text-base"
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">LinkedIn</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <FaLinkedin />
                      </span>
                      <input
                        type="url"
                        name="linkedin"
                        value={profileForm.linkedin}
                        onChange={handleProfileInputChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border-gray-300 rounded-lg shadow-sm focus:ring-[#1B4B36] focus:border-[#1B4B36] text-base"
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => fetchDashboardData()}
                  className="w-full sm:w-auto px-6 py-2.5 text-gray-600 font-medium hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer rounded-lg"
                >
                  Reset Changes
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-[#1B4B36] hover:bg-[#143426] text-white px-8 py-2.5 rounded-lg font-semibold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <FaCheck className="text-sm" />
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#1B4B36]">My Services</h2>
              <button
                onClick={() => vendorProfile?.isActive !== false && navigate('/services/create')}
                disabled={vendorProfile?.isActive === false}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition duration-200 ${
                  vendorProfile?.isActive === false
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-[#1B4B36] hover:bg-[#143426] text-white'
                }`}
                title={vendorProfile?.isActive === false ? 'Account deactivated - Cannot add services' : 'Add new service'}
              >
                <FaPlus />
                <span>Add Service</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Price</th>
                    <th>Bookings</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(services) && services.map((service) => (
                    <tr key={service._id}>
                      <td>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-gray-600">{service.categoryId?.name}</p>
                        </div>
                      </td>
                      <td>৳{service.price}</td>
                      <td>{service.totalBookings || 0}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <FaStar className="text-yellow-500" />
                          <span>{service.rating || 0}</span>
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleServiceActive(service._id)}
                          className="flex items-center gap-1"
                        >
                          {service.isActive ? (
                            <>
                              <FaToggleOn className="text-green-600 text-xl" />
                              <span className="text-green-600">Active</span>
                            </>
                          ) : (
                            <>
                              <FaToggleOff className="text-gray-400 text-xl" />
                              <span className="text-gray-600">Inactive</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/services/edit/${service._id}`)}
                            className="btn btn-sm btn-ghost text-blue-600"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service._id)}
                            className="btn btn-sm btn-ghost text-red-600"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {services.length === 0 && (
                <p className="text-center text-gray-500 py-8">No services found. Create your first service!</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-[#1B4B36] mb-4">Orders</h2>

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Service</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(orders) && orders.map((order) => (
                    <tr key={order._id}>
                      <td className="font-mono text-sm">{order._id.slice(-8)}</td>
                      <td>{order.service?.name || order.service?.title || 'N/A'}</td>
                      <td>
                        {order.customerName || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'N/A'}
                      </td>
                      <td>৳{order.totalAmount}</td>
                      <td>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(order.status)}`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => handleViewOrderDetails(order)}
                            className="btn btn-sm btn-ghost text-blue-600"
                          >
                            <FaEye />
                          </button>
                          {order.paymentStatus === 'paid' && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium" title="Payment Received">
                              <FaCheckCircle className="text-xs" />
                              Paid
                            </span>
                          )}
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => vendorProfile?.isActive !== false && handleAcceptOrder(order._id)}
                                disabled={vendorProfile?.isActive === false}
                                className="btn btn-sm btn-ghost text-green-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                                title={vendorProfile?.isActive === false ? 'Account deactivated' : 'Accept order'}
                              >
                                <FaCheck />
                              </button>
                              <button
                                onClick={() => vendorProfile?.isActive !== false && handleRejectOrder(order._id)}
                                disabled={vendorProfile?.isActive === false}
                                className="btn btn-sm btn-ghost text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                                title={vendorProfile?.isActive === false ? 'Account deactivated' : 'Reject order'}
                              >
                                <FaTimes />
                              </button>
                            </>
                          )}
                          {order.status === 'accepted' && (
                            <button
                              onClick={() => vendorProfile?.isActive !== false && handleStartOrder(order._id)}
                              disabled={vendorProfile?.isActive === false}
                              className="btn btn-sm bg-[#FCDE70] hover:bg-[#e6c960] disabled:bg-gray-300 disabled:cursor-not-allowed"
                              title={vendorProfile?.isActive === false ? 'Account deactivated' : 'Start order'}
                            >
                              Start
                            </button>
                          )}
                          {order.status === 'in_progress' && (
                            <button
                              onClick={() => vendorProfile?.isActive !== false && handleCompleteOrder(order._id)}
                              disabled={vendorProfile?.isActive === false}
                              className="btn btn-sm bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                              title={vendorProfile?.isActive === false ? 'Account deactivated' : 'Complete order'}
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && (
                <p className="text-center text-gray-500 py-8">No orders found</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-[#1B4B36] mb-4">Messages</h2>
            <MessagingCenter />
          </div>
        )}

        {activeTab === 'hours' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-[#1B4B36] mb-4">Working Hours & Holidays</h2>
            <WorkingHoursManager />
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1B4B36]">Customer Reviews</h2>
              <div className="text-right">
                <p className="text-3xl font-bold text-[#1B4B36]">
                  {(stats.averageRating || 0).toFixed(1)} ⭐
                </p>
                <p className="text-sm text-gray-600">
                  Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {loadingReviews ? (
              <div className="text-center py-8">
                <div className="loading loading-spinner loading-lg text-[#1B4B36]"></div>
                <p className="text-gray-600 mt-2">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8">
                <FaStar className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group reviews by service */}
                {services.map((service) => {
                  const serviceReviews = reviews.filter(
                    (review) => review.service?._id === service._id || review.service === service._id
                  );
                  
                  if (serviceReviews.length === 0) return null;

                  return (
                    <div key={service._id} className="border-t pt-4">
                      <h3 className="text-lg font-semibold text-[#1B4B36] mb-3">
                        {service.name || service.title}
                        <span className="ml-2 text-sm text-gray-600">
                          ({serviceReviews.length} review{serviceReviews.length !== 1 ? 's' : ''})
                        </span>
                      </h3>
                      <div className="space-y-3">
                        {serviceReviews.map((review) => (
                          <ReviewCard
                            key={review._id}
                            review={review}
                            showResponse={true}
                            onRespond={!review.vendorResponse ? (rev) => {
                              setSelectedReview(rev);
                              setResponseText('');
                              setShowRespondModal(true);
                            } : null}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                {/* Show reviews without associated services */}
                {reviews.filter(r => !r.service || !services.find(s => s._id === r.service?._id || s._id === r.service)).length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-600 mb-3">Other Reviews</h3>
                    <div className="space-y-3">
                      {reviews
                        .filter(r => !r.service || !services.find(s => s._id === r.service?._id || s._id === r.service))
                        .map((review) => (
                          <ReviewCard
                            key={review._id}
                            review={review}
                            showResponse={true}
                            onRespond={!review.vendorResponse ? (rev) => {
                              setSelectedReview(rev);
                              setResponseText('');
                              setShowRespondModal(true);
                            } : null}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-[#1B4B36] mb-4">Transactions</h2>

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Order</th>
                    <th>Total Amount</th>
                    <th>Platform Fee</th>
                    <th>Your Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(transactions) && transactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td className="font-mono text-sm">{transaction._id.slice(-8)}</td>
                      <td className="font-mono text-sm">{transaction.orderId?.slice(-8) || 'N/A'}</td>
                      <td>৳{transaction.amount}</td>
                      <td className="text-red-600">-৳{transaction.platformFee}</td>
                      <td className="text-green-600 font-semibold">৳{transaction.vendorAmount}</td>
                      <td>
                        <span className={`px-2 py-1 rounded text-xs ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status.toUpperCase()}
                        </span>
                      </td>
                      <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length === 0 && (
                <p className="text-center text-gray-500 py-8">No transactions found</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <button
              className="btn btn-sm btn-circle absolute right-2 top-2"
              onClick={() => {
                setShowOrderModal(false);
                setSelectedOrder(null);
              }}
            >
              <MdClose />
            </button>

            <h3 className="font-bold text-xl mb-4 text-[#1B4B36]">Order Details</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-semibold font-mono">{selectedOrder.orderNumber || selectedOrder._id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(selectedOrder.status)}`}>
                    {selectedOrder.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Service</p>
                <p className="font-semibold">{selectedOrder.service?.name || selectedOrder.service?.title || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-semibold">
                    {selectedOrder.customerName || `${selectedOrder.user?.firstName || ''} ${selectedOrder.user?.lastName || ''}`.trim() || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">{selectedOrder.customerEmail || selectedOrder.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold">{selectedOrder.customerPhone || selectedOrder.user?.phone || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Service Location</p>
                <p className="font-semibold">
                  {selectedOrder.address?.street ? 
                    `${selectedOrder.address.street}, ${selectedOrder.address.city}, ${selectedOrder.address.state}` : 
                    selectedOrder.serviceLocation?.address || 'N/A'
                  }
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Service Date</p>
                  <p className="font-semibold">
                    {selectedOrder.scheduledDate ? 
                      new Date(selectedOrder.scheduledDate).toLocaleDateString() : 
                      selectedOrder.serviceDate ? new Date(selectedOrder.serviceDate).toLocaleDateString() : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Service Time</p>
                  <p className="font-semibold">{selectedOrder.scheduledTime || selectedOrder.serviceTime || 'N/A'}</p>
                </div>
              </div>

              {selectedOrder.duration && (
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold">{selectedOrder.duration} minutes</p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Pricing Breakdown</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Price:</span>
                    <span>৳{selectedOrder.servicePrice || selectedOrder.totalAmount}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({selectedOrder.discount}%):</span>
                      <span>-৳{selectedOrder.discountAmount || 0}</span>
                    </div>
                  )}
                  {selectedOrder.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span>৳{selectedOrder.tax}</span>
                    </div>
                  )}
                  {selectedOrder.platformFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Fee:</span>
                      <span>৳{selectedOrder.platformFee}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>৳{selectedOrder.totalAmount}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <span className={`px-2 py-1 rounded text-xs ${
                    selectedOrder.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedOrder.paymentStatus?.toUpperCase()}
                  </span>
                </div>
              </div>

              {selectedOrder.specialInstructions && (
                <div>
                  <p className="text-sm text-gray-600">Special Instructions</p>
                  <p className="font-semibold">{selectedOrder.specialInstructions}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Order Created</p>
                <p className="font-semibold">
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setShowOrderModal(false);
                  setSelectedOrder(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Respond to Review Modal */}
      {showRespondModal && selectedReview && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg text-[#1B4B36] mb-4">Respond to Review</h3>
            
            {/* Show the review */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-[#1B4B36] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {selectedReview.user?.firstName?.[0]}{selectedReview.user?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {selectedReview.user?.firstName} {selectedReview.user?.lastName}
                  </p>
                  <p className="text-xs text-gray-600">{selectedReview.rating} ⭐</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm">{selectedReview.comment}</p>
            </div>

            {/* Response textarea */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Your Response</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-32"
                placeholder="Write your response to this review..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
              />
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowRespondModal(false);
                  setSelectedReview(null);
                  setResponseText('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn bg-[#1B4B36] text-white hover:bg-[#2d7a54]"
                onClick={async () => {
                  if (!responseText.trim()) {
                    setToast({ message: 'Please enter a response', type: 'error' });
                    return;
                  }
                  try {
                    await reviewApi.respondToReview(selectedReview._id, responseText);
                    setToast({ message: 'Response submitted successfully', type: 'success' });
                    setShowRespondModal(false);
                    setSelectedReview(null);
                    setResponseText('');
                    // Refresh reviews
                    fetchDashboardData(true);
                  } catch (err) {
                    setToast({ 
                      message: err.response?.data?.message || 'Failed to submit response', 
                      type: 'error' 
                    });
                  }
                }}
                disabled={!responseText.trim()}
              >
                Submit Response
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Deactivation Modal */}
      <VendorDeactivationModal
        isOpen={showDeactivationModal}
        onClose={() => setShowDeactivationModal(false)}
        vendor={vendorProfile}
      />
    </div>
  );
};

export default VendorDashboard;
