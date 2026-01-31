import React from 'react';
import RatingStars from './RatingStars';
import { FaReply, FaEdit, FaTrash } from 'react-icons/fa';

const ReviewCard = ({ 
  review, 
  onRespond = null, 
  onEdit = null, 
  onDelete = null,
  showResponse = true,
  showActions = false 
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1B4B36] text-white rounded-full flex items-center justify-center font-semibold">
            {review.user?.firstName?.[0]}{review.user?.lastName?.[0]}
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">
              {review.user?.firstName} {review.user?.lastName}
            </h4>
            <div className="flex items-center gap-2">
              <RatingStars rating={review.rating} size="sm" showNumber={false} />
              <span className="text-xs text-gray-500">
                {formatDate(review.createdAt)}
              </span>
            </div>
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(review)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Edit Review"
              >
                <FaEdit />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(review._id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Delete Review"
              >
                <FaTrash />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Review Content */}
      <p className="text-gray-700 mb-3">{review.comment}</p>

      {/* Vendor Response */}
      {showResponse && review.vendorResponse && (
        <div className="mt-3 bg-gray-50 border-l-4 border-[#1B4B36] p-3 rounded">
          <div className="flex items-center gap-2 mb-2">
            <FaReply className="text-[#1B4B36]" />
            <span className="font-semibold text-gray-700">Vendor Response</span>
          </div>
          <p className="text-gray-600 text-sm">{review.vendorResponse.response}</p>
          <span className="text-xs text-gray-500 mt-1 block">
            {formatDate(review.vendorResponse.respondedAt)}
          </span>
        </div>
      )}

      {/* Respond Button for Vendor */}
      {onRespond && !review.vendorResponse && (
        <button
          onClick={() => onRespond(review)}
          className="mt-3 flex items-center gap-2 text-[#1B4B36] hover:text-[#2d7a54] font-medium text-sm"
        >
          <FaReply />
          Respond to Review
        </button>
      )}

      {/* Hidden Badge */}
      {review.isHidden && (
        <div className="mt-3">
          <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
            Hidden by Admin
          </span>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
