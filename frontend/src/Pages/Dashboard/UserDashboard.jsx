import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaSignOutAlt, 
  FaShoppingBag, 
  FaStar, 
  FaUser, 
  FaBell,
  FaReceipt,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaEnvelope,
  FaPhone,
  FaHome,
  FaComments
} from 'react-icons/fa';
import useAuthStore from '../../store/authStore';
import { authApi } from '../../api/authApi';
import { orderApi } from '../../api/orderApi';
import { paymentApi } from '../../api/paymentApi';
import { favoritesApi } from '../../api/favoritesApi';
import { userApi } from '../../api/userApi';
import Toast from '../../Components/Shared/Toast';
import RatingStars from '../../Components/Shared/RatingStars';
import MessagingCenter from '../../Components/Shared/MessagingCenter';
import AddressManager from '../../Components/Shared/AddressManager';
import UserNotifications from '../../Components/Shared/UserNotifications';
import OrderDetailModal from '../../Components/Shared/OrderDetailModal';
import PaymentModal from '../../Components/Shared/PaymentModal';
import ProfilePictureUpload from '../../Components/Shared/ProfilePictureUpload';

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Dashboard data
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalSpent: 0
  });
  
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderToPay, setOrderToPay] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  
  // Favorites state
  const [favoriteServices, setFavoriteServices] = useState([]);
  const [favoriteVendors, setFavoriteVendors] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  // Profile edit
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });

  // Change password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [capsLockOn, setCapsLockOn] = useState(false);

  // Password validation checkers
  const getPasswordStrength = (password) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  };

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);
  const strengthCount = Object.values(passwordStrength).filter(Boolean).length;
  const passwordsMatch = passwordForm.newPassword && passwordForm.confirmPassword && 
                        passwordForm.newPassword === passwordForm.confirmPassword;

  // Get password strength level text and color
  const getStrengthLevel = (count) => {
    if (count === 0) return { text: '', color: '', width: '0%' };
    if (count === 1) return { text: 'Very Weak', color: 'bg-red-500', width: '20%' };
    if (count === 2) return { text: 'Weak', color: 'bg-orange-500', width: '40%' };
    if (count === 3) return { text: 'Good', color: 'bg-yellow-500', width: '60%' };
    if (count === 4) return { text: 'Good', color: 'bg-lime-500', width: '80%' };
    return { text: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const strengthLevel = getStrengthLevel(strengthCount);

  // Handle capslock detection
  const handleKeyDown = (e) => {
    if (e.getModifierState('CapsLock')) {
      setCapsLockOn(true);
    }
  };

  const handleKeyUp = (e) => {
    if (!e.getModifierState('CapsLock')) {
      setCapsLockOn(false);
    }
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('One number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('One special character');
    return errors;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordErrors({});

    // Validate all fields are filled
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setToast({ message: 'All fields are required', type: 'error' });
      return;
    }

    // Validate new password requirements
    const passwordValidationErrors = validatePassword(passwordForm.newPassword);
    if (passwordValidationErrors.length > 0) {
      setPasswordErrors({ newPassword: passwordValidationErrors });
      setToast({ message: 'Password does not meet requirements', type: 'error' });
      return;
    }

    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrors({ confirmPassword: 'Passwords do not match' });
      setToast({ message: 'Passwords do not match', type: 'error' });
      return;
    }

    try {
      setChangingPassword(true);
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });
      
      setToast({ message: 'Password changed successfully! Logging you out...', type: 'success' });
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Logout after 2 seconds
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to change password';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Sync tab from query param (?tab=notifications etc.)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    // Only fetch favorites if user role is 'user' or 'vendor'
    if (activeTab === 'favorites' && favoriteServices.length === 0 && 
        (user?.role === 'user' || user?.role === 'vendor')) {
      fetchFavorites();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const ordersResponse = await orderApi.getUserOrders();
      console.log('Orders Response:', ordersResponse);
      const userOrders = ordersResponse.data || [];
      setOrders(userOrders);
      
      // Fetch transactions
      try {
        const transactionsResponse = await paymentApi.getUserTransactions();
        console.log('Transactions Response:', transactionsResponse);
        setTransactions(transactionsResponse.data || []);
      } catch (err) {
        console.log('Transactions not available:', err);
      }
      
      // Calculate stats
      const activeOrders = userOrders.filter(o => ['pending', 'accepted', 'in_progress'].includes(o.status)).length;
      const completedOrders = userOrders.filter(o => o.status === 'completed').length;
      const totalSpent = userOrders
        .filter(o => o.status === 'completed' && o.paymentStatus === 'paid')
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      setStats({
        totalOrders: userOrders.length,
        activeOrders,
        completedOrders,
        totalSpent
      });
      
      // Set profile form
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || ''
      });
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setToast({ message: 'Failed to load dashboard data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const fetchFavorites = async () => {
    // Only users with 'user' or 'vendor' role can access favorites
    if (!user || (user.role !== 'user' && user.role !== 'vendor')) {
      console.log('Skipping favorites fetch - user role not authorized:', user?.role);
      setFavoriteServices([]);
      setFavoriteVendors([]);
      return;
    }

    try {
      setLoadingFavorites(true);
      const [servicesRes, vendorsRes] = await Promise.all([
        favoritesApi.getFavoriteServices({ page: 1, limit: 50 }),
        favoritesApi.getFavoriteVendors({ page: 1, limit: 50 })
      ]);
      console.log('Favorite services response:', servicesRes);
      console.log('Favorite vendors response:', vendorsRes);
      setFavoriteServices(servicesRes?.data?.favorites || []);
      setFavoriteVendors(vendorsRes?.data?.favorites || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      // Don't show error toast if it's a permission issue
      if (error.response?.status !== 403) {
        setToast({ message: 'Failed to load favorites', type: 'error' });
      }
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleRemoveFavorite = async (itemId, type) => {
    // Check if user has permission
    if (!user || (user.role !== 'user' && user.role !== 'vendor')) {
      setToast({ message: 'You do not have permission to manage favorites', type: 'error' });
      return;
    }

    try {
      if (type === 'service') {
        await favoritesApi.removeServiceFromFavorites(itemId);
        setFavoriteServices(prev => prev.filter(fav => fav._id !== itemId));
      } else {
        await favoritesApi.removeVendorFromFavorites(itemId);
        setFavoriteVendors(prev => prev.filter(fav => fav._id !== itemId));
      }
      setToast({ message: 'Removed from favorites', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to remove from favorites', type: 'error' });
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    
    try {
      const response = await orderApi.cancelOrder(orderToCancel, cancellationReason);
      setToast({ 
        message: response.message || 'Order cancelled successfully', 
        type: 'success' 
      });
      await fetchDashboardData();
      setShowOrderModal(false);
      setShowCancelModal(false);
      setOrderToCancel(null);
      setCancellationReason('');
    } catch (err) {
      setToast({ 
        message: err.response?.data?.error?.message || err.response?.data?.message || 'Failed to cancel order', 
        type: 'error' 
      });
      setShowCancelModal(false);
      setOrderToCancel(null);
      setCancellationReason('');
    }
  };

  const handleInitiatePayment = (order) => {
    setOrderToPay(order);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setOrderToPay(null);
    setShowOrderModal(false);
    setToast({ message: 'Payment completed successfully!', type: 'success' });
    fetchDashboardData();
  };

  const shouldShowPayButton = (order) => {
    return order.paymentStatus === 'pending' && 
           (order.status === 'accepted' || order.status === 'completed');
  };

  const handleProfilePictureUpload = async (file) => {
    try {
      const response = await userApi.uploadMyProfilePicture(file);
      
      // Extract URL from response.data (since apiClient returns response.data)
      const relativeUrl = response.data?.url;
      
      if (relativeUrl) {
        // Convert relative URL to absolute URL
        // The relative URL already includes /api/v1, so we only need the base server URL
        const serverBaseURL = import.meta.env.VITE_SERVER_URL || 'https://full-stack-mern-project-multi-vendor.onrender.com';
        const profilePictureUrl = serverBaseURL + relativeUrl;
        
        // Update the user profile with the new picture (backend uses profileImage field)
        const updateResponse = await userApi.updateMyProfile({ profileImage: profilePictureUrl });
        
        setToast({ message: 'Profile picture updated successfully!', type: 'success' });
        
        // Update the user in the store with the response data
        const updatedUser = updateResponse.data?.user;
        if (updatedUser) {
          useAuthStore.setState({ user: updatedUser });
        }
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Failed to upload profile picture');
    }
  };

  const handleProfilePictureRemove = async () => {
    try {
      await userApi.removeMyProfilePicture();
      setToast({ message: 'Profile picture removed successfully!', type: 'success' });
      // Refresh user data
      const { fetchUser } = useAuthStore.getState();
      await fetchUser();
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Failed to remove profile picture');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FaCheckCircle />;
      case 'in_progress': return <FaClock />;
      case 'cancelled': return <FaTimes />;
      default: return <FaClock />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-[#1B4B36]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notifications - Higher z-index than modals */}
      {toast && (
        <div className="fixed top-4 right-4 z-[60]">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Header */}
      <div className="bg-[#1B4B36] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h1>
              <p className="text-green-100 mt-1">Manage your orders and profile</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
              >
                <FaHome /> Home
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Orders */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#1B4B36]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Orders</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-[#1B4B36] rounded-lg flex items-center justify-center">
                <FaShoppingBag className="text-white text-xl" />
              </div>
            </div>
          </div>

          {/* Active Orders */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Orders</p>
                <p className="text-3xl font-bold text-gray-800">{stats.activeOrders}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <FaClock className="text-white text-xl" />
              </div>
            </div>
          </div>

          {/* Completed Orders */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Completed</p>
                <p className="text-3xl font-bold text-gray-800">{stats.completedOrders}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-white text-xl" />
              </div>
            </div>
          </div>

          {/* Total Spent */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#FCDE70]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Spent</p>
                <p className="text-3xl font-bold text-gray-800">৳{stats.totalSpent}</p>
              </div>
              <div className="w-12 h-12 bg-[#FCDE70] rounded-lg flex items-center justify-center">
                <FaReceipt className="text-[#1B4B36] text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-8">
          <div className="border-b border-gray-200 px-6">
            <nav className="flex space-x-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-[#1B4B36] text-[#1B4B36]'
                    : 'border-transparent text-gray-600 hover:text-[#1B4B36]'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'border-[#1B4B36] text-[#1B4B36]'
                    : 'border-transparent text-gray-600 hover:text-[#1B4B36]'
                }`}
              >
                My Orders
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'transactions'
                    ? 'border-[#1B4B36] text-[#1B4B36]'
                    : 'border-transparent text-gray-600 hover:text-[#1B4B36]'
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`px-4 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'messages'
                    ? 'border-[#1B4B36] text-[#1B4B36]'
                    : 'border-transparent text-gray-600 hover:text-[#1B4B36]'
                }`}
              >
                <FaComments className="inline mr-1" /> Messages
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-4 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'notifications'
                    ? 'border-[#1B4B36] text-[#1B4B36]'
                    : 'border-transparent text-gray-600 hover:text-[#1B4B36]'
                }`}
              >
                <FaBell className="inline mr-1" /> Notifications
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-4 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'favorites'
                    ? 'border-[#1B4B36] text-[#1B4B36]'
                    : 'border-transparent text-gray-600 hover:text-[#1B4B36]'
                }`}
              >
                My Favorites
              </button>
              <button
                onClick={() => setActiveTab('addresses')}
                className={`px-4 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'addresses'
                    ? 'border-[#1B4B36] text-[#1B4B36]'
                    : 'border-transparent text-gray-600 hover:text-[#1B4B36]'
                }`}
              >
                <FaHome className="inline mr-1" /> Addresses
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'border-[#1B4B36] text-[#1B4B36]'
                    : 'border-transparent text-gray-600 hover:text-[#1B4B36]'
                }`}
              >
                Profile
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <FaShoppingBag className="mx-auto text-6xl text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">No orders yet</p>
                    <button
                      onClick={() => navigate('/services')}
                      className="mt-4 btn bg-[#1B4B36] text-white hover:bg-[#143426]"
                    >
                      Browse Services
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5).map(order => (
                      <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{order.service?.name || order.serviceId?.name || 'Service'}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Vendor: {order.vendor?.companyName || order.vendorId?.companyName || 'Unknown'}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <FaCalendarAlt />
                                {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                              <span className="font-semibold text-[#1B4B36]">৳{order.totalAmount}</span>
                            </div>
                            {/* Payment Status Badge */}
                            {order.paymentStatus === 'pending' && (
                              <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                Payment Pending
                              </span>
                            )}
                            {order.paymentStatus === 'paid' && (
                              <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Paid
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              {order.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <button
                              onClick={() => handleViewOrder(order)}
                              className="text-[#1B4B36] hover:underline text-sm flex items-center gap-1"
                            >
                              <FaEye /> View Details
                            </button>
                            {/* Pay Now Button */}
                            {shouldShowPayButton(order) && (
                              <button
                                onClick={() => handleInitiatePayment(order)}
                                className="btn btn-sm bg-[#1B4B36] text-white hover:bg-[#143426] flex items-center gap-1"
                              >
                                <FaReceipt /> Pay Now
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">All Orders</h2>
                  <button
                    onClick={() => navigate('/services')}
                    className="btn bg-[#1B4B36] text-white hover:bg-[#143426]"
                  >
                    Browse Services
                  </button>
                </div>
                
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <FaShoppingBag className="mx-auto text-6xl text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">No orders yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {orders.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(order => (
                          <tr key={order._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{order.service?.name || order.serviceId?.name || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm">{order.vendor?.companyName || order.vendorId?.companyName || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-[#1B4B36]">৳{order.totalAmount}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.paymentStatus?.toUpperCase() || 'PENDING'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleViewOrder(order)}
                                  className="text-[#1B4B36] hover:underline text-sm"
                                >
                                  View
                                </button>
                                {shouldShowPayButton(order) && (
                                  <button
                                    onClick={() => handleInitiatePayment(order)}
                                    className="text-white bg-[#1B4B36] hover:bg-[#143426] px-3 py-1 rounded text-sm"
                                  >
                                    Pay Now
                                  </button>
                                )}
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

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
                
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <FaReceipt className="mx-auto text-6xl text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(transaction => (
                      <div key={transaction._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900">Transaction ID: {transaction._id}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(transaction.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-[#1B4B36]">৳{transaction.amount}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {transaction.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="btn btn-outline border-[#1B4B36] text-[#1B4B36] hover:bg-[#1B4B36] hover:text-white"
                  >
                    <FaLock /> Change Password
                  </button>
                </div>

                {/* Profile Picture Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Picture</h3>
                  <ProfilePictureUpload
                    currentImage={user?.profileImage}
                    userName={`${user?.firstName} ${user?.lastName}`}
                    onUpload={handleProfilePictureUpload}
                    onRemove={handleProfilePictureRemove}
                    size="large"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 flex items-center gap-2">
                      <FaEnvelope className="text-gray-400" />
                      <p className="text-gray-900">{user?.email}</p>
                      {user?.isEmailVerified && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Verified</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="text-gray-900 mt-1">{user?.firstName} {user?.lastName}</p>
                  </div>

                  {user?.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Phone</label>
                      <div className="mt-1 flex items-center gap-2">
                        <FaPhone className="text-gray-400" />
                        <p className="text-gray-900">{user.phone}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-700">Member Since</label>
                    <p className="text-gray-900 mt-1">
                      {new Date(user?.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
                <MessagingCenter />
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">My Addresses</h2>
                <AddressManager />
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">My Favorites</h2>
                
                {/* Check if user has permission to view favorites */}
                {!user || (user.role !== 'user' && user.role !== 'vendor') ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-6xl mb-4">🔒</div>
                    <p className="text-gray-700 text-lg font-semibold mb-2">
                      Favorites Not Available
                    </p>
                    <p className="text-gray-500">
                      Only customer and vendor accounts can manage favorites.
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Your current role: <span className="font-semibold text-gray-700">{user?.role || 'Unknown'}</span>
                    </p>
                  </div>
                ) : loadingFavorites ? (
                  <div className="flex justify-center py-12">
                    <div className="loading loading-spinner loading-lg text-[#1B4B36]"></div>
                  </div>
                ) : (
                  <>
                    {/* Favorite Services */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Services ({favoriteServices.length})</h3>
                      {favoriteServices.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">No favorite services yet</p>
                          <button
                            onClick={() => navigate('/services')}
                            className="mt-3 text-[#1B4B36] hover:underline"
                          >
                            Browse Services
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {favoriteServices.map((fav) => (
                            <div key={fav._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col h-full">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{fav.name}</h4>
                                  {fav.vendorId?.companyName && (
                                    <p className="text-sm text-gray-600 mt-1">{fav.vendorId.companyName}</p>
                                  )}
                                  {fav.categoryId?.name && (
                                    <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                      {fav.categoryId.name}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleRemoveFavorite(fav._id, 'service')}
                                  className="text-red-500 hover:text-red-700"
                                  title="Remove from favorites"
                                >
                                  Remove
                                </button>
                              </div>
                              {fav.rating > 0 && (
                                <div className="mb-2">
                                  <RatingStars rating={fav.rating} size="sm" />
                                  {fav.reviewCount > 0 && (
                                    <span className="text-xs text-gray-500 ml-2">({fav.reviewCount} reviews)</span>
                                  )}
                                </div>
                              )}
                              <p className="text-xl font-bold text-[#1B4B36] mb-3">
                                ৳{fav.price}
                                {fav.duration && (
                                  <span className="text-sm text-gray-600 font-normal ml-2">• {fav.duration} min</span>
                                )}
                              </p>
                              <button
                                onClick={() => navigate(`/services/${fav._id}`)}
                                className="w-full btn btn-sm bg-[#1B4B36] text-white hover:bg-[#2d7a54] mt-auto"
                              >
                                View Service
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Favorite Vendors */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Vendors ({favoriteVendors.length})</h3>
                      {favoriteVendors.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">No favorite vendors yet</p>
                          <button
                            onClick={() => navigate('/vendor')}
                            className="mt-3 text-[#1B4B36] hover:underline"
                          >
                            Browse Vendors
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {favoriteVendors.map((fav) => (
                            <div key={fav._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{fav.companyName}</h4>
                                  {fav.businessCategory && (
                                    <p className="text-sm text-gray-600 mt-1">{fav.businessCategory}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleRemoveFavorite(fav._id, 'vendor')}
                                  className="text-red-500 hover:text-red-700"
                                  title="Remove from favorites"
                                >
                                  Remove
                                </button>
                              </div>
                              {fav.rating > 0 && (
                                <div className="mb-2">
                                  <RatingStars rating={fav.rating} size="sm" />
                                </div>
                              )}
                              <button
                                onClick={() => navigate(`/vendors/${fav._id}`)}
                                className="w-full btn btn-sm bg-[#1B4B36] text-white hover:bg-[#2d7a54]"
                              >
                                View Vendor
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setShowOrderModal(false)}
          onUpdate={(action, orderId) => {
            if (action === 'cancel') {
              setOrderToCancel(orderId);
              setShowCancelModal(true);
            } else if (action === 'payment') {
              fetchDashboardData();
              setToast({ message: 'Order updated successfully', type: 'success' });
            } else {
              fetchDashboardData();
            }
          }}
          userRole="user"
        />
      )}

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Order</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
              
              {/* Cancellation Reason */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation (Optional)
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g., Changed my mind, Found a better service, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent resize-none"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setOrderToCancel(null);
                    setCancellationReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  No, Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Yes, Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && orderToPay && (
        <PaymentModal
          order={orderToPay}
          onClose={() => {
            setShowPaymentModal(false);
            setOrderToPay(null);
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Change Password</h3>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
                    placeholder="Enter current password"
                    required
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={changingPassword}
                  >
                    {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {/* Capslock Warning */}
                {capsLockOn && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Caps Lock is on</span>
                  </div>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => {
                      setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }));
                      setPasswordErrors({});
                    }}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent ${
                      passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter new password"
                    required
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={changingPassword}
                  >
                    {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                
                {/* Capslock Warning */}
                {capsLockOn && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Caps Lock is on</span>
                  </div>
                )}
                
                {/* Single Horizontal Password Strength Indicator */}
                {passwordForm.newPassword && (
                  <div className="mt-3">
                    {/* Progress Bar */}
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${strengthLevel.color} transition-all duration-300 ease-out`}
                        style={{ width: strengthLevel.width }}
                      ></div>
                    </div>
                    
                    {/* Strength Label and Requirements */}
                    <div className="mt-2 flex items-start justify-between gap-4">
                      {/* Strength Text */}
                      {strengthLevel.text && (
                        <div className="text-sm font-medium text-gray-700">
                          {strengthLevel.text}
                        </div>
                      )}
                      
                      {/* Requirements Checklist */}
                      <div className="flex-1 text-xs text-gray-600 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className={passwordStrength.length ? 'text-green-600' : 'text-gray-400'}>
                            {passwordStrength.length ? '✓' : '○'}
                          </span>
                          <span>8+ characters</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={passwordStrength.uppercase ? 'text-green-600' : 'text-gray-400'}>
                            {passwordStrength.uppercase ? '✓' : '○'}
                          </span>
                          <span>Uppercase</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={passwordStrength.lowercase ? 'text-green-600' : 'text-gray-400'}>
                            {passwordStrength.lowercase ? '✓' : '○'}
                          </span>
                          <span>Lowercase</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={passwordStrength.number ? 'text-green-600' : 'text-gray-400'}>
                            {passwordStrength.number ? '✓' : '○'}
                          </span>
                          <span>Number</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={passwordStrength.special ? 'text-green-600' : 'text-gray-400'}>
                            {passwordStrength.special ? '✓' : '○'}
                          </span>
                          <span>Special character</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {passwordErrors.newPassword && (
                  <div className="mt-2 text-xs text-red-600">
                    <p className="font-semibold mb-1">Password must have:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {passwordErrors.newPassword.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => {
                      setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }));
                      setPasswordErrors({});
                    }}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent ${
                      passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm new password"
                    required
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={changingPassword}
                  >
                    {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                
                {/* Capslock Warning */}
                {capsLockOn && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Caps Lock is on</span>
                  </div>
                )}
                
                {/* 1-Line Password Match Indicator */}
                {passwordForm.confirmPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-1 flex-1 rounded-full transition-colors ${
                        passwordsMatch ? 'bg-green-500' : 'bg-red-400'
                      }`}></div>
                      <span className={`text-xs ${
                        passwordsMatch ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {passwordsMatch ? '✓ Passwords matched' : '✗ Passwords do not matched'}
                      </span>
                    </div>
                  </div>
                )}
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordErrors({});
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  disabled={changingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1B4B36] text-white rounded-lg hover:bg-[#2d7a54] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={changingPassword}
                >
                  {changingPassword && <span className="loading loading-spinner loading-sm"></span>}
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
