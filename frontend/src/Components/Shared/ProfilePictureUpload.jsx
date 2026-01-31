import React, { useState, useRef, useEffect } from 'react';
import { FaCamera, FaTrash, FaUser } from 'react-icons/fa';
import { getFileUrl } from '../../api/uploadApi';

const ProfilePictureUpload = ({ 
  currentImage, 
  onUpload, 
  onRemove, 
  loading = false,
  size = 'large',
  userName = 'User'
}) => {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const fileInputRef = useRef(null);

  // Update preview when currentImage changes
  useEffect(() => {
    if (currentImage) {
      // If it's a fileId, convert to URL
      const imageUrl = getFileUrl(currentImage);
      setPreview(imageUrl);
    } else {
      setPreview(null);
    }
  }, [currentImage]);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
    xlarge: 'w-40 h-40'
  };

  const iconSizes = {
    small: 'text-2xl',
    medium: 'text-3xl',
    large: 'text-4xl',
    xlarge: 'text-5xl'
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError(`Image size is ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 5MB.`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      setUploading(true);
      await onUpload(file);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to upload image');
      setPreview(currentImage); // Revert preview on error
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setShowRemoveModal(true);
  };

  const confirmRemove = async () => {
    try {
      setUploading(true);
      setShowRemoveModal(false);
      await onRemove();
      setPreview(null);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to remove image');
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Profile Picture Circle */}
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center`}>
          {preview ? (
            <img
              src={preview}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#1B4B36] text-white">
              <span className={`font-bold ${iconSizes[size]}`}>
                {getInitials(userName)}
              </span>
            </div>
          )}
        </div>

        {/* Upload Button Overlay */}
        {!uploading && !loading && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-[#1B4B36] hover:bg-[#2d7a56] text-white rounded-full p-2 shadow-lg transition-all"
            title="Change profile picture"
          >
            <FaCamera className="text-lg" />
          </button>
        )}

        {/* Loading Spinner */}
        {(uploading || loading) && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <span className="loading loading-spinner loading-md text-white"></span>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-sm bg-[#1B4B36] text-white hover:bg-[#2d7a56] border-none"
          disabled={uploading || loading}
        >
          <FaCamera />
          {preview ? 'Change' : 'Upload'}
        </button>
        
        {preview && (
          <button
            onClick={handleRemove}
            className="btn btn-sm btn-outline btn-error"
            disabled={uploading || loading}
          >
            <FaTrash />
            Remove
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error alert-sm bg-red-50 border border-red-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-red-600 shrink-0 h-5 w-5"
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
          <span className="text-red-600 text-xs">{error}</span>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500 text-center max-w-xs">
        Accepted formats: JPG, PNG, GIF. Max size: 5MB.
        <br />
        Recommended: Square image, at least 400x400px
      </p>

      {/* Remove Confirmation Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Remove Profile Picture</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove your profile picture? You can always upload a new one later.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRemoveModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemove}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePictureUpload;
