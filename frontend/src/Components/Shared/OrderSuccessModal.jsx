import React from 'react';
import { FaCheckCircle, FaTimes, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaReceipt, FaMoneyBillWave } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const OrderSuccessModal = ({ order, onClose, onViewOrders }) => {
  const navigate = useNavigate();

  if (!order) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatPrice = (price) => {
    return `₹${price?.toFixed(2) || '0.00'}`;
  };

  const handleViewOrders = () => {
    onClose();
    navigate('/user-dashboard');
  };

  const handleOk = () => {
    onClose();
    navigate('/user-dashboard');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-green-500 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
          
          <div className="flex flex-col items-center text-center">
            <FaCheckCircle className="text-6xl mb-3 animate-bounce" />
            <h2 className="text-2xl font-bold mb-2">Order Created Successfully!</h2>
            <p className="text-green-100">Your booking has been confirmed</p>
          </div>
        </div>

        {/* Order Details */}
        <div className="p-6 space-y-6">
          {/* Order Number */}
          <div className="bg-gray-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <FaReceipt />
              <span className="text-sm font-semibold">Order Number</span>
            </div>
            <p className="text-lg font-bold text-gray-800">{order.orderNumber}</p>
          </div>

          {/* Service Info */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Service Details</h3>
            <p className="text-gray-700 font-medium">{order.service?.name || 'Service'}</p>
            {order.service?.description && (
              <p className="text-sm text-gray-500 mt-1">{order.service.description}</p>
            )}
          </div>

          {/* Schedule Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Booking Information</h3>
            
            <div className="flex items-start gap-3">
              <FaCalendarAlt className="text-blue-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Scheduled Date</p>
                <p className="text-gray-800 font-medium">{formatDate(order.scheduledDate)}</p>
              </div>
            </div>

            {order.scheduledTime && (
              <div className="flex items-start gap-3">
                <FaClock className="text-blue-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Scheduled Time</p>
                  <p className="text-gray-800 font-medium">{order.scheduledTime}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <FaMapMarkerAlt className="text-red-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Service Address</p>
                <p className="text-gray-800 font-medium">
                  {typeof order.address === 'string' 
                    ? order.address 
                    : order.address 
                      ? [
                          order.address.street,
                          order.address.city,
                          order.address.state,
                          order.address.zipCode,
                          order.address.country
                        ].filter(Boolean).join(', ')
                      : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3">Payment Summary</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Base Price</span>
                <span>{formatPrice(order.basePrice)}</span>
              </div>
              
              {order.taxAmount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{formatPrice(order.taxAmount)}</span>
                </div>
              )}
              
              {order.platformFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee</span>
                  <span>{formatPrice(order.platformFee)}</span>
                </div>
              )}
              
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t">
                <span>Total Amount</span>
                <span className="text-green-600">{formatPrice(order.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <div className="flex items-center gap-2">
              <FaMoneyBillWave className="text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-800">Payment Status</p>
                <p className="text-sm text-yellow-700">
                  {order.paymentStatus === 'paid' ? 'Payment Completed' : 'Payment Pending'}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-gray-50 rounded p-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">Additional Notes</p>
              <p className="text-gray-600">{order.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4">
            <button
              onClick={handleOk}
              className="w-full bg-[#1B4B36] hover:bg-[#143426] text-white font-semibold py-3 rounded-lg transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessModal;
