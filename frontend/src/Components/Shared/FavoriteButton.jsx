import React, { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { favoritesApi } from '../../api/favoritesApi';
import useAuthStore from '../../store/authStore';

const FavoriteButton = ({ itemId, itemType = 'service', onToggle = null, size = 'md' }) => {
  const { isAuthenticated, user, accessToken } = useAuthStore();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const sizes = {
    sm: 'text-lg p-1.5',
    md: 'text-xl p-2',
    lg: 'text-2xl p-3'
  };

  // Check if item is in favorites
  useEffect(() => {
    // Only users (not vendors/admins) can favorite; avoid hitting API when not allowed
    // Skip when not logged in, token missing, or role is not customer
    if (!itemId || !isAuthenticated || !accessToken || user?.role !== 'user') {
      setIsFavorite(false);
      return;
    }
    checkFavoriteStatus();
  }, [itemId, isAuthenticated, accessToken, user?.role]);

  const checkFavoriteStatus = async () => {
    try {
      const response = itemType === 'service'
        ? await favoritesApi.checkServiceInFavorites(itemId)
        : await favoritesApi.checkVendorInFavorites(itemId);
      setIsFavorite(response.data?.isFavorite || false);
    } catch (error) {
      // Any failure => treat as not favorite and stay quiet to avoid console spam
      setIsFavorite(false);
    }
  };

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      alert('Please login to add favorites');
      return;
    }

    if (user?.role !== 'user') {
      alert('Only customer accounts can favorite items');
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        // Remove from favorites
        if (itemType === 'service') {
          await favoritesApi.removeServiceFromFavorites(itemId);
        } else {
          await favoritesApi.removeVendorFromFavorites(itemId);
        }
        setIsFavorite(false);
      } else {
        // Add to favorites
        if (itemType === 'service') {
          await favoritesApi.addServiceToFavorites(itemId);
        } else {
          await favoritesApi.addVendorToFavorites(itemId);
        }
        setIsFavorite(true);
      }
      
      if (onToggle) {
        onToggle(!isFavorite);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert(error.response?.data?.error?.message || 'Failed to update favorites');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`${sizes[size]} bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 ${
        isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
      ) : isFavorite ? (
        <FaHeart className="animate-scale" />
      ) : (
        <FaRegHeart />
      )}
    </button>
  );
};

export default FavoriteButton;
