import React, { useState } from 'react';
import { MdEmail, MdClose, MdCheckCircle } from 'react-icons/md';
import { authApi } from '../api/authApi';

const VerifyEmailNotification = ({ userEmail, onClose }) => {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendError('');
    setResendSuccess(false);

    try {
      await authApi.resendVerification(userEmail);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (error) {
      setResendError(error.response?.data?.error?.message || 'Failed to resend email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-yellow-50 to-orange-50 border-b-4 border-[#1B4B36] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close notification"
        >
          <MdClose size={20} />
        </button>

        {/* Icon and Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-[#1B4B36] rounded-full flex items-center justify-center">
            <MdEmail className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1B4B36]">Verify Your Email</h3>
            <p className="text-sm text-gray-600 mt-1">
              Please check your email inbox and click the verification link to activate your account.
            </p>
          </div>
        </div>

        {/* Email info */}
        <div className="bg-white rounded-md p-3 mb-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Email sent to:</span>
            <br />
            <span className="text-[#1B4B36]">{userEmail}</span>
          </p>
        </div>

        {/* Success message */}
        {resendSuccess && (
          <div className="alert alert-success bg-green-50 border border-green-200 mb-4 flex items-center gap-2 p-3">
            <MdCheckCircle className="text-green-600" size={20} />
            <span className="text-sm text-green-700">Verification email sent successfully!</span>
          </div>
        )}

        {/* Error message */}
        {resendError && (
          <div className="alert alert-error bg-red-50 border border-red-200 mb-4 p-3">
            <span className="text-sm text-red-700">{resendError}</span>
          </div>
        )}

        {/* Resend button */}
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-2">Didn't receive the email?</p>
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="btn btn-sm bg-[#1B4B36] text-white hover:bg-[#2a6b4f] border-none disabled:bg-gray-400"
          >
            {isResending ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Sending...
              </>
            ) : (
              'Resend Verification Email'
            )}
          </button>
        </div>

        {/* Additional help */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Check your spam folder if you don't see the email
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailNotification;
