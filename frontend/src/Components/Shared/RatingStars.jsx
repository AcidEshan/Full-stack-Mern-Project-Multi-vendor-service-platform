import React from 'react';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';

const RatingStars = ({ rating = 0, maxRating = 5, size = 'md', showNumber = true, onRate = null, interactive = false }) => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span
          key={`full-${i}`}
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={() => interactive && onRate && onRate(i + 1)}
        >
          <FaStar className="text-yellow-400" />
        </span>
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <span
          key="half"
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={() => interactive && onRate && onRate(fullStars + 1)}
        >
          <FaStarHalfAlt className="text-yellow-400" />
        </span>
      );
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span
          key={`empty-${i}`}
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={() => interactive && onRate && onRate(fullStars + (hasHalfStar ? 1 : 0) + i + 1)}
        >
          <FaRegStar className="text-gray-300" />
        </span>
      );
    }

    return stars;
  };

  return (
    <div className={`flex items-center gap-1 ${sizes[size]}`}>
      {renderStars()}
      {showNumber && (
        <span className="ml-1 text-gray-600 font-medium">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
