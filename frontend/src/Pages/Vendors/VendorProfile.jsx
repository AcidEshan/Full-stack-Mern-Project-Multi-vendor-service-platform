import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { vendorApi } from "../../api/vendorApi";
import { FaCheck, FaTimes } from 'react-icons/fa';

const VendorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchVendorDetails = async () => {
      try {
        setLoading(true);
        const response = await vendorApi.getVendorById(id);
        setVendor(response.data.vendor);
      } catch (err) {
        console.error('Error fetching vendor:', err);
        setError(err.response?.data?.error?.message || 'Failed to fetch vendor details');
      } finally {
        setLoading(false);
      }
    };

    fetchVendorDetails();
  }, [id]);

  if (loading) return <div className="container mx-auto py-10 flex justify-center items-center min-h-screen">
    <span className="loading loading-spinner loading-lg text-[#1B4B36]"></span>
  </div>;
  
  if (error || !vendor) return <div className="container mx-auto py-10">
    <div className="alert alert-error">
      <span>{error || 'Vendor not found'}</span>
    </div>
  </div>;

  return (
    <div className="container mx-auto py-10">
      <div className="bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-3xl font-bold text-[#1B4B36]">
          {vendor.companyName}
        </h2>

        <div className="mt-4 space-y-2">
          <p className="text-lg">
            <span className="font-semibold">Description:</span> {vendor.description || 'No description available'}
          </p>
          
          <p className="text-lg">
            <span className="font-semibold">Status:</span>{' '}
            <span className={`badge ${
              vendor.approvalStatus === 'approved' ? 'badge-success' :
              vendor.approvalStatus === 'rejected' ? 'badge-error' :
              'badge-warning'
            }`}>
              {vendor.approvalStatus}
            </span>
          </p>
          
          <p className="text-lg">
            <span className="font-semibold">Active:</span>{' '}
            <span className={`badge ${vendor.isActive ? 'badge-success' : 'badge-error'}`}>
              {vendor.isActive ? 'Yes' : 'No'}
            </span>
          </p>
          
          <p className="text-lg">
            <span className="font-semibold">Email Verified:</span>{' '}
            <span className={`badge ${vendor.userId?.isEmailVerified ? 'badge-success' : 'badge-warning'}`}>
              {vendor.userId?.isEmailVerified ? 'Verified' : 'Not Verified'}
            </span>
          </p>
        </div>

        {vendor.userId && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold text-[#1B4B36] mb-3">Contact Information</h3>
            <div className="space-y-1">
              <p><span className="font-semibold">Name:</span> {vendor.userId.firstName} {vendor.userId.lastName}</p>
              <p><span className="font-semibold">Email:</span> {vendor.userId.email}</p>
              <p><span className="font-semibold">Phone:</span> {vendor.userId.phone}</p>
            </div>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-500">
          <p>Created: {new Date(vendor.createdAt).toLocaleDateString()}</p>
          <p>Last Updated: {new Date(vendor.updatedAt).toLocaleDateString()}</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="alert alert-success mt-4">
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="alert alert-error mt-4">
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3 flex-wrap">
          {vendor.approvalStatus === 'pending' && (
            <>
              <button
                onClick={async () => {
                  if (!window.confirm('Are you sure you want to approve this vendor?')) return;
                  setActionLoading(true);
                  setError('');
                  setSuccess('');
                  try {
                    await vendorApi.approveVendor(vendor._id);
                    setSuccess('Vendor approved successfully');
                    // Refresh vendor data
                    const response = await vendorApi.getVendorById(id);
                    setVendor(response.data.vendor);
                  } catch (err) {
                    setError(err.response?.data?.error?.message || 'Failed to approve vendor');
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading}
                className="btn bg-green-600 hover:bg-green-700 text-white"
              >
                <FaCheck /> Approve Vendor
              </button>
              
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="btn bg-red-600 hover:bg-red-700 text-white"
              >
                <FaTimes /> Reject Vendor
              </button>
            </>
          )}
          
          <button 
            onClick={() => window.history.back()}
            className="btn bg-[#1B4B36] hover:bg-[#2a6b4f] text-[#FCDE70]"
          >
            Go Back
          </button>
        </div>

      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-[#1B4B36]">Reject Vendor</h3>
            <p className="py-2 text-gray-600">Please provide a reason for rejection:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="textarea textarea-bordered w-full mt-2"
              placeholder="Enter rejection reason..."
              rows="4"
            />
            <div className="modal-action">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="btn"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!rejectReason.trim()) {
                    setError('Please provide a rejection reason');
                    return;
                  }
                  setActionLoading(true);
                  setError('');
                  setSuccess('');
                  try {
                    await vendorApi.rejectVendor(vendor._id, rejectReason);
                    setSuccess('Vendor rejected successfully');
                    setShowRejectModal(false);
                    setRejectReason('');
                    // Refresh vendor data
                    const response = await vendorApi.getVendorById(id);
                    setVendor(response.data.vendor);
                  } catch (err) {
                    setError(err.response?.data?.error?.message || 'Failed to reject vendor');
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading}
                className="btn btn-error text-white"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorProfile;
