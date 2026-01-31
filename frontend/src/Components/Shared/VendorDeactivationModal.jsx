import React, { useState } from 'react';
import { FaExclamationTriangle, FaTimes, FaEnvelope, FaPhone, FaClock } from 'react-icons/fa';

const VendorDeactivationModal = ({ isOpen, onClose, vendor }) => {
  const [reactivationMessage, setReactivationMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmitReactivationRequest = async () => {
    if (!reactivationMessage.trim()) {
      alert('Please enter a message explaining why you would like to reactivate your account.');
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Implement API call to submit reactivation request
      // await vendorApi.submitReactivationRequest({ message: reactivationMessage });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setReactivationMessage('');
        onClose();
      }, 3000);
    } catch (error) {
      alert('Failed to submit reactivation request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="text-red-500 text-3xl" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Account Deactivated</h2>
              <p className="text-sm text-red-600 font-medium mt-1">🚫 Login Access Denied</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-semibold mb-2">Request Submitted!</p>
              <p className="text-green-700 text-sm">
                Our support team will review your request and contact you shortly.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-900 font-semibold mb-2">
                  ⚠️ Your vendor account has been deactivated
                </p>
                <p className="text-red-800 text-sm">
                  You cannot log in or access the system until your account is reactivated. 
                  Please contact our support team to resolve this issue and restore your account access.
                </p>
              </div>

              {vendor?.deactivationReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    <strong>Deactivation Reason:</strong> {vendor.deactivationReason}
                  </p>
                </div>
              )}

              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 mb-2">Contact Support</h3>
                <div className="flex items-center gap-3 text-gray-700">
                  <FaEnvelope className="text-blue-600" />
                  <a href="mailto:support@example.com" className="hover:underline">
                    support@example.com
                  </a>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <FaPhone className="text-green-600" />
                  <a href="tel:+1234567890" className="hover:underline">
                    +1-234-567-8900
                  </a>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <FaClock className="text-orange-600" />
                  <span>Mon-Fri, 9AM-6PM EST</span>
                </div>
              </div>

              {/* Reactivation Request Form */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Request Reactivation</h3>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent resize-none"
                  rows="4"
                  placeholder="Explain why you'd like to reactivate your account..."
                  value={reactivationMessage}
                  onChange={(e) => setReactivationMessage(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
            <button
              onClick={handleSubmitReactivationRequest}
              disabled={submitting || !reactivationMessage.trim()}
              className="flex-1 px-4 py-2 bg-[#1B4B36] text-white rounded-lg hover:bg-[#2d7a54] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDeactivationModal;
