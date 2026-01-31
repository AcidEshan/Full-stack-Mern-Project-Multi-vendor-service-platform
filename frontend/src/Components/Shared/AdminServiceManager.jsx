import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaEye, FaTrash, FaBan, FaCheckCircle, FaFilter, FaSearch } from 'react-icons/fa';
import { serviceApi } from '../../api/serviceApi';
import Toast from './Toast';

const AdminServiceManager = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    category: 'all',
    vendor: 'all'
  });

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    blocked: 0
  });

  useEffect(() => {
    fetchServices();
  }, [filters]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const queryFilters = {};
      
      if (filters.status !== 'all') {
        queryFilters.approvalStatus = filters.status;
      }
      if (filters.search) {
        queryFilters.search = filters.search;
      }
      if (filters.category !== 'all') {
        queryFilters.category = filters.category;
      }

      const response = await serviceApi.getAllServicesAdmin(queryFilters);
      const servicesList = response.data?.services || [];
      setServices(servicesList);

      // Calculate stats
      setStats({
        total: servicesList.length,
        pending: servicesList.filter(s => s.approvalStatus === 'pending').length,
        approved: servicesList.filter(s => s.approvalStatus === 'approved' && !s.isBlocked).length,
        rejected: servicesList.filter(s => s.approvalStatus === 'rejected').length,
        blocked: servicesList.filter(s => s.isBlocked).length
      });
    } catch (error) {
      console.error('Error fetching services:', error);
      setToast({ message: 'Failed to fetch services', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (serviceId) => {
    if (!window.confirm('Are you sure you want to approve this service?')) return;

    try {
      setActionLoading(true);
      await serviceApi.approveService(serviceId);
      setToast({ message: 'Service approved successfully', type: 'success' });
      fetchServices();
    } catch (error) {
      setToast({ 
        message: error.response?.data?.error?.message || 'Failed to approve service', 
        type: 'error' 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setToast({ message: 'Please provide a rejection reason', type: 'error' });
      return;
    }

    try {
      setActionLoading(true);
      await serviceApi.rejectService(selectedService._id, rejectReason);
      setToast({ message: 'Service rejected successfully', type: 'success' });
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedService(null);
      fetchServices();
    } catch (error) {
      setToast({ 
        message: error.response?.data?.error?.message || 'Failed to reject service', 
        type: 'error' 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!blockReason.trim()) {
      setToast({ message: 'Please provide a blocking reason', type: 'error' });
      return;
    }

    try {
      setActionLoading(true);
      await serviceApi.blockService(selectedService._id, blockReason);
      setToast({ message: 'Service blocked successfully', type: 'success' });
      setShowBlockModal(false);
      setBlockReason('');
      setSelectedService(null);
      fetchServices();
    } catch (error) {
      setToast({ 
        message: error.response?.data?.error?.message || 'Failed to block service', 
        type: 'error' 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblock = async (serviceId) => {
    if (!window.confirm('Are you sure you want to unblock this service?')) return;

    try {
      setActionLoading(true);
      await serviceApi.unblockService(serviceId);
      setToast({ message: 'Service unblocked successfully', type: 'success' });
      fetchServices();
    } catch (error) {
      setToast({ 
        message: error.response?.data?.error?.message || 'Failed to unblock service', 
        type: 'error' 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) return;

    try {
      setActionLoading(true);
      await serviceApi.deleteServiceAdmin(serviceId);
      setToast({ message: 'Service deleted successfully', type: 'success' });
      fetchServices();
    } catch (error) {
      setToast({ 
        message: error.response?.data?.error?.message || 'Failed to delete service', 
        type: 'error' 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (service) => {
    if (service.isBlocked) {
      return <span className="badge badge-error">Blocked</span>;
    }
    
    if (!service.isActive) {
      return <span className="badge badge-ghost">Inactive</span>;
    }
    
    if (!service.isAvailable) {
      return <span className="badge badge-warning">Unavailable</span>;
    }
    
    if (service.approvalStatus === 'pending') {
      return <span className="badge badge-warning">Pending Approval</span>;
    }
    
    if (service.approvalStatus === 'rejected') {
      return <span className="badge badge-error">Rejected</span>;
    }
    
    return <span className="badge badge-success">Active</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="loading loading-spinner loading-lg text-[#1B4B36]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total Services</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">Pending Approval</p>
          <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Rejected</p>
          <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
          <p className="text-sm text-gray-600">Blocked</p>
          <p className="text-2xl font-bold text-gray-900">{stats.blocked}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Search</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name..."
                className="input input-bordered w-full pl-10"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Status</span>
            </label>
            <select
              className="select select-bordered"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <button
              onClick={() => setFilters({ status: 'all', search: '', category: 'all', vendor: 'all' })}
              className="btn btn-outline w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead className="bg-[#1B4B36] text-white">
              <tr>
                <th>Service Name</th>
                <th>Vendor</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    No services found
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service._id}>
                    <td>
                      <div className="font-semibold">{service.name}</div>
                      {service.isBlocked && (
                        <div className="text-xs text-red-600 mt-1">
                          Blocked: {service.blockReason}
                        </div>
                      )}
                    </td>
                    <td>{service.vendorId?.companyName || 'N/A'}</td>
                    <td>{service.categoryId?.name || 'N/A'}</td>
                    <td className="font-semibold">৳{service.price}</td>
                    <td>{getStatusBadge(service)}</td>
                    <td>{new Date(service.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedService(service);
                            setShowDetailModal(true);
                          }}
                          className="btn btn-xs btn-info"
                          title="View Details"
                        >
                          <FaEye />
                        </button>

                        {service.approvalStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(service._id)}
                              className="btn btn-xs btn-success"
                              disabled={actionLoading}
                              title="Approve"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedService(service);
                                setShowRejectModal(true);
                              }}
                              className="btn btn-xs btn-error"
                              disabled={actionLoading}
                              title="Reject"
                            >
                              <FaTimes />
                            </button>
                          </>
                        )}

                        {service.approvalStatus === 'approved' && !service.isBlocked && (
                          <button
                            onClick={() => {
                              setSelectedService(service);
                              setShowBlockModal(true);
                            }}
                            className="btn btn-xs btn-warning"
                            disabled={actionLoading}
                            title="Block"
                          >
                            <FaBan />
                          </button>
                        )}

                        {service.isBlocked && (
                          <button
                            onClick={() => handleUnblock(service._id)}
                            className="btn btn-xs btn-success"
                            disabled={actionLoading}
                            title="Unblock"
                          >
                            <FaCheckCircle />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(service._id)}
                          className="btn btn-xs btn-error"
                          disabled={actionLoading}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedService && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Service Details</h3>
            <div className="space-y-4">
              <div>
                <label className="font-semibold">Name:</label>
                <p>{selectedService.name}</p>
              </div>
              <div>
                <label className="font-semibold">Description:</label>
                <p>{selectedService.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold">Price:</label>
                  <p>৳{selectedService.price}</p>
                </div>
                <div>
                  <label className="font-semibold">Duration:</label>
                  <p>{selectedService.duration} minutes</p>
                </div>
              </div>
              <div>
                <label className="font-semibold">Status:</label>
                <p>{getStatusBadge(selectedService)}</p>
              </div>
              {selectedService.rejectReason && (
                <div className="alert alert-error">
                  <span><strong>Reject Reason:</strong> {selectedService.rejectReason}</span>
                </div>
              )}
            </div>
            <div className="modal-action">
              <button onClick={() => setShowDetailModal(false)} className="btn">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Reject Service</h3>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Rejection Reason</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="Provide a reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="modal-action">
              <button 
                onClick={handleReject} 
                className="btn btn-error"
                disabled={actionLoading}
              >
                {actionLoading ? 'Rejecting...' : 'Reject Service'}
              </button>
              <button 
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }} 
                className="btn"
                disabled={actionLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Block Service</h3>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Blocking Reason</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="Provide a reason for blocking..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
            <div className="modal-action">
              <button 
                onClick={handleBlock} 
                className="btn btn-warning"
                disabled={actionLoading}
              >
                {actionLoading ? 'Blocking...' : 'Block Service'}
              </button>
              <button 
                onClick={() => {
                  setShowBlockModal(false);
                  setBlockReason('');
                }} 
                className="btn"
                disabled={actionLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServiceManager;
