import React from 'react';
import { FaExclamationTriangle, FaEnvelope, FaPhone, FaSignOutAlt } from 'react-icons/fa';

const VendorDeactivationBanner = ({ vendor, showContactModal, onLogout }) => {
  if (!vendor || vendor.isActive !== false) {
    return null;
  }

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-md">
      <div className="flex items-start">
        <div className="shrink-0">
          <FaExclamationTriangle className="h-6 w-6 text-red-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-1">
            🚫 Account Deactivated - Access Restricted
          </h3>
          <p className="text-sm text-red-700 mb-2">
            <strong>Your vendor account has been deactivated.</strong> You should not have access to this system. 
            If you are seeing this page, please log out immediately and contact support. All operations are blocked until reactivation.
          </p>
          <p className="text-sm text-red-700 mb-3">
            Please contact our support team to resolve this issue and restore your account access.
          </p>
          {vendor.deactivationReason && (
            <div className="bg-red-100 p-2 rounded mb-3">
              <p className="text-sm text-red-800">
                <strong>Reason:</strong> {vendor.deactivationReason}
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
            >
              <FaSignOutAlt />
              Logout Now
            </button>
            <button
              onClick={showContactModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <FaEnvelope />
              Contact Support
            </button>
            <a
              href="mailto:support@example.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
            >
              <FaEnvelope />
              support@example.com
            </a>
            <a
              href="tel:+1234567890"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
            >
              <FaPhone />
              +1-234-567-8900
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDeactivationBanner;
