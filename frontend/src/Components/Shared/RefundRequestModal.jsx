import React, { useState } from 'react';
import { FaMoneyBillWave, FaTimes } from 'react-icons/fa';
import { refundApi } from '../../api/refundApi';

const RefundRequestModal = ({ order, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    refundAmount: order?.totalAmount || 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refundReasons = [
    'Service not delivered',
    'Poor service quality',
    'Vendor cancelled',
    'Wrong service provided',
    'Vendor no-show',
    'Overcharged',
    'Service incomplete',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.reason) {
      setError('Please select a reason');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a detailed description');
      return;
    }

    try {
      setLoading(true);
      await refundApi.requestRefund(order._id, formData);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to submit refund request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-2xl text-[#1B4B36] flex items-center gap-2">
            <FaMoneyBillWave />
            Request Refund
          </h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <FaTimes />
          </button>
        </div>

        {/* Order Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-800 mb-2">Order Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Order ID:</span>
              <p className="font-medium">#{order?.orderNumber || order?._id?.slice(-8)}</p>
            </div>
            <div>
              <span className="text-gray-600">Service:</span>
              <p className="font-medium">{order?.service?.name}</p>
            </div>
            <div>
              <span className="text-gray-600">Amount Paid:</span>
              <p className="font-medium text-[#1B4B36]">৳{order?.totalAmount}</p>
            </div>
            <div>
              <span className="text-gray-600">Payment Status:</span>
              <p className="font-medium">{order?.paymentStatus}</p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
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
          </div>
        )}

        {/* Refund Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Refund Amount */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Refund Amount</span>
            </label>
            <div className="input input-bordered flex items-center gap-2">
              <span className="font-bold">৳</span>
              <input
                type="number"
                className="grow"
                value={formData.refundAmount}
                onChange={(e) => setFormData({ ...formData, refundAmount: parseFloat(e.target.value) })}
                max={order?.totalAmount}
                min={0}
                step="0.01"
                required
              />
            </div>
            <label className="label">
              <span className="label-text-alt text-gray-500">
                Maximum refundable: ৳{order?.totalAmount}
              </span>
            </label>
          </div>

          {/* Reason */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Reason for Refund *</span>
            </label>
            <select
              className="select select-bordered"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            >
              <option value="">Select a reason...</option>
              {refundReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Detailed Description *</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-32"
              placeholder="Please provide a detailed explanation of why you're requesting a refund..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              minLength={20}
            />
            <label className="label">
              <span className="label-text-alt text-gray-500">
                {formData.description.length}/500 characters (minimum 20)
              </span>
            </label>
          </div>

          {/* Info Box */}
          <div className="alert alert-info bg-blue-50 border border-blue-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-blue-600 shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-semibold mb-1">Refund Policy:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Refunds are processed within 5-7 business days after approval</li>
                <li>Amount will be credited to your original payment method</li>
                <li>Admin will review your request within 24-48 hours</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="modal-action">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn bg-[#1B4B36] text-white hover:bg-[#2d7a56] ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Refund Request'}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
    </div>
  );
};

export default RefundRequestModal;
