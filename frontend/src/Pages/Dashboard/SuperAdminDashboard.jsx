import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaUserShield, FaSignOutAlt } from 'react-icons/fa';
import useAuthStore from '../../store/authStore';
import { authApi } from '../../api/authApi';
import { userApi } from '../../api/userApi';
import AdminFormModal from '../../Components/AdminFormModal';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Check current user role
    console.log('=== SUPER ADMIN DASHBOARD ===');
    console.log('Current User:', user);
    console.log('User Role:', user?.role);
    console.log('Is Super Admin?', user?.role === 'super_admin');
    console.log('LocalStorage Auth:', localStorage.getItem('auth-storage'));
    
    if (user?.role !== 'super_admin') {
      console.error('❌ ACCESS DENIED: User role is', user?.role, 'but needs to be super_admin');
    }
    
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await userApi.getAllUsers({ role: 'admin' });
      setAdmins(response.data.users || []);
    } catch (err) {
      setError('Failed to fetch admins');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const openCreateModal = () => {
    setEditingAdmin(null);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAdmin(null);
    setError('');
    setSuccess('');
  };

  const handleFormSubmit = async (formData) => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (editingAdmin) {
        // Update admin
        await userApi.updateUser(editingAdmin._id, formData);
        setSuccess('Admin updated successfully');
      } else {
        // Create admin
        await authApi.createAdmin(formData);
        setSuccess('Admin created successfully');
      }
      await fetchAdmins();
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;

    setIsLoading(true);
    try {
      await userApi.deleteUser(adminId);
      setSuccess('Admin deleted successfully');
      await fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete admin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBlock = async (adminId, isBlocked) => {
    setIsLoading(true);
    try {
      await userApi.toggleBlockUser(adminId, !isBlocked);
      setSuccess(`Admin ${!isBlocked ? 'blocked' : 'unblocked'} successfully`);
      await fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B4B36] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FaUserShield />
                Super Admin Dashboard
              </h1>
              <p className="text-[#FCDE70] mt-1">
                Welcome back, {user?.firstName} {user?.lastName}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="btn bg-[#FCDE70] text-[#1B4B36] border-none hover:bg-yellow-400"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
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
            <span className="text-green-600">{success}</span>
            <button onClick={() => setSuccess('')} className="btn btn-sm btn-ghost">×</button>
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
            <span className="text-red-600">{error}</span>
            <button onClick={() => setError('')} className="btn btn-sm btn-ghost">×</button>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#1B4B36]">Admin Management</h2>
            <button
              onClick={openCreateModal}
              className="btn bg-[#1B4B36] text-[#FCDE70] border-none hover:bg-[#2d7a56]"
            >
              <FaPlus />
              Create Admin
            </button>
          </div>
        </div>

        {/* Admins Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading && !showModal ? (
            <div className="flex justify-center items-center p-12">
              <span className="loading loading-spinner loading-lg text-[#1B4B36]"></span>
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center p-12 text-gray-500">
              <p className="text-lg">No admins found</p>
              <p className="mt-2">Create your first admin to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead className="bg-[#1B4B36] text-[#FCDE70]">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin._id}>
                      <td className="font-semibold">
                        {admin.firstName} {admin.lastName}
                      </td>
                      <td>{admin.email}</td>
                      <td>{admin.phone}</td>
                      <td>
                        <span
                          className={`badge ${
                            admin.isBlocked
                              ? 'badge-error'
                              : admin.isActive
                              ? 'badge-success'
                              : 'badge-warning'
                          }`}
                        >
                          {admin.isBlocked ? 'Blocked' : admin.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(admin)}
                            className="btn btn-sm btn-info text-white"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleToggleBlock(admin._id, admin.isBlocked)}
                            className={`btn btn-sm ${
                              admin.isBlocked ? 'btn-success' : 'btn-warning'
                            } text-white`}
                            title={admin.isBlocked ? 'Unblock' : 'Block'}
                          >
                            {admin.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                          <button
                            onClick={() => handleDelete(admin._id)}
                            className="btn btn-sm btn-error text-white"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <AdminFormModal
          onClose={closeModal}
          onSubmit={handleFormSubmit}
          editingAdmin={editingAdmin}
          isLoading={isLoading}
          error={error}
          success={success}
        />
      )}
    </div>
  );
};

export default SuperAdminDashboard;
