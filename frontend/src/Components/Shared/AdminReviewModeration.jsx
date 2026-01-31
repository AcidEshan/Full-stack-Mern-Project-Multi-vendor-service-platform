import React, { useEffect, useMemo, useState } from 'react';
import { FaEye, FaEyeSlash, FaTrash, FaStar, FaFilter, FaSyncAlt, FaUser } from 'react-icons/fa';
import { reviewApi } from '../../api/reviewApi';
import Toast from './Toast';

const AdminReviewModeration = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [filters, setFilters] = useState({ rating: '', visibility: 'all', search: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchRating = filters.rating ? Number(r.rating) === Number(filters.rating) : true;
      const matchVisibility =
        filters.visibility === 'all'
          ? true
          : filters.visibility === 'hidden'
            ? r.isHidden
            : !r.isHidden;
      const matchSearch = filters.search
        ? (r.comment || '').toLowerCase().includes(filters.search.toLowerCase()) ||
          (r.user?.firstName || '').toLowerCase().includes(filters.search.toLowerCase()) ||
          (r.vendor?.companyName || '').toLowerCase().includes(filters.search.toLowerCase())
        : true;
      return matchRating && matchVisibility && matchSearch;
    });
  }, [reviews, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reviewRes, statsRes] = await Promise.all([
        reviewApi.getAllReviews({}),
        reviewApi.getReviewStatistics().catch(() => ({ data: null })),
      ]);
      setReviews(reviewRes?.data?.reviews || reviewRes?.reviews || []);
      setStats(statsRes?.data || statsRes || null);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load reviews' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (reviewId, isHidden) => {
    try {
      setActionLoading(true);
      await reviewApi.toggleReviewVisibility(reviewId, !isHidden);
      setToast({ type: 'success', message: isHidden ? 'Review unhidden' : 'Review hidden' });
      await fetchData();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to update visibility' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      setActionLoading(true);
      await reviewApi.deleteReviewAdmin(reviewId);
      setToast({ type: 'success', message: 'Review deleted' });
      await fetchData();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to delete review' });
    } finally {
      setActionLoading(false);
    }
  };

  const ratingStars = (rating = 0) => (
    <div className="flex items-center gap-1 text-yellow-500">
      {Array.from({ length: 5 }).map((_, idx) => (
        <FaStar key={idx} className={idx < rating ? 'opacity-100' : 'opacity-30'} />
      ))}
    </div>
  );

  const renderStats = () => {
    if (!stats) return null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Reviews</p>
          <p className="text-2xl font-bold text-gray-800">{stats.totalReviews || 0}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Average Rating</p>
          <p className="text-2xl font-bold text-[#1B4B36]">{Number(stats.averageRating || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Hidden Reviews</p>
          <p className="text-2xl font-bold text-red-500">{stats.hiddenReviews || 0}</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg text-[#1B4B36]"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Review Moderation</h2>
          <p className="text-sm text-gray-600">Approve, hide, or remove reviews platform-wide.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
            <FaFilter className="text-gray-500" />
            <select
              value={filters.rating}
              onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
              className="bg-transparent outline-none text-sm"
            >
              <option value="">All ratings</option>
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </select>
          </div>
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
            <FaEye className="text-gray-500" />
            <select
              value={filters.visibility}
              onChange={(e) => setFilters(prev => ({ ...prev, visibility: e.target.value }))}
              className="bg-transparent outline-none text-sm"
            >
              <option value="all">All</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Search by user, vendor, or text"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="input input-bordered w-64 max-w-full"
          />
          <button
            onClick={fetchData}
            className="btn bg-[#1B4B36] text-white hover:bg-[#2d7a54]"
            disabled={loading}
          >
            <FaSyncAlt /> Refresh
          </button>
        </div>
      </div>

      {renderStats()}

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Reviewer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Target</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Rating</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Comment</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Visibility</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredReviews.map((review) => (
              <tr key={review._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 rounded-full p-2 text-gray-600">
                      <FaUser />
                    </span>
                    <div>
                      <p className="font-semibold">{review.user?.firstName} {review.user?.lastName}</p>
                      <p className="text-xs text-gray-500">{review.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <p className="font-semibold">{review.vendor?.companyName || review.service?.name || 'Listing'}</p>
                  {review.service && (
                    <p className="text-xs text-gray-500">Service</p>
                  )}
                </td>
                <td className="px-4 py-3">{ratingStars(review.rating)}</td>
                <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{review.comment || '—'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleVisibility(review._id, review.isHidden)}
                    className="btn btn-xs gap-2 border"
                    disabled={actionLoading}
                  >
                    {review.isHidden ? <FaEyeSlash className="text-gray-500" /> : <FaEye className="text-green-600" />}
                    {review.isHidden ? 'Hidden' : 'Visible'}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-sm flex gap-3">
                  <button
                    onClick={() => setSelectedReview(review)}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(review._id)}
                    className="text-red-600 hover:underline flex items-center gap-1"
                    disabled={actionLoading}
                  >
                    <FaTrash /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredReviews.length === 0 && (
          <div className="text-center text-gray-500 py-6">No reviews found for the selected filters.</div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Review by {selectedReview.user?.firstName}</p>
                <h3 className="text-xl font-bold text-gray-900">{selectedReview.vendor?.companyName || selectedReview.service?.name}</h3>
              </div>
              <button onClick={() => setSelectedReview(null)} className="text-gray-500 hover:text-gray-700">
                <FaEyeSlash />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                {ratingStars(selectedReview.rating)}
                <span className="text-sm text-gray-600">{new Date(selectedReview.createdAt).toLocaleString()}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Comment</p>
                <p className="text-gray-800">{selectedReview.comment || 'No comment provided.'}</p>
              </div>
              {selectedReview.response && (
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Vendor Response</p>
                  <p className="text-gray-800">{selectedReview.response}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => handleToggleVisibility(selectedReview._id, selectedReview.isHidden)}
                  className="btn border"
                  disabled={actionLoading}
                >
                  {selectedReview.isHidden ? <FaEye /> : <FaEyeSlash />} {selectedReview.isHidden ? 'Unhide' : 'Hide'}
                </button>
                <button
                  onClick={() => handleDelete(selectedReview._id)}
                  className="btn btn-error text-white"
                  disabled={actionLoading}
                >
                  <FaTrash /> Delete
                </button>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="btn btn-ghost"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default AdminReviewModeration;
