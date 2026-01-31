import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaCalendarAlt, FaMapMarkerAlt, FaClock, FaTag, FaBook } from 'react-icons/fa';
import { orderApi } from '../../api/orderApi';
import { couponApi } from '../../api/couponApi';
import { addressApi } from '../../api/addressApi';
import PaymentModal from './PaymentModal';
import CouponInput from './CouponInput';
import AddressManager from './AddressManager';
import OrderSuccessModal from './OrderSuccessModal';
import Toast from './Toast';

const BookingModal = ({ service, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Booking Details, 2: Payment
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  
  // Toast state
  const [toast, setToast] = useState(null);
  
  // Booking form data
  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    address: '',
    notes: '',
    couponCode: ''
  });

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Created order (for payment step)
  const [createdOrder, setCreatedOrder] = useState(null);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetchSavedAddresses();
  }, []);

  const fetchSavedAddresses = async () => {
    try {
      const response = await addressApi.getMyAddresses();
      setSavedAddresses(response.data.data.addresses || []);
      
      // Auto-fill with default address
      const defaultAddress = response.data.data.addresses?.find(addr => addr.isDefault);
      if (defaultAddress) {
        handleSelectAddress(defaultAddress);
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  };

  const handleSelectAddress = (address) => {
    const formattedAddress = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean).join(', ');
    
    setFormData(prev => ({ ...prev, address: formattedAddress }));
    setShowAddressBook(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleCouponApply = async (code) => {
    try {
      const response = await couponApi.validateCoupon(code);
      const coupon = response.data.coupon;
      
      // Check if coupon is applicable to this service
      if (coupon.applicableServices?.length > 0 && 
          !coupon.applicableServices.includes(service._id)) {
        throw new Error('Coupon not valid for this service');
      }

      setAppliedCoupon(coupon);
      
      // Calculate discount
      let discount = 0;
      if (coupon.discountType === 'percentage') {
        discount = (service.price * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount) {
          discount = Math.min(discount, coupon.maxDiscountAmount);
        }
      } else {
        discount = coupon.discountValue;
      }
      
      setCouponDiscount(discount);
      setFormData(prev => ({ ...prev, couponCode: code }));
    } catch (err) {
      throw err;
    }
  };

  const handleCouponRemove = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setFormData(prev => ({ ...prev, couponCode: '' }));
  };

  const calculateTotalPrice = () => {
    let basePrice = service.price;
    
    // Apply service discount if any
    if (service.discount > 0) {
      basePrice = basePrice - (basePrice * service.discount / 100);
    }
    
    // Apply coupon discount
    const priceAfterCoupon = Math.max(0, basePrice - couponDiscount);
    
    // Add taxes (assuming 5% tax)
    const taxes = priceAfterCoupon * 0.05;
    
    return {
      basePrice: service.price,
      serviceDiscount: service.price - basePrice,
      couponDiscount: couponDiscount,
      subtotal: priceAfterCoupon,
      taxes: taxes,
      total: priceAfterCoupon + taxes
    };
  };

  const validateForm = () => {
    if (!formData.scheduledDate) {
      setError('Please select a date');
      return false;
    }
    
    if (!formData.scheduledTime) {
      setError('Please select a time');
      return false;
    }
    
    if (!formData.address.trim()) {
      setError('Please provide a service address');
      return false;
    }
    
    // Check if date is in the future
    const selectedDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
    if (selectedDateTime <= new Date()) {
      setError('Please select a future date and time');
      return false;
    }
    
    // Check if date is within 30 days from today
    const selectedDate = new Date(formData.scheduledDate);
    const maxAllowedDate = new Date();
    maxAllowedDate.setDate(maxAllowedDate.getDate() + 30);
    
    if (selectedDate > maxAllowedDate) {
      setError('Date cannot be more than 30 days from today');
      return false;
    }
    
    return true;
  };

  const handleCreateOrder = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const pricing = calculateTotalPrice();
      
      // Combine date and time
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);

      // Format time as human-readable (e.g., 10:30 AM) if backend expects it separately
      const formatTimeForApi = (timeStr) => {
        const [hoursStr, minutes = '00'] = (timeStr || '').split(':');
        const hours = parseInt(hoursStr || '0', 10);
        const period = hours >= 12 ? 'PM' : 'AM';
        const normalizedHour = hours % 12 === 0 ? 12 : hours % 12;
        return `${normalizedHour}:${minutes} ${period}`;
      };
      
      const orderData = {
        serviceId: service._id,
        scheduledDate: scheduledDateTime.toISOString(),
        scheduledTime: formatTimeForApi(formData.scheduledTime),
        address: formData.address,
        notes: formData.notes || undefined,
        couponCode: formData.couponCode || undefined
      };

      console.log('[CREATE ORDER] Request body:', orderData);

      const response = await orderApi.createOrder(orderData);
      console.log('[CREATE ORDER] Full Response:', response);
      
      // Extract order from response.data (not response.data.order)
      const order = response.data;
      console.log('[CREATE ORDER] Order object:', order);
      
      setCreatedOrder(order);
      
      // Show success toast with response message
      if (response.message) {
        setToast({ message: response.message, type: 'success' });
      }
      
      // Delay closing modal and navigating to allow toast to be visible
      setTimeout(() => {
        onClose(); // Close booking modal
        navigate('/user-dashboard'); // Navigate to user dashboard
      }, 2000); // 2 second delay to show toast
    } catch (err) {
      console.error('[CREATE ORDER] Error caught:', err);
      console.error('[CREATE ORDER] Error response:', err.response);
      console.error('[CREATE ORDER] Error response data:', err.response?.data);
      
      const fallbackOrder = err.response?.data?.data || err.response?.data?.order;
      console.log('[CREATE ORDER] Fallback order:', fallbackOrder);
      
      if (fallbackOrder) {
        // Backend may return an order even if an auxiliary step (like email) fails
        console.log('[CREATE ORDER] Using fallback order');
        setCreatedOrder(fallbackOrder);
        
        // Show success toast
        setToast({ message: 'Order created successfully', type: 'success' });
        
        // Delay closing modal and navigating to allow toast to be visible
        setTimeout(() => {
          onClose(); // Close booking modal
          navigate('/user-dashboard'); // Navigate to user dashboard
        }, 2000); // 2 second delay to show toast
      } else {
        // Extract error message from various possible error response formats
        let errorMsg = 'Failed to create order';
        
        if (err.response?.data?.error?.message) {
          errorMsg = err.response.data.error.message;
        } else if (err.response?.data?.message) {
          errorMsg = err.response.data.message;
        } else if (err.response?.data?.error) {
          errorMsg = typeof err.response.data.error === 'string' 
            ? err.response.data.error 
            : 'Failed to create order';
        } else if (err.message) {
          errorMsg = err.message;
        }
        
        console.error('[CREATE ORDER] Setting error message:', errorMsg);
        setError(errorMsg);
        setToast({ message: errorMsg, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    onSuccess?.();
    onClose();
  };

  const pricing = calculateTotalPrice();

  // Min date is tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().split('T')[0];

  // Max date is 30 days from today
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateString = maxDate.toISOString().split('T')[0];

  return (
    <>
      {step === 1 && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-gray-900">Book Service</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {infoMessage && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between gap-4">
                  <span className="text-sm font-medium">{infoMessage}</span>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate('/user-dashboard?tab=orders')}
                      className="px-3 py-2 text-sm bg-[#1B4B36] text-white rounded-lg hover:bg-[#2d7a54]"
                    >
                      View Order Progress
                    </button>
                  </div>
                </div>
              )}

              {/* Service Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">{service.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{service.categoryId?.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-[#1B4B36]">
                    ৳{service.price.toFixed(2)}
                  </span>
                  {service.discount > 0 && (
                    <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full">
                      {service.discount}% OFF
                    </span>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Booking Form */}
              <div className="space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaCalendarAlt className="inline mr-2" />
                    Select Date
                  </label>
                  <input
                    type="date"
                    name="scheduledDate"
                    value={formData.scheduledDate}
                    onChange={handleInputChange}
                    min={minDateString}
                    max={maxDateString}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
                    required
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaClock className="inline mr-2" />
                    Select Time
                  </label>
                  <input
                    type="time"
                    name="scheduledTime"
                    value={formData.scheduledTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
                    required
                  />
                </div>

                {/* Address */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <FaMapMarkerAlt className="inline mr-2" />
                      Service Address
                    </label>
                    {savedAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAddressBook(true)}
                        className="text-sm text-[#1B4B36] hover:underline flex items-center gap-1"
                      >
                        <FaBook size={12} />
                        Choose from saved
                      </button>
                    )}
                  </div>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter complete address where service should be provided"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent resize-none"
                    required
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any special requirements or instructions"
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent resize-none"
                  />
                </div>

                {/* Coupon Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaTag className="inline mr-2" />
                    Have a Coupon?
                  </label>
                  <CouponInput
                    onApply={handleCouponApply}
                    onRemove={handleCouponRemove}
                    appliedCoupon={appliedCoupon}
                  />
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-gray-800 mb-3">Price Summary</h4>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Price</span>
                  <span className="font-medium">৳{pricing.basePrice.toFixed(2)}</span>
                </div>
                
                {pricing.serviceDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Service Discount ({service.discount}%)</span>
                    <span>-৳{pricing.serviceDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                {pricing.couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Coupon Discount</span>
                    <span>-৳{pricing.couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">৳{pricing.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxes & Fees (5%)</span>
                  <span className="font-medium">৳{pricing.taxes.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-lg font-bold text-[#1B4B36] pt-2 border-t border-gray-300">
                  <span>Total Amount</span>
                  <span>৳{pricing.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleCreateOrder}
                disabled={loading}
                className="w-full py-3 bg-[#1B4B36] text-white rounded-lg font-semibold hover:bg-[#2d7a54] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Continue to Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Book Modal */}
      {showAddressBook && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Select Address</h3>
              <button
                onClick={() => setShowAddressBook(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-6">
              <AddressManager 
                onSelectAddress={handleSelectAddress}
                selectionMode={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {step === 2 && createdOrder && (
        <PaymentModal
          order={createdOrder}
          onClose={onClose}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Order Success Modal */}
      {showSuccessModal && createdOrder && (
        <OrderSuccessModal
          order={createdOrder}
          onClose={() => {
            setShowSuccessModal(false);
            onSuccess?.();
          }}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default BookingModal;
