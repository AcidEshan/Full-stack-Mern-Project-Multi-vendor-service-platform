import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { reviewApi } from '../../api/reviewApi';
import useAuthStore from '../../store/authStore';
import ReviewCard from './ReviewCard';
import RatingStars from './RatingStars';
import Toast from './Toast';

const ReviewSection = ({ serviceId, vendorId, orderId, type = 'service' }) => {
  const { isAuthenticated, user } = useAuthStore();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });
  const [editingReview, setEditingReview] = useState(null);
  const [page, setPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [serviceId, vendorId, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = type === 'service'
        ? await reviewApi.getServiceReviews(serviceId, { page, limit: 5 })
        : await reviewApi.getVendorReviews(vendorId, { page, limit: 5 });
      
      // reviewApi already returns response.data, so response is { success, data, statistics, pagination }
      const reviewsData = response.data || [];
      setReviews(reviewsData);
      setTotalReviews(response.pagination?.total || 0);
      
      console.log('Fetched reviews:', reviewsData); // Debug log
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    // Validate orderId is present for new reviews
    if (!editingReview && !orderId) {
      setToast({ message: 'Order ID is required to submit a review. You can only review completed orders.', type: 'error' });
      return;
    }
    
    // Validate comment length (minimum 10 characters as per backend requirement)
    if (reviewForm.comment.trim().length < 10) {
      setToast({ message: 'Review comment must be at least 10 characters long.', type: 'error' });
      return;
    }
    
    try {
      const reviewData = {
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
      };

      // Add orderId for new reviews (required by backend)
      if (!editingReview && orderId) {
        reviewData.orderId = orderId;
      }

      // Add service or vendor ID based on type
      if (type === 'service' && serviceId) {
        reviewData.service = serviceId;
      }
      if (vendorId) {
        reviewData.vendor = vendorId;
      }

      if (editingReview) {
        await reviewApi.updateReview(editingReview._id, reviewData);
        setToast({ message: 'Review updated successfully!', type: 'success' });
      } else {
        await reviewApi.submitReview(reviewData);
        setToast({ message: 'Review submitted successfully! Thank you for your feedback.', type: 'success' });
      }

      setShowReviewModal(false);
      setReviewForm({ rating: 5, comment: '' });
      setEditingReview(null);
      // Reset to page 1 to show the new review
      setPage(1);
      await fetchReviews();
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to submit review';
      setToast({ message: errorMessage, type: 'error' });
      console.error('Review submission error:', error.response?.data);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setReviewForm({
      rating: review.rating,
      comment: review.comment
    });
    setShowReviewModal(true);
  };

  const handleDeleteReview = async (reviewId) => {
    setReviewToDelete(reviewId);
    setShowDeleteModal(true);
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;
    
    try {
      await reviewApi.deleteReview(reviewToDelete);
      setToast({ message: 'Review deleted successfully!', type: 'success' });
      setShowDeleteModal(false);
      setReviewToDelete(null);
      fetchReviews();
    } catch (error) {
      setToast({ message: 'Failed to delete review. Please try again.', type: 'error' });
      setShowDeleteModal(false);
      setReviewToDelete(null);
    }
  };

  const canUserReview = () => {
    if (!isAuthenticated || !user) return false;
    if (!orderId) return false; // Must have orderId to review
    // Check if user already reviewed - compare with user._id from review
    const userReview = reviews.find(r => {
      const reviewUserId = r.user?._id || r.user;
      return reviewUserId === user._id || reviewUserId === user.id;
    });
    return !userReview;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#1B4B36]">
          Reviews ({totalReviews})
        </h2>
        
        {isAuthenticated && user?.role === 'user' && canUserReview() && (
          <button
            onClick={() => setShowReviewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B4B36] text-white rounded-lg hover:bg-[#2d7a54] transition-colors"
          >
            <FaPlus />
            Write Review
          </button>
        )}
      </div>

      {/* Info message when user cannot review */}
      {isAuthenticated && user?.role === 'user' && !orderId && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 You can write a review after completing an order for this service.
          </p>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="loading loading-spinner loading-lg text-[#1B4B36]"></div>
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No reviews yet. Be the first to review!
        </p>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review._id}
                review={review}
                showActions={user?._id === review.user?._id}
                onEdit={handleEditReview}
                onDelete={handleDeleteReview}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalReviews > 5 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={reviews.length < 5}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-[#1B4B36] mb-4">
              {editingReview ? 'Edit Review' : 'Write a Review'}
            </h3>
            
            <form onSubmit={handleSubmitReview}>
              {/* Rating */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Rating
                </label>
                <RatingStars
                  rating={reviewForm.rating}
                  size="xl"
                  interactive={true}
                  showNumber={false}
                  onRate={(rating) => setReviewForm(prev => ({ ...prev, rating }))}
                />
              </div>

              {/* Comment */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review (minimum 10 characters)
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  rows="4"
                  minLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
                  placeholder="Share your experience... (minimum 10 characters)"
                  required
                />
                <div className="flex justify-between items-center mt-1">
                  <span className={`text-xs ${
                    reviewForm.comment.trim().length < 10 
                      ? 'text-red-500' 
                      : 'text-gray-500'
                  }`}>
                    {reviewForm.comment.trim().length} / 10 characters
                  </span>
                  {reviewForm.comment.trim().length < 10 && reviewForm.comment.length > 0 && (
                    <span className="text-xs text-red-500">
                      Need {10 - reviewForm.comment.trim().length} more characters
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false);
                    setEditingReview(null);
                    setReviewForm({ rating: 5, comment: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewForm.comment.trim().length < 10}
                  className="px-4 py-2 bg-[#1B4B36] text-white rounded-lg hover:bg-[#2d7a54] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingReview ? 'Update' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Review</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this review? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setReviewToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteReview}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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

export default ReviewSection;
