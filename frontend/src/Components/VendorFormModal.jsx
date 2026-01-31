import React, { useState } from "react";
import {
  MdEmail,
  MdLock,
  MdPerson,
  MdPhone,
  MdBusiness,
  MdVisibility,
  MdVisibilityOff,
  MdClose,
  MdDescription,
} from "react-icons/md";

const VendorFormModal = ({ onClose, onSubmit, isLoading, error, success }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    companyName: "",
    companyDescription: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!formData.firstName || formData.firstName.length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    }

    if (!formData.lastName || formData.lastName.length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    }

    if (!formData.phone) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10,15}$/.test(formData.phone)) {
      errors.phone = "Phone number must be 10-15 digits";
    }

    if (!formData.companyName) {
      errors.companyName = "Company name is required";
    }

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    onSubmit(formData);
  };

  // Icon color
  const iconColor = "text-[#1B4B36]";
  const iconHoverColor = "hover:text-[#2a6b4f]";

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl max-h-[90vh] overflow-y-auto relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >
          <MdClose />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-[#1B4B36]">
            Create New Vendor
          </h2>
          <p className="mt-2 text-gray-600">Add a new vendor to the system</p>
        </div>

        {/* Alert Messages */}
        {success && (
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
            <span className="text-green-600 text-sm">{success}</span>
          </div>
        )}

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
            <span className="text-red-600 text-sm">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Information Section */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-[#1B4B36] mb-3">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    First Name *
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <MdPerson style={{ color: "#1B4B36", fontSize: "20px" }} />
                  </div>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    className={`input input-bordered w-full pl-10 ${
                      validationErrors.firstName ? "input-error" : ""
                    }`}
                  />
                </div>
                {validationErrors.firstName && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {validationErrors.firstName}
                    </span>
                  </label>
                )}
              </div>

              {/* Last Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    Last Name *
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <MdPerson style={{ color: "#1B4B36", fontSize: "20px" }} />
                  </div>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    className={`input input-bordered w-full pl-10 ${
                      validationErrors.lastName ? "input-error" : ""
                    }`}
                  />
                </div>
                {validationErrors.lastName && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {validationErrors.lastName}
                    </span>
                  </label>
                )}
              </div>

              {/* Email */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    Email Address *
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <MdEmail style={{ color: "#1B4B36", fontSize: "20px" }} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="vendor@example.com"
                    className={`input input-bordered w-full pl-10 ${
                      validationErrors.email ? "input-error" : ""
                    }`}
                  />
                </div>
                {validationErrors.email && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {validationErrors.email}
                    </span>
                  </label>
                )}
              </div>

              {/* Phone */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    Phone Number *
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <MdPhone style={{ color: "#1B4B36", fontSize: "20px" }} />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="1234567890"
                    className={`input input-bordered w-full pl-10 ${
                      validationErrors.phone ? "input-error" : ""
                    }`}
                  />
                </div>
                {validationErrors.phone && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {validationErrors.phone}
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Company Information Section */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-[#1B4B36] mb-3">
              Company Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {/* Company Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    Company Name *
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <MdBusiness style={{ color: "#1B4B36", fontSize: "20px" }} />
                  </div>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Enter company name"
                    className={`input input-bordered w-full pl-10 ${
                      validationErrors.companyName ? "input-error" : ""
                    }`}
                  />
                </div>
                {validationErrors.companyName && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {validationErrors.companyName}
                    </span>
                  </label>
                )}
              </div>

              {/* Company Description */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    Company Description
                  </span>
                </label>
                <textarea
                  name="companyDescription"
                  value={formData.companyDescription}
                  onChange={handleChange}
                  placeholder="Brief description of the company (optional)"
                  className="textarea textarea-bordered w-full h-24"
                />
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div>
            <h3 className="text-lg font-semibold text-[#1B4B36] mb-3">
              Security
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    Password *
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <MdLock style={{ color: "#1B4B36", fontSize: "20px" }} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 characters"
                    className={`input input-bordered w-full pl-10 pr-10 ${
                      validationErrors.password ? "input-error" : ""
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <MdVisibilityOff style={{ color: "#1B4B36", fontSize: "20px" }} />
                    ) : (
                      <MdVisibility style={{ color: "#1B4B36", fontSize: "20px" }} />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {validationErrors.password}
                    </span>
                  </label>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    Confirm Password *
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <MdLock style={{ color: "#1B4B36", fontSize: "20px" }} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className={`input input-bordered w-full pl-10 pr-10 ${
                      validationErrors.confirmPassword ? "input-error" : ""
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <MdVisibilityOff style={{ color: "#1B4B36", fontSize: "20px" }} />
                    ) : (
                      <MdVisibility style={{ color: "#1B4B36", fontSize: "20px" }} />
                    )}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {validationErrors.confirmPassword}
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline border-gray-300 hover:bg-gray-100"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn bg-[#1B4B36] text-white hover:bg-[#2a6b4f] border-none"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                "Create Vendor"
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
    </div>
  );
};

export default VendorFormModal;
