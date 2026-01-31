import React, { useEffect, useMemo, useState } from 'react';
import { FaClock, FaSyncAlt, FaSearch, FaCheckCircle, FaTimesCircle, FaTruck, FaListUl } from 'react-icons/fa';
import { orderApi } from '../../api/orderApi';
import Toast from './Toast';

const STATUS_FLOW = ['pending', 'accepted', 'in_progress', 'completed'];

const AdminOrderTracker = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', query: '' });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getAllOrders();
      setOrders(res?.data || res?.orders || []);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load orders' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const matchStatus = filters.status === 'all' ? true : order.status === filters.status;
      const matchQuery = filters.query
        ? `${order._id}${order.vendor?.companyName || ''}${order.user?.firstName || ''}${order.user?.lastName || ''}`
            .toLowerCase()
            .includes(filters.query.toLowerCase())
        : true;
      return matchStatus && matchQuery;
    });
  }, [orders, filters]);

  const statusBadge = (status) => {
    const map = {
      pending: 'badge-warning',
      accepted: 'badge-info',
      in_progress: 'badge-accent',
      completed: 'badge-success',
      cancelled: 'badge-error',
      rejected: 'badge-ghost'
    };
    return <span className={`badge ${map[status] || 'badge-ghost'}`}>{status?.replace('_', ' ')}</span>;
  };

  const renderTimeline = (order) => {
    const currentIdx = STATUS_FLOW.indexOf(order.status);
    return (
      <div className="flex flex-col gap-3">
        {STATUS_FLOW.map((step, idx) => {
          const isDone = currentIdx >= idx;
          const isCurrent = currentIdx === idx;
          return (
            <div key={step} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isDone ? 'bg-[#1B4B36] text-white' : 'bg-white text-gray-400'}`}>
                {isDone ? <FaCheckCircle /> : <FaClock />}
              </div>
              <div className="flex-1">
                <p className="font-semibold capitalize">{step.replace('_', ' ')}</p>
                <p className="text-sm text-gray-500">
                  {isCurrent ? 'Current status' : isDone ? 'Completed' : 'Pending'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <span className="loading loading-spinner loading-lg text-[#1B4B36]"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Tracking</h2>
          <p className="text-sm text-gray-600">Monitor order statuses and drill into timelines.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
            <FaListUl className="text-gray-500" />
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="bg-transparent outline-none text-sm"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
            <FaSearch className="text-gray-500" />
            <input
              type="text"
              placeholder="Search by ID, vendor, customer"
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              className="bg-transparent outline-none text-sm w-64 max-w-full"
            />
          </div>
          <button
            onClick={fetchOrders}
            className="btn bg-[#1B4B36] text-white hover:bg-[#2d7a54]"
          >
            <FaSyncAlt /> Refresh
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Order</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Vendor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Scheduled</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Total</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-semibold text-gray-800">#{order._id?.slice(-8)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{order.user?.firstName} {order.user?.lastName}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{order.vendor?.companyName || 'Vendor'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{order.scheduledDate ? new Date(order.scheduledDate).toLocaleString() : '—'}</td>
                <td className="px-4 py-3 text-sm font-semibold text-[#1B4B36]">৳{order.totalAmount?.toFixed(2) || '0.00'}</td>
                <td className="px-4 py-3">{statusBadge(order.status)}</td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="btn btn-xs bg-[#1B4B36] text-white hover:bg-[#2d7a54]"
                  >
                    <FaTruck /> Track
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-6">No orders found for the selected filters.</div>
        )}
      </div>

      {/* Timeline Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Order #{selectedOrder._id?.slice(-8)}</p>
                <h3 className="text-xl font-bold text-gray-900">{selectedOrder.vendor?.companyName}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700">
                <FaTimesCircle />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Timeline</h4>
                {renderTimeline(selectedOrder)}
              </div>
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Summary</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between"><span>Status</span><span className="capitalize">{selectedOrder.status?.replace('_', ' ')}</span></div>
                  <div className="flex justify-between"><span>Payment</span><span className="capitalize">{selectedOrder.paymentStatus || '—'}</span></div>
                  <div className="flex justify-between"><span>Scheduled</span><span>{selectedOrder.scheduledDate ? new Date(selectedOrder.scheduledDate).toLocaleString() : '—'}</span></div>
                  <div className="flex justify-between"><span>Total</span><span>৳{selectedOrder.totalAmount?.toFixed(2) || '0.00'}</span></div>
                  {selectedOrder.address && (
                    <div className="flex justify-between">
                      <span>Location</span>
                      <span className="text-right max-w-[200px]">
                        {typeof selectedOrder.address === 'string' 
                          ? selectedOrder.address 
                          : `${selectedOrder.address.street}, ${selectedOrder.address.city !== 'N/A' ? selectedOrder.address.city : ''} ${selectedOrder.address.country}`}
                      </span>
                    </div>
                  )}
                  {selectedOrder.notes && (
                    <div className="pt-2">
                      <p className="text-xs text-gray-500">Notes</p>
                      <p>{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminOrderTracker;
