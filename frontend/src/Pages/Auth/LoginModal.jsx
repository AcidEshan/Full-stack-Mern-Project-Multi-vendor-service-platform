import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdClose } from 'react-icons/md';
import useAuthStore from '../../store/authStore';

const LoginModal = ({ onClose, onSwitchToSignup, preventNavigation = false }) => {
  const navigate = useNavigate();
  const { login, logout, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [vendorPendingApproval, setVendorPendingApproval] = useState(false);
  const [vendorDeactivated, setVendorDeactivated] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
    clearError();
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const response = await login(formData);
      const responseData = response.data?.data || response.data || response;
      const user = responseData.user;

      // Check if vendor is not approved
      if (user.role === 'vendor' && !user.isApproved) {
        // Logout the user since they can't access the system
        await logout();
        setVendorPendingApproval(true);
        return;
      }

      // Close modal
      onClose();

      if (preventNavigation) {
        return;
      }

      // Check if email is verified for user role
      if (user.role === 'user' && !user.isEmailVerified) {
        // Redirect to home with email verification flag
        navigate('/', { state: { showEmailVerification: true, userEmail: user.email } });
        return;
      }

      // Redirect based on role
      if (user.role === 'super_admin') {
        navigate('/super-admin');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'vendor') {
        navigate('/vendor-dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Check if vendor account is deactivated - LOGIN IS BLOCKED
      const errorCode = err.response?.data?.error?.code;
      if (errorCode === 'VENDOR_DEACTIVATED') {
        setVendorDeactivated(true);
        // Ensure complete logout - deactivated vendors cannot access the system
        logout();
      }
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md relative">
        {/* Close button */}
        <button
          onClick={() => {
            clearError();
            setValidationErrors({});
            setVendorPendingApproval(false);
            setVendorDeactivated(false);
            onClose();
          }}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >
          <MdClose />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-[#1B4B36]">Welcome Back</h2>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
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

        {/* Vendor Pending Approval Alert */}
        {vendorPendingApproval && (
          <div className="alert alert-warning mb-4 bg-yellow-50 border border-yellow-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-yellow-600 shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="font-bold text-yellow-800">Registration Under Verification</h3>
              <div className="text-sm text-yellow-700">
                Your registration process is under verification. You can login after the verification is completed.
              </div>
            </div>
          </div>
        )}

        {/* Vendor Deactivated Alert - Login Blocked */}
        {vendorDeactivated && (
          <div className="alert alert-error mb-4 bg-red-50 border-2 border-red-400">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="w-full">
              <h3 className="font-bold text-red-900 mb-1">🚫 Login Access Denied</h3>
              <div className="text-sm text-red-800 mb-3">
                <strong>Your vendor account has been deactivated.</strong> You cannot access the system until your account is reactivated.
                Please contact our support team immediately to resolve this issue.
              </div>
              <div className="bg-white/60 rounded p-2 space-y-1">
                <div className="text-sm font-semibold text-red-900 mb-1">Contact Support:</div>
                <a href="mailto:support@example.com" className="flex items-center gap-2 text-sm text-red-700 hover:text-red-900 hover:underline font-medium">
                  📧 eshamlucifer@gmail.com
                </a>
                <a href="tel:+8801718440268" className="flex items-center gap-2 text-sm text-red-700 hover:text-red-900 hover:underline font-medium">
                  📞 +880-1718440268
                </a>
                <div className="text-xs text-red-600 mt-1">
                  Sun-Thu, 9AM-6PM BST
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-gray-700">Email Address</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <MdEmail style={{ color: '#1B4B36', fontSize: '20px' }} />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input input-bordered w-full pl-10 ${
                  validationErrors.email ? 'input-error' : ''
                }`}
                placeholder="Enter your email"
              />
            </div>
            {validationErrors.email && (
              <label className="label">
                <span className="label-text-alt text-error">{validationErrors.email}</span>
              </label>
            )}
          </div>

          {/* Password Field */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-gray-700">Password</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <MdLock style={{ color: '#1B4B36', fontSize: '20px' }} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input input-bordered w-full pl-10 pr-10 ${
                  validationErrors.password ? 'input-error' : ''
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <MdVisibilityOff style={{ color: '#666', fontSize: '20px' }} />
                ) : (
                  <MdVisibility style={{ color: '#666', fontSize: '20px' }} />
                )}
              </button>
            </div>
            {validationErrors.password && (
              <label className="label">
                <span className="label-text-alt text-error">{validationErrors.password}</span>
              </label>
            )}
            <label className="label">
              <span className="label-text-alt"></span>
              <a 
                href="/forgot-password" 
                className="label-text-alt text-[#1B4B36] hover:text-[#2d7a56] font-semibold"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  window.location.href = '/forgot-password';
                }}
              >
                Forgot password?
              </a>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn w-full bg-[#1B4B36] hover:bg-[#2d7a56] text-[#FCDE70] border-none text-lg font-semibold"
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignup}
              className="text-[#1B4B36] hover:text-[#2d7a56] font-semibold"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
    </div>
  );
};

export default LoginModal;
