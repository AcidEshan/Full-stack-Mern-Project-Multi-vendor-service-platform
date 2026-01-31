import React, { useEffect, useMemo, useState } from 'react';
import { FaChartPie, FaUsers, FaShoppingCart, FaMoneyBillWave, FaStar, FaSyncAlt } from 'react-icons/fa';
import { orderApi } from '../../api/orderApi';
import { reviewApi } from '../../api/reviewApi';
import { couponApi } from '../../api/couponApi';
import Toast from './Toast';
import ReportGenerator from './ReportGenerator';

const AdminAnalytics = () => {
  const [orders, setOrders] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [couponStats, setCouponStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [orderRes, reviewRes, couponRes] = await Promise.all([
        orderApi.getAllOrders(),
        reviewApi.getReviewStatistics().catch(() => ({ data: null })),
        couponApi.getCouponStatistics().catch(() => ({ data: null })),
      ]);
      setOrders(orderRes?.data || orderRes?.orders || []);
      setReviewStats(reviewRes?.data || reviewRes || null);
      setCouponStats(couponRes?.data || couponRes || null);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load analytics' });
    } finally {
      setLoading(false);
    }
  };

  const aggregates = useMemo(() => {
    if (!orders.length) {
      return {
        totalOrders: 0,
        platformRevenue: 0,
        transactionVolume: 0,
        vendorEarnings: 0,
        avgPlatformFee: 0,
        statusCounts: {},
      };
    }
    
    // Filter paid orders
    const paidOrders = orders.filter(o => 
      o.paymentStatus === 'paid' || 
      o.paymentStatus === 'completed' || 
      o.paymentStatus === 'success'
    );
    
    // Calculate platform revenue (sum of platformFee from paid orders)
    const platformRevenue = paidOrders.reduce((sum, o) => sum + (o.platformFee || 0), 0);
    
    // Calculate total transaction volume (sum of totalAmount from paid orders)
    const transactionVolume = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    // Calculate vendor earnings (transaction volume minus platform fees)
    const vendorEarnings = transactionVolume - platformRevenue;
    
    // Status counts for all orders
    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalOrders: orders.length,
      platformRevenue,
      transactionVolume,
      vendorEarnings,
      avgPlatformFee: paidOrders.length > 0 ? platformRevenue / paidOrders.length : 0,
      statusCounts,
    };
  }, [orders]);

  const barWidth = (value, max) => {
    if (max === 0) return '0%';
    const pct = Math.round((value / max) * 100);
    return `${Math.max(5, pct)}%`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <span className="loading loading-spinner loading-lg text-[#1B4B36]"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-sm text-gray-600">Platform health overview across orders, reviews, and coupons.</p>
        </div>
        <button
          onClick={loadData}
          className="btn bg-[#1B4B36] text-white hover:bg-[#2d7a54]"
        >
          <FaSyncAlt /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Orders</p>
          <div className="flex items-center gap-2 mt-2">
            <FaShoppingCart className="text-[#1B4B36]" />
            <p className="text-2xl font-bold">{aggregates.totalOrders}</p>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Platform Revenue</p>
          <p className="text-xs text-gray-400 mt-1">Your earnings</p>
          <div className="flex items-center gap-2 mt-2">
            <FaMoneyBillWave className="text-green-600" />
            <p className="text-2xl font-bold text-green-600">৳{aggregates.platformRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Transaction Volume</p>
          <p className="text-xs text-gray-400 mt-1">Total processed</p>
          <div className="flex items-center gap-2 mt-2">
            <FaChartPie className="text-blue-600" />
            <p className="text-2xl font-bold text-blue-600">৳{aggregates.transactionVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Average Rating</p>
          <div className="flex items-center gap-2 mt-2">
            <FaStar className="text-yellow-500" />
            <p className="text-2xl font-bold">{Number(reviewStats?.averageRating || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Additional Revenue Breakdown */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Revenue Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Vendor Earnings</p>
            <p className="text-xl font-bold text-gray-700">৳{aggregates.vendorEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Avg Platform Fee/Order</p>
            <p className="text-xl font-bold text-gray-700">৳{aggregates.avgPlatformFee.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Platform Fee (After Tax) %</p>
            <p className="text-xl font-bold text-gray-700">
              {aggregates.transactionVolume > 0 
                ? ((aggregates.platformRevenue / aggregates.transactionVolume) * 100).toFixed(2) 
                : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Status distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Order Status Breakdown</h3>
            <FaShoppingCart className="text-gray-400" />
          </div>
          <div className="space-y-3">
            {Object.keys(aggregates.statusCounts).length === 0 && (
              <p className="text-gray-500 text-sm">No orders yet.</p>
            )}
            {Object.entries(aggregates.statusCounts).map(([status, count]) => (
              <div key={status} className="space-y-1">
                <div className="flex justify-between text-sm text-gray-700">
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                  <span>{count}</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full">
                  <div
                    className="h-2 rounded-full bg-[#1B4B36]"
                    style={{ width: barWidth(count, Math.max(...Object.values(aggregates.statusCounts))) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Coupon Performance</h3>
            <FaUsers className="text-gray-400" />
          </div>
          {couponStats ? (
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between"><span>Total Coupons</span><span>{couponStats.totalCoupons || 0}</span></div>
              <div className="flex justify-between"><span>Active Coupons</span><span>{couponStats.activeCoupons || 0}</span></div>
              <div className="flex justify-between"><span>Total Savings</span><span>৳{(couponStats.totalSavings || 0).toLocaleString()}</span></div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Coupon statistics not available.</p>
          )}
        </div>
      </div>

      {/* Reviews snapshot */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Reviews Snapshot</h3>
          <FaStar className="text-gray-400" />
        </div>
        {reviewStats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
            <div className="p-3 rounded-lg bg-gray-50">
              <p className="text-gray-500">Total Reviews</p>
              <p className="text-xl font-bold">{reviewStats.totalReviews || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50">
              <p className="text-gray-500">Average Rating</p>
              <p className="text-xl font-bold">{Number(reviewStats.averageRating || 0).toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50">
              <p className="text-gray-500">Hidden Reviews</p>
              <p className="text-xl font-bold text-red-500">{reviewStats.hiddenReviews || 0}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Review stats not available.</p>
        )}
      </div>

      {/* Report Generator Section */}
      <ReportGenerator />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminAnalytics;
