import React, { useEffect, useState } from 'react';
import { FaBell, FaTrash, FaCheck, FaSyncAlt, FaSlidersH } from 'react-icons/fa';
import { notificationApi } from '../../api/notificationApi';
import Toast from './Toast';

const UserNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({ status: 'all' });
  const [preferences, setPreferences] = useState({});

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [filters.status]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getMyNotifications({ status: filters.status });
      setNotifications(res.data?.notifications || res.notifications || []);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load notifications' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await notificationApi.getPreferences();
      setPreferences(res.data || res || {});
    } catch (err) {
      // ignore silently
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setToast({ type: 'success', message: 'All notifications marked as read' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to mark all as read' });
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to mark as read' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to delete notification' });
    }
  };

  const handleSavePrefs = async () => {
    try {
      setPrefsLoading(true);
      await notificationApi.updatePreferences(preferences);
      setToast({ type: 'success', message: 'Preferences saved' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to save preferences' });
    } finally {
      setPrefsLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FaBell className="text-[#1B4B36]" /> Notifications
          </h2>
          <p className="text-sm text-gray-600">Stay on top of orders, payments, and messages.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="select select-bordered select-sm"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <button
            onClick={fetchNotifications}
            className="btn btn-sm bg-[#1B4B36] text-white hover:bg-[#2d7a54]"
          >
            <FaSyncAlt /> Refresh
          </button>
          <button
            onClick={handleMarkAll}
            className="btn btn-sm btn-outline border-[#1B4B36] text-[#1B4B36]"
          >
            <FaCheck /> Mark all read
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border rounded-lg">
          {loading ? (
            <div className="flex justify-center py-10">
              <span className="loading loading-spinner loading-lg text-[#1B4B36]"></span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <FaBell className="mx-auto text-4xl mb-3 text-gray-300" />
              <p>No notifications</p>
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => (
                <li key={n._id} className={`p-4 ${n.isRead ? 'bg-white' : 'bg-blue-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{n.type === 'payment' ? '💳' : n.type === 'order' ? '📦' : n.type === 'message' ? '💬' : '🔔'}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${n.isRead ? 'text-gray-800' : 'font-semibold text-gray-900'}`}>{n.title}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkRead(n._id)}
                          className="btn btn-xs btn-outline border-blue-500 text-blue-600"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(n._id)}
                        className="btn btn-xs btn-ghost text-red-600"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 text-gray-800 font-semibold">
            <FaSlidersH /> Preferences
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            {['order', 'payment', 'message', 'system'].map((key) => (
              <label key={key} className="flex items-center justify-between">
                <span className="capitalize">{key} alerts</span>
                <input
                  type="checkbox"
                  checked={preferences?.[key] ?? true}
                  onChange={(e) => setPreferences(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="toggle toggle-sm toggle-success"
                />
              </label>
            ))}
            <label className="flex items-center justify-between">
              <span>Email notifications</span>
              <input
                type="checkbox"
                checked={preferences?.email ?? true}
                onChange={(e) => setPreferences(prev => ({ ...prev, email: e.target.checked }))}
                className="toggle toggle-sm toggle-success"
              />
            </label>
          </div>
          <button
            onClick={handleSavePrefs}
            disabled={prefsLoading}
            className="btn w-full bg-[#1B4B36] text-white hover:bg-[#2d7a54]"
          >
            {prefsLoading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default UserNotifications;
