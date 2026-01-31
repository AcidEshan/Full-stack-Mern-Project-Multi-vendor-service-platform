import React, { useState } from "react";
import { BsArrowRightSquareFill, BsArrowLeftSquareFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import FavoriteButton from './FavoriteButton';

const VendorSectionCards = ({ title, list }) => {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  const visible = list.slice(index, index + 3);

  const next = () => index < list.length - 3 && setIndex(prev => prev + 1);
  const prev = () => index > 0 && setIndex(prev => prev - 1);

  if (!list?.length) return null;

  return (
    <div className="mb-14">

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>

        <div className="flex gap-4 text-xl">
          <button 
            onClick={prev} 
            disabled={index === 0}
            className={`text-[#1B4B36] bg-yellow-500 text-6xl border-3 rounded-xl border-yellow-500 ${index === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <BsArrowLeftSquareFill />
          </button>

          <button 
            onClick={next} 
            disabled={index >= list.length - 3}
            className={`text-[#1B4B36] bg-yellow-500 text-6xl border-3 rounded-xl border-yellow-500 ${index >= list.length - 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <BsArrowRightSquareFill />
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visible.map(vendor => (
          <div 
            key={vendor._id} 
            className="card bg-base-100 hover:shadow-2xl hover:shadow-yellow-500 relative transition-all duration-300 hover:scale-105 cursor-pointer"
            onClick={() => navigate(`/vendors/${vendor._id}`)}
          >
            {/* Favorite Button */}
            <div className="absolute top-3 right-3 z-10">
              <FavoriteButton 
                itemId={vendor._id} 
                itemType="vendor" 
                size="md" 
              />
            </div>

            <figure className="h-48 bg-white overflow-hidden">
              {vendor.coverImage ? (
                <img 
                  className="w-full h-full object-cover" 
                  src={vendor.coverImage} 
                  alt={vendor.companyName}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  {vendor.companyLogo ? (
                    <img 
                      className="w-32 h-32 object-contain" 
                      src={vendor.companyLogo} 
                      alt={vendor.companyName}
                    />
                  ) : (
                    <div className="w-32 h-32 bg-[#1B4B36] rounded-full flex items-center justify-center text-white text-4xl font-bold">
                      {vendor.companyName?.[0]?.toUpperCase() || 'V'}
                    </div>
                  )}
                </div>
              )}
            </figure>

            <div className="card-body">
              <h3 className="card-title text-[#1B4B36]">{vendor.companyName}</h3>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <FaStar 
                      key={i} 
                      className={i < Math.floor(vendor.rating || 0) ? 'text-[#FCDE70]' : 'text-gray-300'} 
                      size={14}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  ({vendor.rating?.toFixed(1) || '0.0'}) • {vendor.totalReviews || 0} reviews
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm line-clamp-2">
                {vendor.description || 'Professional service provider'}
              </p>

              {/* Stats */}
              <div className="flex gap-4 text-xs text-gray-500 mt-2">
                {vendor.yearsInBusiness && (
                  <span>{vendor.yearsInBusiness}+ years</span>
                )}
                {vendor.totalOrders > 0 && (
                  <span>{vendor.totalOrders} orders</span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/vendors/${vendor._id}`);
                }}
                className="btn btn-primary bg-[#1B4B36] border-2 rounded-xl border-yellow-500 text-yellow-500 hover:bg-[#143426] mt-2"
              >
                More Info
              </button>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default VendorSectionCards;
