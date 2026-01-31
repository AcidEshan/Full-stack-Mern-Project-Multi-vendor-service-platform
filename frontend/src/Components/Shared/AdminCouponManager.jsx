import React, { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaPercent, FaMoneyBillWave, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { couponApi } from '../../api/couponApi';
import Toast from './Toast';

const AdminCouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 10,
    maxDiscountAmount: '',
    minOrderAmount: '',
    usageLimit: 0,
    userUsageLimit: 1,
    startDate: '',
    endDate: '',
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        couponApi.getAllCoupons(),
        couponApi.getCouponStatistics().catch(() => ({ data: null })),
      ]);
      setCoupons(listRes.data.coupons || []);
      setStats(statsRes?.data || null);
    } catch (err) {
      setToast({ message: 'Failed to load coupons', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setForm({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: 10,
      maxDiscountAmount: '',
      minOrderAmount: '',
      usageLimit: 0,
      userUsageLimit: 1,
      startDate: '',
      endDate: '',
      isActive: true,
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code || '',
      name: coupon.name || '',
      description: coupon.description || '',
      type: coupon.type || 'percentage',
      value: coupon.value || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || '',
      minOrderAmount: coupon.minOrderAmount || '',
      usageLimit: coupon.usageLimit || 0,
      userUsageLimit: coupon.userUsageLimit || 1,
      startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : '',
      endDate: coupon.endDate ? coupon.endDate.slice(0, 10) : '',
      isActive: coupon.isActive ?? true,
    });
    setShowModal(true);
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await couponApi.deleteCoupon(couponId);
      setToast({ message: 'Coupon deleted', type: 'success' });
      await loadData();
    } catch (err) {
      setToast({ message: 'Failed to delete coupon', type: 'error' });
    }
  };

  const handleToggle = async (couponId) => {
    try {
      await couponApi.toggleCouponStatus(couponId);
      await loadData();
    } catch (err) {
      setToast({ message: 'Failed to toggle status', type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Build payload with required fields
      const payload = {
        code: form.code,
        name: form.name,
        type: form.type,
        value: Number(form.value),
        startDate: form.startDate,
        endDate: form.endDate,
      };

      // Add optional fields only if they have valid values
      if (form.description && form.description.trim()) {
        payload.description = form.description.trim();
      }
      
      if (form.maxDiscountAmount && Number(form.maxDiscountAmount) > 0) {
        payload.maxDiscountAmount = Number(form.maxDiscountAmount);
      }
      
      if (form.minOrderAmount && Number(form.minOrderAmount) > 0) {
        payload.minOrderAmount = Number(form.minOrderAmount);
      }
      
      if (form.usageLimit && Number(form.usageLimit) > 0) {
        payload.usageLimit = Number(form.usageLimit);
      }
      
      if (form.userUsageLimit && Number(form.userUsageLimit) > 0) {
        payload.userUsageLimit = Number(form.userUsageLimit);
      }
      
      if (form.isActive !== undefined) {
        payload.isActive = form.isActive;
      }

      if (editingCoupon) {
        await couponApi.updateCoupon(editingCoupon._id, payload);
        setToast({ message: 'Coupon updated', type: 'success' });
      } else {
        await couponApi.createCoupon(payload);
        setToast({ message: 'Coupon created', type: 'success' });
      }
      setShowModal(false);
      resetForm();
      await loadData();
    } catch (err) {
      setToast({ message: err.response?.data?.error?.message || 'Failed to save coupon', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const renderStats = () => {
    if (!stats) return null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Coupons</p>
          <p className="text-2xl font-bold text-gray-800">{stats.totalCoupons || 0}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Active Coupons</p>
          <p className="text-2xl font-bold text-green-600">{stats.activeCoupons || 0}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Savings</p>
          <p className="text-2xl font-bold text-[#1B4B36]">৳{(stats.totalSavings || 0).toLocaleString()}</p>
        </div>
      </div>
    );
  };

  const badge = (type) => {
    if (type === 'percentage') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          <FaPercent size={12} />
          Percentage
        </span>
      );
    } else if (type === 'fixed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
          <FaMoneyBillWave size={12} />
          Fixed
        </span>
      );
    } else if (type === 'free_delivery') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          <FaCheckCircle size={12} />
          Free Delivery
        </span>
      );
    }
    return <span>{type}</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="loading loading-spinner loading-lg text-[#1B4B36]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Coupon Management</h2>
          <p className="text-sm text-gray-600">Create, edit, and manage all coupons.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="btn bg-[#1B4B36] text-white hover:bg-[#2d7a54]"
        >
          <FaPlus /> New Coupon
        </button>
      </div>

      {renderStats()}

      {/* Coupons Table */}
      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Value</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Limits</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Validity</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {coupons.map((coupon) => (
              <tr key={coupon._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-800">{coupon.code}</div>
                  <div className="text-xs text-gray-500">{coupon.name}</div>
                </td>
                <td className="px-4 py-3">{badge(coupon.type)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {coupon.type === 'percentage'
                    ? `${coupon.value}%` + (coupon.maxDiscountAmount ? ` (max ৳${coupon.maxDiscountAmount})` : '')
                    : coupon.type === 'fixed'
                    ? `৳${coupon.value}`
                    : 'Free Delivery'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 space-y-1">
                  <div>Usage: {coupon.usageCount || 0}/{coupon.usageLimit || '∞'}</div>
                  <div>Per User: {coupon.userUsageLimit || '∞'}</div>
                  <div>Min Order: {coupon.minOrderAmount ? `৳${coupon.minOrderAmount}` : 'None'}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <div>Start: {coupon.startDate ? new Date(coupon.startDate).toLocaleDateString() : 'Any'}</div>
                  <div>End: {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString() : 'No expiry'}</div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(coupon._id)}
                    className="flex items-center gap-1 text-sm font-semibold"
                  >
                    {coupon.isActive ? (
                      <span className="text-green-600"><FaToggleOn /> Active</span>
                    ) : (
                      <span className="text-gray-500"><FaToggleOff /> Inactive</span>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 flex gap-3 text-sm">
                  <button
                    onClick={() => handleEdit(coupon)}
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(coupon._id)}
                    className="text-red-600 hover:underline flex items-center gap-1"
                  >
                    <FaTrash /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && (
          <div className="text-center text-gray-500 py-6">No coupons found</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Code *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1B4B36]"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1B4B36]"
                    required
                    placeholder="e.g., 20% Off Discount"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1B4B36]"
                  placeholder="e.g., Get 20% off on all services"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Discount Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1B4B36]"
                    required
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="free_delivery">Free Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Discount Value *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.value}
                    onChange={(e) => setForm(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1B4B36]"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Max Discount (optional)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.maxDiscountAmount}
                    onChange={(e) => setForm(prev => ({ ...prev, maxDiscountAmount: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1B4B36]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Min Order Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm(prev => ({ ...prev, minOrderAmount: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1B4B36]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Usage Limit (0 = unlimited)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.usageLimit}
                    onChange={(e) => setForm(prev => ({ ...prev, usageLimit: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1B4B36]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Per User Limit</label>
                  <input
                    type="number"
                    min="0"
                    value={form.userUsageLimit}
                    onChange={(e) => setForm(prev => ({ ...prev, userUsageLimit: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1B4B36]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Start Date *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1B4B36]"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">End Date *</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1B4B36]"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-[#1B4B36] border-gray-300 rounded focus:ring-[#1B4B36]"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn bg-[#1B4B36] text-white hover:bg-[#2d7a54] disabled:opacity-50"
                >
                  <FaCheckCircle /> {saving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AdminCouponManager;
