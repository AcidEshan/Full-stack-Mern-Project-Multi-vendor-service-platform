import React, { useState } from 'react';
import { FaTag, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { couponApi } from '../../api/couponApi';

const CouponInput = ({ orderAmount, serviceId = null, onCouponApplied, onCouponRemoved }) => {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [error, setError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showAvailable, setShowAvailable] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await couponApi.validateCoupon({
        code: couponCode.trim().toUpperCase(),
        orderAmount,
        serviceId
      });

      const couponData = response.data?.coupon || response.data;
      setAppliedCoupon(couponData);
      
      // Notify parent component
      if (onCouponApplied) {
        onCouponApplied(couponData);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setError('');
    if (onCouponRemoved) {
      onCouponRemoved();
    }
  };

  const fetchAvailableCoupons = async () => {
    try {
      const response = await couponApi.getAvailableCoupons();
      setAvailableCoupons(response.data?.coupons || []);
      setShowAvailable(true);
    } catch (error) {
      console.error('Error fetching available coupons:', error);
    }
  };

  const handleSelectCoupon = (code) => {
    setCouponCode(code);
    setShowAvailable(false);
    // Auto-apply the selected coupon
    setTimeout(() => handleApplyCoupon(), 100);
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.discountType === 'percentage') {
      const discount = (orderAmount * appliedCoupon.discountValue) / 100;
      return appliedCoupon.maxDiscount ? Math.min(discount, appliedCoupon.maxDiscount) : discount;
    } else if (appliedCoupon.discountType === 'fixed') {
      return Math.min(appliedCoupon.discountValue, orderAmount);
    }
    return 0;
  };

  const discountAmount = calculateDiscount();
  const finalAmount = Math.max(0, orderAmount - discountAmount);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <FaTag className="text-[#1B4B36]" />
        Apply Coupon
      </h3>

      {!appliedCoupon ? (
        <>
          {/* Coupon Input */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent uppercase"
              disabled={loading}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={loading || !couponCode.trim()}
              className="px-6 py-2 bg-[#1B4B36] text-white rounded-lg hover:bg-[#2d7a54] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Applying...
                </>
              ) : (
                'Apply'
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm mb-3">
              <FaTimes />
              {error}
            </div>
          )}

          {/* Available Coupons */}
          <button
            onClick={fetchAvailableCoupons}
            className="text-sm text-[#1B4B36] hover:underline"
          >
            View available coupons
          </button>

          {showAvailable && (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              {availableCoupons.length === 0 ? (
                <p className="text-gray-500 text-sm">No coupons available</p>
              ) : (
                availableCoupons.map((coupon) => (
                  <div
                    key={coupon._id}
                    onClick={() => handleSelectCoupon(coupon.code)}
                    className="p-3 border border-gray-200 rounded-lg hover:border-[#1B4B36] cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-[#1B4B36]">{coupon.code}</p>
                        <p className="text-sm text-gray-600 mt-1">{coupon.description}</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {coupon.discountType === 'percentage' 
                          ? `${coupon.discountValue}% OFF` 
                          : `$${coupon.discountValue} OFF`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Applied Coupon Display */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <FaCheck className="text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">{appliedCoupon.code}</p>
                  <p className="text-sm text-gray-600">{appliedCoupon.description}</p>
                </div>
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="text-red-600 hover:text-red-800"
                title="Remove coupon"
              >
                <FaTimes />
              </button>
            </div>

            {/* Discount Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Original Amount:</span>
                <span>${orderAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Discount ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `$${appliedCoupon.discountValue}`}):</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-[#1B4B36] pt-2 border-t">
                <span>Final Amount:</span>
                <span>${finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CouponInput;
