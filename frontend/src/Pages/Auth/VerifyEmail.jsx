import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MdCheckCircle, MdError, MdEmail } from 'react-icons/md';
import { authApi } from '../../api/authApi';
import useAuthStore from '../../store/authStore';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUser } = useAuthStore();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmailToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        const response = await authApi.verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Email verified successfully!');
        
        // Refresh user data to get updated isEmailVerified status
        await fetchUser();
        
        // Redirect to home/login after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(
          error.response?.data?.error?.message || 
          'Verification failed. The link may be invalid or expired.'
        );
      }
    };

    verifyEmailToken();
  }, [token, navigate, fetchUser]);

  return (
    <div className="min-h-screen bg-linear-to-br flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Loading State */}
          {status === 'verifying' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-[#1B4B36] rounded-full flex items-center justify-center animate-pulse">
                  <MdEmail className="text-white" size={40} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-[#1B4B36] mb-4">
                Verifying Your Email
              </h2>
              <p className="text-gray-600 mb-6">
                Please wait while we verify your email address...
              </p>
              <div className="flex justify-center">
                <span className="loading loading-spinner loading-lg text-[#1B4B36]"></span>
              </div>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                  <MdCheckCircle className="text-white" size={40} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-4">
                Email Verified Successfully!
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-700">
                  Your account has been activated. You can now log in and access all features.
                </p>
              </div>
              <p className="text-sm text-gray-500">
                Redirecting to home page in 3 seconds...
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 btn bg-[#1B4B36] text-white hover:bg-[#2a6b4f] border-none"
              >
                Go to Home Now
              </button>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
                  <MdError className="text-white" size={40} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                Verification Failed
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-700 mb-2">
                  This could happen if:
                </p>
                <ul className="text-xs text-red-600 list-disc list-inside text-left space-y-1">
                  <li>The verification link has expired</li>
                  <li>The link has already been used</li>
                  <li>The link is invalid or corrupted</li>
                </ul>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate('/')}
                  className="btn btn-outline border-[#1B4B36] text-[#1B4B36] hover:bg-[#1B4B36] hover:text-white"
                >
                  Go to Home
                </button>
                <button
                  onClick={() => window.location.href = 'mailto:support@practicum.com'}
                  className="btn bg-[#1B4B36] text-white hover:bg-[#2a6b4f] border-none"
                >
                  Contact Support
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Additional Help */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <a
              href="mailto:support@practicum.com"
              className="text-[#1B4B36] font-semibold hover:underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
