import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaClock, FaTimes, FaMoneyBillWave, FaUndo, FaFileInvoice, FaEye } from 'react-icons/fa';
import { paymentApi } from '../../api/paymentApi';

const PaymentStatusTracker = ({ orderId, transactionId, onRetry, compact = false }) => {
  const [loading, setLoading] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [showDetails, setShowDetails] = useState(!compact);

  useEffect(() => {
    if (transactionId) {
      fetchPaymentHistory();
    }
  }, [transactionId]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await paymentApi.getTransactionById(transactionId);
      const transaction = response.data.transaction;
      
      setCurrentStatus(transaction.status);
      
      // Create history timeline from transaction data
      const history = [
        {
          status: 'initiated',
          timestamp: transaction.createdAt,
          message: 'Payment initiated',
          icon: FaClock,
          color: 'blue'
        }
      ];

      if (transaction.status === 'completed' || transaction.status === 'paid') {
        history.push({
          status: 'completed',
          timestamp: transaction.updatedAt,
          message: 'Payment completed successfully',
          icon: FaCheckCircle,
          color: 'green',
          details: {
            method: transaction.paymentMethod,
            amount: transaction.totalAmount
          }
        });
      } else if (transaction.status === 'failed') {
        history.push({
          status: 'failed',
          timestamp: transaction.updatedAt,
          message: 'Payment failed',
          icon: FaTimes,
          color: 'red',
          details: {
            reason: transaction.failureReason || 'Payment could not be processed'
          }
        });
      } else if (transaction.status === 'refunded') {
        history.push({
          status: 'refunded',
          timestamp: transaction.refundedAt || transaction.updatedAt,
          message: 'Payment refunded',
          icon: FaUndo,
          color: 'purple',
          details: {
            amount: transaction.refundAmount
          }
        });
      }

      setPaymentHistory(history);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Pending', class: 'bg-yellow-100 text-yellow-800', icon: FaClock },
      processing: { text: 'Processing', class: 'bg-blue-100 text-blue-800', icon: FaClock },
      completed: { text: 'Completed', class: 'bg-green-100 text-green-800', icon: FaCheckCircle },
      paid: { text: 'Paid', class: 'bg-green-100 text-green-800', icon: FaCheckCircle },
      failed: { text: 'Failed', class: 'bg-red-100 text-red-800', icon: FaTimes },
      refunded: { text: 'Refunded', class: 'bg-purple-100 text-purple-800', icon: FaUndo },
      partially_refunded: { text: 'Partially Refunded', class: 'bg-purple-100 text-purple-800', icon: FaUndo }
    };
    return badges[status] || badges.pending;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && transactionId) {
    return (
      <div className="flex justify-center py-4">
        <div className="loading loading-spinner loading-sm text-[#1B4B36]"></div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(currentStatus);
  const StatusIcon = statusBadge.icon;

  // Compact view - just show status badge
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusBadge.class}`}>
          <StatusIcon size={14} />
          {statusBadge.text}
        </span>
        {currentStatus === 'failed' && onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-[#1B4B36] hover:underline font-medium"
          >
            Retry Payment
          </button>
        )}
      </div>
    );
  }

  // Full view - show timeline
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <FaMoneyBillWave className="text-[#1B4B36]" />
          Payment Status
        </h4>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-[#1B4B36] hover:underline flex items-center gap-1"
        >
          <FaEye />
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {/* Current Status Badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium ${statusBadge.class}`}>
          <StatusIcon size={18} />
          {statusBadge.text}
        </span>
      </div>

      {/* Timeline */}
      {showDetails && paymentHistory.length > 0 && (
        <div className="space-y-4">
          <div className="relative pl-8 space-y-4">
            {paymentHistory.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === paymentHistory.length - 1;
              
              return (
                <div key={index} className="relative">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-[-22px] top-8 w-0.5 h-full bg-gray-300"></div>
                  )}
                  
                  {/* Timeline dot */}
                  <div className={`absolute left-[-28px] top-1 w-3 h-3 rounded-full bg-${item.color}-500 border-2 border-white`}></div>
                  
                  {/* Content */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`text-${item.color}-600`} />
                        <span className="font-medium text-gray-800">{item.message}</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(item.timestamp)}</span>
                    </div>
                    
                    {item.details && (
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        {item.details.method && (
                          <p>Method: <span className="font-medium capitalize">{item.details.method}</span></p>
                        )}
                        {item.details.amount && (
                          <p>Amount: <span className="font-medium">৳{item.details.amount.toFixed(2)}</span></p>
                        )}
                        {item.details.reason && (
                          <p className="text-red-600">{item.details.reason}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            {currentStatus === 'failed' && onRetry && (
              <button
                onClick={onRetry}
                className="btn btn-sm bg-[#1B4B36] text-white hover:bg-[#2d7a54]"
              >
                <FaUndo /> Retry Payment
              </button>
            )}
            {(currentStatus === 'completed' || currentStatus === 'paid') && (
              <button
                onClick={() => {/* View invoice logic */}}
                className="btn btn-sm btn-outline border-[#1B4B36] text-[#1B4B36] hover:bg-[#1B4B36] hover:text-white"
              >
                <FaFileInvoice /> View Invoice
              </button>
            )}
          </div>
        </div>
      )}

      {/* No transaction ID message */}
      {!transactionId && (
        <div className="text-center py-4 text-gray-500 text-sm">
          <FaClock className="inline mb-2" size={24} />
          <p>Payment not initiated yet</p>
        </div>
      )}
    </div>
  );
};

export default PaymentStatusTracker;
