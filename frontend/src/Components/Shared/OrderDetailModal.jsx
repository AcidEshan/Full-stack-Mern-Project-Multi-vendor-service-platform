import React, { useState } from 'react';
import { FaTimes, FaCheckCircle, FaClock, FaMapMarkerAlt, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';
import PaymentModal from './PaymentModal';
import InvoiceActions from './InvoiceActions';
import PaymentStatusTracker from './PaymentStatusTracker';
import ReviewSection from './ReviewSection';

const OrderDetailModal = ({ order, onClose, onUpdate, userRole = 'user' }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (!order) return null;

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      accepted: 'bg-blue-100 text-blue-800 border-blue-300',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      rejected: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800',
      partially_refunded: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canMakePayment = order.paymentStatus === 'pending' && order.status !== 'cancelled' && order.status !== 'rejected';
  const canDownloadInvoice = order.paymentStatus === 'paid' || order.status === 'completed';

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Banner */}
            <div className={`flex items-center justify-between p-4 rounded-lg border ${getStatusColor(order.status)}`}>
              <div className="flex items-center gap-3">
                {order.status === 'completed' && <FaCheckCircle size={24} />}
                {['pending', 'accepted', 'in_progress'].includes(order.status) && <FaClock size={24} />}
                <div>
                  <p className="font-semibold text-lg capitalize">{order.status.replace('_', ' ')}</p>
                  <p className="text-sm opacity-80">Order #{order._id.slice(-8)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold px-3 py-1 rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                  Payment: {order.paymentStatus}
                </p>
              </div>
            </div>

            {/* Service Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Service Information</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Service Name</p>
                  <p className="font-medium">{order.service?.name || 'Service'}</p>
                </div>
                {order.service?.category && (
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium">{order.service.category}</p>
                  </div>
                )}
                {order.vendor && (
                  <div>
                    <p className="text-sm text-gray-600">Vendor</p>
                    <p className="font-medium">{order.vendor.companyName || order.vendor.name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaCalendarAlt className="text-[#1B4B36]" />
                Schedule
              </h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Scheduled Date & Time</p>
                  <p className="font-medium">{formatDate(order.scheduledDate)}</p>
                </div>
                {order.address && (
                  <div>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <FaMapMarkerAlt /> Service Location
                    </p>
                    <p className="font-medium">
                      {typeof order.address === 'string' 
                        ? order.address 
                        : `${order.address.street}, ${order.address.city}, ${order.address.state} ${order.address.zipCode}, ${order.address.country}`
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaMoneyBillWave className="text-[#1B4B36]" />
                Pricing
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Price</span>
                  <span className="font-medium">৳{order.servicePrice?.toFixed(2) || '0.00'}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-৳{order.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {order.discountAmount > 0 && (
                  <div className="flex justify-between pt-1 border-t border-gray-300">
                    <span className="text-gray-600">Subtotal (after discount)</span>
                    <span className="font-medium">৳{((order.servicePrice || 0) - (order.discountAmount || 0)).toFixed(2)}</span>
                  </div>
                )}
                {order.taxes > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxes & Fees (5%)</span>
                    <span className="font-medium">৳{order.taxes.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-[#1B4B36] pt-2 border-t border-gray-400">
                  <span>Total Amount</span>
                  <span>৳{order.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Notes</h4>
                <p className="text-gray-700">{order.notes}</p>
              </div>
            )}

            {/* Payment Status Tracker */}
            {order.transactionId && (
              <PaymentStatusTracker
                orderId={order._id}
                transactionId={order.transactionId}
                onRetry={() => setShowPaymentModal(true)}
              />
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">{/* Payment Button - Show if payment pending */}
              {canMakePayment && userRole === 'user' && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="btn bg-[#1B4B36] text-white hover:bg-[#2d7a54] flex-1 min-w-[200px]"
                >
                  <FaMoneyBillWave /> Make Payment
                </button>
              )}

              {/* Invoice/Receipt Download - Show if paid */}
              {canDownloadInvoice && (
                <div className="flex-1 min-w-[200px]">
                  <InvoiceActions 
                    order={order} 
                    type={order.status === 'completed' ? 'receipt' : 'invoice'} 
                  />
                </div>
              )}

              {/* Cancel Order - Show if applicable */}
              {order.status === 'pending' && userRole === 'user' && (
                <button
                  onClick={() => {
                    onUpdate?.('cancel', order._id);
                  }}
                  className="btn btn-outline border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  Cancel Order
                </button>
              )}
            </div>

            {/* Review Section - Show for completed orders */}
            {order.status === 'completed' && userRole === 'user' && (
              <div className="mt-6 pt-6 border-t">
                <ReviewSection 
                  serviceId={order.service?._id || order.serviceId}
                  vendorId={order.vendor?._id || order.vendorId}
                  orderId={order._id}
                  type="service"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          order={order}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={() => {
            setShowPaymentModal(false);
            onUpdate?.('payment', order._id);
            onClose();
          }}
        />
      )}
    </>
  );
};

export default OrderDetailModal;
