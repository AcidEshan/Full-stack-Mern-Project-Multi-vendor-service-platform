import React from "react";
import { useNavigate } from "react-router-dom";
import FavoriteButton from './FavoriteButton';
import RatingStars from './RatingStars';

const VendorCard = ({ vendorId, image, name, service, shortDescription, rating = 0 }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-[#1B4B36] border-3 border-yellow-500 shadow-lg rounded-2xl overflow-hidden flex flex-col h-full relative">
      
      {/* Favorite Button */}
      <div className="absolute top-2 left-2 z-10">
        <FavoriteButton itemId={vendorId} itemType="vendor" size="md" />
      </div>
      
      {/* Image */}
      <div className="bg-white p-5">
        <div className="h-44 w-full flex items-center justify-center rounded-lg overflow-hidden">
          <img
            src={image}
            alt={name}
            className="max-h-full max-w-full object-contain"
            onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow gap-4">
        <h3 className="text-xl font-semibold text-yellow-500">{name}</h3>

        <p className="text-2xl font-bold text-yellow-500 mt-1">
          {service}
        </p>

        {/* Rating */}
        {rating > 0 && (
          <div className="mt-2">
            <RatingStars rating={rating} size="sm" showNumber={true} />
          </div>
        )}

        <p className="text-xl text-gray-100 mt-3 leading-relaxed">
          {shortDescription}
        </p>

        {/* Button */}
        <div className="mt-auto pt-4">
          <button
            onClick={() => navigate(`/vendors/${vendorId}`)}
            className="w-full text-lg py-2 border-2 rounded-lg bg-[#1B4B36] text-yellow-500 font-medium hover:bg-yellow-500 hover:text-[#1B4B36] transition cursor-pointer"
          >
            More Info
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorCard;
