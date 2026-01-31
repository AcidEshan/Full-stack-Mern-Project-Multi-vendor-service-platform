import React, { useState, useEffect } from 'react';
import { MdEmail, MdLock, MdPerson, MdPhone, MdBusiness, MdVisibility, MdVisibilityOff, MdClose, MdCheckCircle } from 'react-icons/md';
import useAuthStore from '../../store/authStore';
import { authApi } from '../../api/authApi';

const SignupModal = ({ onClose, onSwitchToLogin, preSelectedRole = 'user', lockRole = false }) => {
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: preSelectedRole,
    companyName: '',
    companyDescription: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  
  // Email verification states (only for vendors)
  const [emailVerificationStatus, setEmailVerificationStatus] = useState('unverified');
  const [verificationCode, setVerificationCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Debug log for email verification status changes
  useEffect(() => {
    console.log('Email verification status changed to:', emailVerificationStatus);
  }, [emailVerificationStatus]);

  // Timer effect for OTP countdown
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
    clearError();
    
    // Reset email verification if email changes or role changes from/to vendor
    if ((name === 'email' || name === 'role') && emailVerificationStatus !== 'unverified') {
      setEmailVerificationStatus('unverified');
      setVerificationCode('');
      setTimer(0);
      setCanResend(false);
    }
  };

  const handleSendVerificationCode = async () => {
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setValidationErrors({ email: 'Please enter a valid email address' });
      return;
    }

    console.log('Sending verification code to:', formData.email);
    setEmailVerificationStatus('sending');
    setOtpError('');

    try {
      const response = await authApi.sendVerificationCode(formData.email);
      console.log('Verification code sent successfully:', response);
      setEmailVerificationStatus('code-sent');
      setTimer(60);
      setCanResend(false);
      setOtpError('');
    } catch (error) {
      console.error('Error sending verification code:', error);
      setOtpError(error.response?.data?.error?.message || 'Failed to send verification code');
      setEmailVerificationStatus('unverified');
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setOtpError('Please enter a valid 6-digit code');
      return;
    }

    setEmailVerificationStatus('verifying');
    setOtpError('');

    try {
      await authApi.verifyEmailCode(formData.email, verificationCode);
      setEmailVerificationStatus('verified');
      setVerificationCode('');
    } catch (error) {
      setOtpError(error.response?.data?.error?.message || 'Invalid or expired code');
      setEmailVerificationStatus('code-sent');
    }
  };

  const handleResendCode = async () => {
    setOtpError('');
    setEmailVerificationStatus('sending');

    try {
      await authApi.resendVerificationCode(formData.email);
      setEmailVerificationStatus('code-sent');
      setTimer(60);
      setCanResend(false);
      setVerificationCode('');
    } catch (error) {
      setOtpError(error.response?.data?.error?.message || 'Failed to resend code');
      setEmailVerificationStatus('code-sent');
    }
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
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.firstName || formData.firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName || formData.lastName.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.phone) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(formData.phone)) {
      errors.phone = 'Phone number must be 10-15 digits';
    }

    if (formData.role === 'vendor' && !formData.companyName) {
      errors.companyName = 'Company name is required for vendors';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setSuccessMessage('');

    // Check email verification only for vendors
    if (formData.role === 'vendor' && emailVerificationStatus !== 'verified') {
      setOtpError('Please verify your email address before submitting');
      return;
    }

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const response = await register(formData);
      setSuccessMessage(response.message);
      
      // Switch to login after 2 seconds
      setTimeout(() => {
        onSwitchToLogin();
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10"
        >
          <MdClose />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-[#1B4B36]">Create Account</h2>
          <p className="mt-2 text-gray-600">Join our community today</p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="alert alert-success mb-4 bg-green-50 border border-green-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-green-600 shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-green-600">{successMessage}</span>
          </div>
        )}

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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-700">I am a</span>
              </label>
              <div className="flex gap-4">
                <label className="label cursor-pointer flex-1 border-2 border-gray-300 rounded-lg p-3 hover:border-[#1B4B36]">
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={formData.role === 'user'}
                    onChange={handleChange}
                    disabled={lockRole}
                    className="radio radio-neutral"
                  />
                  <span className="label-text font-medium">User</span>
                </label>
                <label className="label cursor-pointer flex-1 border-2 border-gray-300 rounded-lg p-3 hover:border-[#1B4B36]">
                  <input
                    type="radio"
                    name="role"
                    value="vendor"
                    checked={formData.role === 'vendor'}
                    onChange={handleChange}
                    disabled={lockRole}
                    className="radio radio-neutral"
                  />
                  <span className="label-text font-medium">Vendor</span>
                </label>
              </div>
            </div>          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-700">First Name</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <MdPerson style={{ color: '#1B4B36', fontSize: '20px' }} />
                </div>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`input input-bordered w-full pl-10 ${
                    validationErrors.firstName ? 'input-error' : ''
                  }`}
                  placeholder="First Name"
                />
              </div>
              {validationErrors.firstName && (
                <label className="label">
                  <span className="label-text-alt text-error">{validationErrors.firstName}</span>
                </label>
              )}
            </div>

            {/* Last Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-700">Last Name</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <MdPerson style={{ color: '#1B4B36', fontSize: '20px' }} />
                </div>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`input input-bordered w-full pl-10 ${
                    validationErrors.lastName ? 'input-error' : ''
                  }`}
                  placeholder="Last Name"
                />
              </div>
              {validationErrors.lastName && (
                <label className="label">
                  <span className="label-text-alt text-error">{validationErrors.lastName}</span>
                </label>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-gray-700">Email Address</span>
            </label>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <MdEmail style={{ color: '#1B4B36', fontSize: '20px' }} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={formData.role === 'vendor' && emailVerificationStatus === 'verified'}
                    className={`input input-bordered w-full pl-10 ${
                      validationErrors.email ? 'input-error' : ''
                    } ${formData.role === 'vendor' && emailVerificationStatus === 'verified' ? 'bg-green-50' : ''}`}
                    placeholder="john@example.com"
                  />
                </div>
                {validationErrors.email && (
                  <label className="label">
                    <span className="label-text-alt text-error">{validationErrors.email}</span>
                  </label>
                )}
              </div>
              
              {/* Verify Email Button - Only for vendors */}
              {formData.role === 'vendor' && (
                <>
                  {emailVerificationStatus === 'unverified' && (
                    <button
                      type="button"
                      onClick={handleSendVerificationCode}
                      className="btn bg-[#1B4B36] text-white hover:bg-[#2a6b4f] border-none mt-0 whitespace-nowrap"
                    >
                      Verify Email
                    </button>
                  )}
                  
                  {emailVerificationStatus === 'sending' && (
                    <button
                      type="button"
                      disabled
                      className="btn btn-disabled mt-0"
                    >
                      <span className="loading loading-spinner loading-sm"></span>
                      Sending...
                    </button>
                  )}
                  
                  {emailVerificationStatus === 'verified' && (
                    <button
                      type="button"
                      disabled
                      className="btn bg-green-500 text-white border-none mt-0 gap-1"
                    >
                      <MdCheckCircle size={20} />
                      Verified
                    </button>
                  )}
                </>
              )}
            </div>
            
            {/* OTP Input Field - Only for vendors */}
            {formData.role === 'vendor' && (emailVerificationStatus === 'code-sent' || emailVerificationStatus === 'verifying') && (
              <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setVerificationCode(value);
                        setOtpError('');
                      }}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="input input-bordered w-full text-center text-lg tracking-widest"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-600">
                        {timer > 0 ? (
                          <>Code expires in <span className="font-bold text-red-600">{timer}s</span></>
                        ) : (
                          <span className="text-red-600">Code expired</span>
                        )}
                      </span>
                      {canResend && (
                        <button
                          type="button"
                          onClick={handleResendCode}
                          className="text-xs text-[#1B4B36] hover:underline font-semibold"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={emailVerificationStatus === 'verifying' || verificationCode.length !== 6}
                    className="btn bg-[#1B4B36] text-white hover:bg-[#2a6b4f] border-none"
                  >
                    {emailVerificationStatus === 'verifying' ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Verifying...
                      </>
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>
                {otpError && (
                  <div className="alert alert-error mt-2 py-2 bg-red-50 border-red-200">
                    <span className="text-xs text-red-600">{otpError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-gray-700">Phone Number</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <MdPhone style={{ color: '#1B4B36', fontSize: '20px' }} />
              </div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`input input-bordered w-full pl-10 ${
                  validationErrors.phone ? 'input-error' : ''
                }`}
                placeholder="1234567890"
              />
            </div>
            {validationErrors.phone && (
              <label className="label">
                <span className="label-text-alt text-error">{validationErrors.phone}</span>
              </label>
            )}
          </div>

          {/* Vendor-specific fields */}
          {formData.role === 'vendor' && (
            <>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">Company Name</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <MdBusiness style={{ color: '#1B4B36', fontSize: '20px' }} />
                  </div>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className={`input input-bordered w-full pl-10 ${
                      validationErrors.companyName ? 'input-error' : ''
                    }`}
                    placeholder="Your Company Name"
                  />
                </div>
                {validationErrors.companyName && (
                  <label className="label">
                    <span className="label-text-alt text-error">{validationErrors.companyName}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">Company Description (Optional)</span>
                </label>
                <textarea
                  name="companyDescription"
                  value={formData.companyDescription}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full"
                  placeholder="Brief description of your company"
                  rows="2"
                ></textarea>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
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
                  placeholder="••••••••"
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
            </div>

            {/* Confirm Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-700">Confirm Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <MdLock style={{ color: '#1B4B36', fontSize: '20px' }} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input input-bordered w-full pl-10 pr-10 ${
                    validationErrors.confirmPassword ? 'input-error' : ''
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <MdVisibilityOff style={{ color: '#666', fontSize: '20px' }} />
                  ) : (
                    <MdVisibility style={{ color: '#666', fontSize: '20px' }} />
                  )}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <label className="label">
                  <span className="label-text-alt text-error">{validationErrors.confirmPassword}</span>
                </label>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || (formData.role === 'vendor' && emailVerificationStatus !== 'verified')}
            className="btn w-full bg-[#1B4B36] hover:bg-[#2d7a56] text-[#FCDE70] border-none text-lg font-semibold mt-4 disabled:bg-gray-400 disabled:text-gray-200"
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner"></span>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-4 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-[#1B4B36] hover:text-[#2d7a56] font-semibold"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
    </div>
  );
};

export default SignupModal;
