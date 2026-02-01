import { Request, Response, NextFunction } from 'express';
import { Analytics, AnalyticsEventType } from '../models/Analytics';
import User from '../models/User';
import Vendor from '../models/Vendor';
import { Order, OrderStatus } from '../models/Order';
import Service from '../models/Service';
import { Transaction, TransactionStatus } from '../models/Transaction';
import { Review } from '../models/Review';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import Category from '../models/Category';

// ============================================
// Dashboard Overview
// ============================================

export const getDashboardOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // Get all metrics in parallel
    const [
      totalUsers,
      totalVendors,
      totalOrders,
      totalRevenue,
      newUsersCount,
      newVendorsCount,
      newOrdersCount,
      periodRevenue,
      activeOrders,
      completedOrders,
      cancelledOrders,
      averageOrderValue,
      totalReviews,
      averageRating
    ] = await Promise.all([
      // Total counts
      User.countDocuments({ role: 'user', isActive: true }),
      Vendor.countDocuments({ isApproved: true }),
      Order.countDocuments(),
      Transaction.aggregate([
        { $match: { status: TransactionStatus.COMPLETED } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // New in period
      User.countDocuments({ role: 'user', createdAt: { $gte: startDate } }),
      Vendor.countDocuments({ createdAt: { $gte: startDate } }),
      Order.countDocuments({ createdAt: { $gte: startDate } }),
      Transaction.aggregate([
        { 
          $match: { 
            status: TransactionStatus.COMPLETED,
            createdAt: { $gte: startDate }
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // Order statuses
      Order.countDocuments({ status: { $in: [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.IN_PROGRESS] } }),
      Order.countDocuments({ status: OrderStatus.COMPLETED }),
      Order.countDocuments({ status: OrderStatus.CANCELLED }),
      // Average order value
      Order.aggregate([
        { $group: { _id: null, avg: { $avg: '$totalAmount' } } }
      ]),
      // Reviews
      Review.countDocuments(),
      Review.aggregate([
        { $group: { _id: null, avg: { $avg: '$rating' } } }
      ])
    ]);

    // Calculate growth rates
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - Number(days));

    const [prevUsers, prevVendors, prevOrders, prevRevenue] = await Promise.all([
      User.countDocuments({ 
        role: 'user', 
        createdAt: { $gte: previousStartDate, $lt: startDate } 
      }),
      Vendor.countDocuments({ 
        createdAt: { $gte: previousStartDate, $lt: startDate } 
      }),
      Order.countDocuments({ 
        createdAt: { $gte: previousStartDate, $lt: startDate } 
      }),
      Transaction.aggregate([
        { 
          $match: { 
            status: TransactionStatus.COMPLETED,
            createdAt: { $gte: previousStartDate, $lt: startDate }
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalVendors,
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          totalReviews,
          averageRating: averageRating[0]?.avg || 0
        },
        period: {
          days: Number(days),
          newUsers: newUsersCount,
          newVendors: newVendorsCount,
          newOrders: newOrdersCount,
          revenue: periodRevenue[0]?.total || 0,
          averageOrderValue: averageOrderValue[0]?.avg || 0
        },
        orders: {
          active: activeOrders,
          completed: completedOrders,
          cancelled: cancelledOrders
        },
        growth: {
          users: calculateGrowth(newUsersCount, prevUsers),
          vendors: calculateGrowth(newVendorsCount, prevVendors),
          orders: calculateGrowth(newOrdersCount, prevOrders),
          revenue: calculateGrowth(periodRevenue[0]?.total || 0, prevRevenue[0]?.total || 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Revenue Analytics
// ============================================

export const getRevenueAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    let groupByFormat: any;
    switch (groupBy) {
      case 'hour':
        groupByFormat = { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
        break;
      case 'week':
        groupByFormat = { 
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
        groupByFormat = { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default: // day
        groupByFormat = { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }

    const revenueData = await Transaction.aggregate([
      {
        $match: {
          status: TransactionStatus.COMPLETED,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: groupByFormat,
          revenue: { $sum: '$amount' },
          commission: { $sum: '$platformCommission' },
          vendorEarnings: { $sum: '$vendorAmount' },
          transactions: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 }
      }
    ]);

    // Get top vendors by revenue
    const topVendors = await Transaction.aggregate([
      {
        $match: {
          status: TransactionStatus.COMPLETED,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$vendor',
          totalRevenue: { $sum: '$vendorAmount' },
          transactions: { $sum: 1 }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      {
        $unwind: '$vendor'
      },
      {
        $project: {
          vendor: {
            _id: 1,
            businessName: 1,
            contactEmail: 1
          },
          totalRevenue: 1,
          transactions: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        timeline: revenueData,
        topVendors
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// User Analytics
// ============================================

export const getUserAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // User registration trend
    const registrationTrend = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // User activity (users with orders)
    const activeUsers = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user: {
            _id: 1,
            name: 1,
            email: 1
          },
          orderCount: 1,
          totalSpent: 1
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // User demographics
    const [totalActiveUsers, totalInactiveUsers, verifiedUsers, unverifiedUsers] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ isEmailVerified: true }),
      User.countDocuments({ isEmailVerified: false })
    ]);

    res.status(200).json({
      success: true,
      data: {
        registrationTrend,
        topCustomers: activeUsers,
        demographics: {
          totalActive: totalActiveUsers,
          totalInactive: totalInactiveUsers,
          verified: verifiedUsers,
          unverified: unverifiedUsers
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Vendor Analytics Overview (All Vendors)
// ============================================

export const getVendorAnalyticsOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const [
      totalApproved,
      totalPending,
      totalRejected,
      vendorPerformance
    ] = await Promise.all([
      Vendor.countDocuments({ isApproved: true }),
      Vendor.countDocuments({ isApproved: false, rejectionReason: { $exists: false } }),
      Vendor.countDocuments({ rejectionReason: { $exists: true } }),
      Vendor.aggregate([
        {
          $match: { isApproved: true }
        },
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'vendor',
            as: 'orders'
          }
        },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'vendor',
            as: 'reviews'
          }
        },
        {
          $project: {
            businessName: 1,
            contactEmail: 1,
            averageRating: 1,
            totalOrders: { $size: '$orders' },
            totalReviews: { $size: '$reviews' },
            completedOrders: {
              $size: {
                $filter: {
                  input: '$orders',
                  as: 'order',
                  cond: { $eq: ['$$order.status', OrderStatus.COMPLETED] }
                }
              }
            }
          }
        },
        {
          $sort: { totalOrders: -1 }
        },
        {
          $limit: 10
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          approved: totalApproved,
          pending: totalPending,
          rejected: totalRejected
        },
        topVendors: vendorPerformance
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Service Analytics
// ============================================

export const getServiceAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // Popular services
    const popularServices = await Analytics.getPopularServices(10, Number(days));

    // Service by category
    const servicesByCategory = await Service.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          avgRating: { $avg: '$averageRating' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $project: {
          category: {
            _id: 1,
            name: 1
          },
          count: 1,
          avgPrice: 1,
          avgRating: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Top rated services
    const topRatedServices = await Service.find()
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(10)
      .select('name price averageRating totalReviews')
      .populate('vendor', 'businessName')
      .populate('category', 'name');

    res.status(200).json({
      success: true,
      data: {
        popularServices,
        servicesByCategory,
        topRatedServices
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Order Analytics
// ============================================

export const getOrderAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // Order trend
    const orderTrend = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Order status distribution
    const statusDistribution = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Average completion time
    const completionTimes = await Order.aggregate([
      {
        $match: {
          status: OrderStatus.COMPLETED,
          completedAt: { $exists: true }
        }
      },
      {
        $project: {
          completionTime: {
            $divide: [
              { $subtract: ['$completedAt', '$createdAt'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgCompletionTime: { $avg: '$completionTime' },
          minCompletionTime: { $min: '$completionTime' },
          maxCompletionTime: { $max: '$completionTime' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        orderTrend,
        statusDistribution,
        completionTimes: completionTimes[0] || {
          avgCompletionTime: 0,
          minCompletionTime: 0,
          maxCompletionTime: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Search Analytics
// ============================================

export const getSearchAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = 7 } = req.query;

    const popularSearches = await Analytics.getSearchAnalytics(20, Number(days));

    res.status(200).json({
      success: true,
      data: {
        popularSearches
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Vendor Analytics (Admin) with Report Download
// ============================================

export const getVendorAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vendorId, startDate, endDate } = req.query;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID is required'
      });
    }

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const vendorObjectId = new mongoose.Types.ObjectId(vendorId as string);

    // Get vendor details
    const vendor = await Vendor.findById(vendorId).populate('userId', 'firstName lastName email');
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get orders analytics
    const ordersStats = await Order.aggregate([
      {
        $match: {
          vendor: vendorObjectId,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get revenue analytics
    const revenueStats = await Transaction.aggregate([
      {
        $match: {
          vendor: vendorObjectId,
          status: TransactionStatus.COMPLETED,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalCommission: { $sum: '$commissionAmount' },
          totalVendorEarnings: { $sum: '$vendorAmount' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    // Get daily revenue trend
    const dailyRevenue = await Transaction.aggregate([
      {
        $match: {
          vendor: vendorObjectId,
          status: TransactionStatus.COMPLETED,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          vendorEarnings: { $sum: '$vendorAmount' },
          commission: { $sum: '$commissionAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get service performance
    const servicePerformance = await Order.aggregate([
      {
        $match: {
          vendor: vendorObjectId,
          status: OrderStatus.COMPLETED,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$service',
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'serviceDetails'
        }
      },
      { $unwind: '$serviceDetails' },
      {
        $project: {
          serviceName: '$serviceDetails.name',
          bookings: 1,
          revenue: 1,
          averageValue: { $divide: ['$revenue', '$bookings'] }
        }
      },
      { $sort: { bookings: -1 } }
    ]);

    // Get review statistics
    const reviewStats = await Review.aggregate([
      {
        $match: {
          vendor: vendorObjectId,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        vendor: {
          id: vendor._id,
          companyName: vendor.companyName,
          owner: vendor.userId,
          rating: vendor.rating,
          totalOrders: vendor.totalOrders,
          completedOrders: vendor.completedOrders
        },
        period: {
          startDate: start,
          endDate: end
        },
        orders: ordersStats,
        revenue: revenueStats[0] || {
          totalRevenue: 0,
          totalCommission: 0,
          totalVendorEarnings: 0,
          transactionCount: 0
        },
        dailyRevenue,
        servicePerformance,
        reviews: reviewStats[0] || {
          totalReviews: 0,
          averageRating: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const downloadVendorReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vendorId, startDate, endDate, format = 'csv' } = req.query;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID is required'
      });
    }

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const vendorObjectId = new mongoose.Types.ObjectId(vendorId as string);

    // Get vendor details
    const vendor = await Vendor.findById(vendorId).populate('userId', 'firstName lastName email');
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get all orders for the period
    const orders = await Order.find({
      vendor: vendorObjectId,
      createdAt: { $gte: start, $lte: end }
    })
      .populate('service', 'name')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 } as any);

    // Get all transactions
    const transactions = await Transaction.find({
      vendor: vendorObjectId,
      createdAt: { $gte: start, $lte: end }
    })
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 } as any);

    if (format === 'csv') {
      // Generate CSV report
      let csv = 'Vendor Analytics Report\n';
      csv += `Vendor: ${vendor.companyName}\n`;
      csv += `Period: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}\n\n`;
      
      csv += 'Orders Summary\n';
      csv += 'Order Number,Customer,Service,Date,Amount,Status,Payment Status\n';
      orders.forEach(order => {
        csv += `${order.orderNumber},${order.customerName},${(order.service as any)?.name || 'N/A'},${new Date(order.createdAt).toLocaleDateString()},${order.totalAmount},${order.status},${order.paymentStatus}\n`;
      });
      
      csv += '\n\nTransactions Summary\n';
      csv += 'Transaction Number,Order Number,Date,Amount,Commission,Vendor Amount,Status\n';
      transactions.forEach(txn => {
        csv += `${txn.transactionNumber},${(txn.order as any)?.orderNumber || 'N/A'},${new Date(txn.createdAt).toLocaleDateString()},${txn.amount},${txn.commissionAmount},${txn.vendorAmount},${txn.status}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="vendor-report-${vendorId}-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      // Return JSON for PDF generation on frontend
      res.status(200).json({
        success: true,
        data: {
          vendor: {
            companyName: vendor.companyName,
            email: (vendor.userId as any)?.email,
            rating: vendor.rating,
            totalOrders: vendor.totalOrders
          },
          period: {
            startDate: start,
            endDate: end
          },
          orders,
          transactions,
          summary: {
            totalOrders: orders.length,
            totalRevenue: transactions.reduce((sum, t) => t.status === TransactionStatus.COMPLETED ? sum + t.amount : sum, 0),
            totalCommission: transactions.reduce((sum, t) => t.status === TransactionStatus.COMPLETED ? sum + t.commissionAmount : sum, 0),
            totalVendorEarnings: transactions.reduce((sum, t) => t.status === TransactionStatus.COMPLETED ? sum + t.vendorAmount : sum, 0)
          }
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// ============================================
// Track Event (for frontend to call)
// ============================================

export const trackEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventType, relatedService, relatedVendor, relatedCategory, metadata } = req.body;

    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: 'Event type is required'
      });
    }

    const event = await Analytics.trackEvent({
      eventType,
      user: req.user?._id.toString(),
      sessionId: req.headers['x-session-id'] as string,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      relatedService,
      relatedVendor,
      relatedCategory,
      metadata
    });

    res.status(201).json({
      success: true,
      message: 'Event tracked successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Generate Comprehensive Report
// ============================================

export const generateReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      dateFrom,
      dateTo,
      reportTypes = ['summary', 'financial', 'orders', 'users', 'vendors', 'services', 'reviews', 'categories'],
      format = 'json'
    } = req.body;

    // Validate dates
    if (!dateFrom || !dateTo) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'dateFrom and dateTo are required'
        }
      });
      return;
    }

    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format'
        }
      });
      return;
    }

    if (startDate > endDate) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE_RANGE',
          message: 'dateFrom must be before dateTo'
        }
      });
      return;
    }

    // Set endDate to end of day
    endDate.setHours(23, 59, 59, 999);

    const filter = {
      dateFrom: startDate,
      dateTo: endDate,
      reportTypes: Array.isArray(reportTypes) ? reportTypes : [reportTypes]
    };

    // Calculate previous period for comparison
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const prevDateFrom = new Date(startDate);
    prevDateFrom.setDate(prevDateFrom.getDate() - periodDays);
    const prevDateTo = new Date(startDate);

    const dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    const prevDateFilter = { createdAt: { $gte: prevDateFrom, $lt: prevDateTo } };

    const reportData: any = {};

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Summary Report
    if (filter.reportTypes.includes('summary')) {
      const [
        totalOrders,
        prevOrders,
        totalRevenue,
        prevRevenue,
        totalUsers,
        prevUsers,
        totalVendors,
        prevVendors,
        completedOrders,
        avgRating
      ] = await Promise.all([
        Order.countDocuments(dateFilter),
        Order.countDocuments(prevDateFilter),
        Transaction.aggregate([
          { $match: { ...dateFilter, status: TransactionStatus.COMPLETED } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Transaction.aggregate([
          { $match: { ...prevDateFilter, status: TransactionStatus.COMPLETED } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        User.countDocuments({ ...dateFilter, role: 'user' }),
        User.countDocuments({ ...prevDateFilter, role: 'user' }),
        Vendor.countDocuments(dateFilter),
        Vendor.countDocuments(prevDateFilter),
        Order.countDocuments({ ...dateFilter, status: OrderStatus.COMPLETED }),
        Review.aggregate([
          { $match: dateFilter },
          { $group: { _id: null, avg: { $avg: '$rating' } } }
        ])
      ]);

      reportData.summary = {
        totalRevenue: totalRevenue[0]?.total || 0,
        revenueChange: calculateChange(totalRevenue[0]?.total || 0, prevRevenue[0]?.total || 0),
        totalOrders,
        ordersChange: calculateChange(totalOrders, prevOrders),
        activeUsers: totalUsers,
        usersChange: calculateChange(totalUsers, prevUsers),
        activeVendors: totalVendors,
        vendorsChange: calculateChange(totalVendors, prevVendors),
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
        averageRating: avgRating[0]?.avg || 0,
        periodDays
      };
    }

    // Financial Report
    if (filter.reportTypes.includes('financial')) {
      const [
        revenueByMethod,
        platformCommission,
        vendorPayouts,
        paymentsByStatus,
        topServices,
        topVendors,
        refunds
      ] = await Promise.all([
        Transaction.aggregate([
          { $match: { ...dateFilter, status: TransactionStatus.COMPLETED } },
          {
            $group: {
              _id: '$paymentMethod',
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]),
        Transaction.aggregate([
          { $match: { ...dateFilter, status: TransactionStatus.COMPLETED } },
          { $group: { _id: null, total: { $sum: '$platformFee' } } }
        ]),
        Transaction.aggregate([
          { $match: { ...dateFilter, status: TransactionStatus.COMPLETED } },
          { $group: { _id: null, total: { $sum: '$vendorAmount' } } }
        ]),
        Transaction.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: '$status',
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]),
        Order.aggregate([
          { $match: { ...dateFilter, status: OrderStatus.COMPLETED } },
          {
            $group: {
              _id: '$serviceId',
              revenue: { $sum: '$totalAmount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { revenue: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'services',
              localField: '_id',
              foreignField: '_id',
              as: 'service'
            }
          },
          { $unwind: '$service' }
        ]),
        Order.aggregate([
          { $match: { ...dateFilter, status: OrderStatus.COMPLETED } },
          {
            $group: {
              _id: '$vendorId',
              revenue: { $sum: '$totalAmount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { revenue: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'vendors',
              localField: '_id',
              foreignField: '_id',
              as: 'vendor'
            }
          },
          { $unwind: '$vendor' }
        ]),
        Transaction.aggregate([
          { $match: { ...dateFilter, status: TransactionStatus.REFUNDED } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ])
      ]);

      reportData.financial = {
        revenueBreakdown: {
          byMethod: revenueByMethod,
          platformCommission: platformCommission[0]?.total || 0,
          vendorPayouts: vendorPayouts[0]?.total || 0
        },
        paymentStatus: paymentsByStatus,
        topServices: topServices.map((s: any) => ({
          serviceName: s.service.name,
          revenue: s.revenue,
          orders: s.count
        })),
        topVendors: topVendors.map((v: any) => ({
          vendorName: v.vendor.companyName,
          revenue: v.revenue,
          orders: v.count
        })),
        refunds: refunds[0] || { total: 0, count: 0 }
      };
    }

    // Orders Report
    if (filter.reportTypes.includes('orders')) {
      const [ordersByStatus, avgOrderValue, ordersByCategory, dailyOrders] = await Promise.all([
        Order.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalValue: { $sum: '$totalAmount' }
            }
          }
        ]),
        Order.aggregate([
          { $match: dateFilter },
          { $group: { _id: null, avg: { $avg: '$totalAmount' } } }
        ]),
        Order.aggregate([
          { $match: dateFilter },
          {
            $lookup: {
              from: 'services',
              localField: 'serviceId',
              foreignField: '_id',
              as: 'service'
            }
          },
          { $unwind: '$service' },
          {
            $group: {
              _id: '$service.categoryId',
              count: { $sum: 1 },
              revenue: { $sum: '$totalAmount' }
            }
          },
          {
            $lookup: {
              from: 'categories',
              localField: '_id',
              foreignField: '_id',
              as: 'category'
            }
          },
          { $unwind: '$category' }
        ]),
        Order.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
              revenue: { $sum: '$totalAmount' }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      const totalOrders = ordersByStatus.reduce((sum: number, s: any) => sum + s.count, 0);
      const completedCount = ordersByStatus.find((s: any) => s._id === OrderStatus.COMPLETED)?.count || 0;

      reportData.orders = {
        total: totalOrders,
        byStatus: ordersByStatus,
        averageOrderValue: avgOrderValue[0]?.avg || 0,
        completionRate: totalOrders > 0 ? (completedCount / totalOrders) * 100 : 0,
        byCategory: ordersByCategory.map((c: any) => ({
          categoryName: c.category.name,
          orders: c.count,
          revenue: c.revenue
        })),
        dailyTrend: dailyOrders
      };
    }

    // Users Report
    if (filter.reportTypes.includes('users')) {
      const [newUsers, usersByRole, activeUsers, dailyRegistrations] = await Promise.all([
        User.countDocuments(dateFilter),
        User.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ]),
        Order.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$userId', orderCount: { $sum: 1 } } },
          { $count: 'activeUsers' }
        ]),
        User.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      reportData.users = {
        newUsers,
        byRole: usersByRole,
        activeUsers: activeUsers[0]?.activeUsers || 0,
        dailyRegistrations
      };
    }

    // Vendors Report
    if (filter.reportTypes.includes('vendors')) {
      const [newVendors, activeVendors, topVendors, vendorsByStatus] = await Promise.all([
        Vendor.countDocuments(dateFilter),
        Order.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$vendorId' } },
          { $count: 'activeVendors' }
        ]),
        Order.aggregate([
          { $match: { ...dateFilter, status: OrderStatus.COMPLETED } },
          {
            $group: {
              _id: '$vendorId',
              totalOrders: { $sum: 1 },
              totalRevenue: { $sum: '$totalAmount' }
            }
          },
          { $sort: { totalOrders: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'vendors',
              localField: '_id',
              foreignField: '_id',
              as: 'vendor'
            }
          },
          { $unwind: '$vendor' }
        ]),
        Vendor.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$approvalStatus', count: { $sum: 1 } } }
        ])
      ]);

      reportData.vendors = {
        newVendors,
        activeVendors: activeVendors[0]?.activeVendors || 0,
        topVendors: topVendors.map((v: any) => ({
          vendorName: v.vendor.companyName,
          totalOrders: v.totalOrders,
          totalRevenue: v.totalRevenue
        })),
        byStatus: vendorsByStatus
      };
    }

    // Services Report
    if (filter.reportTypes.includes('services')) {
      const [newServices, servicesByStatus, servicesByCategory, topServices] = await Promise.all([
        Service.countDocuments(dateFilter),
        Service.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: { isActive: '$isActive', isAvailable: '$isAvailable' },
              count: { $sum: 1 }
            }
          }
        ]),
        Service.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: '$categoryId',
              count: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: 'categories',
              localField: '_id',
              foreignField: '_id',
              as: 'category'
            }
          },
          { $unwind: '$category' }
        ]),
        Order.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: '$serviceId',
              bookings: { $sum: 1 }
            }
          },
          { $sort: { bookings: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'services',
              localField: '_id',
              foreignField: '_id',
              as: 'service'
            }
          },
          { $unwind: '$service' }
        ])
      ]);

      reportData.services = {
        newServices,
        byStatus: servicesByStatus,
        byCategory: servicesByCategory.map((c: any) => ({
          categoryName: c.category.name,
          count: c.count
        })),
        topServices: topServices.map((s: any) => ({
          serviceName: s.service.name,
          bookings: s.bookings
        }))
      };
    }

    // Reviews Report
    if (filter.reportTypes.includes('reviews')) {
      const [totalReviews, avgRating, ratingDistribution] = await Promise.all([
        Review.countDocuments(dateFilter),
        Review.aggregate([
          { $match: dateFilter },
          { $group: { _id: null, avg: { $avg: '$rating' } } }
        ]),
        Review.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: '$rating',
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: -1 } }
        ])
      ]);

      reportData.reviews = {
        total: totalReviews,
        averageRating: avgRating[0]?.avg || 0,
        distribution: ratingDistribution
      };
    }

    // Categories Report
    if (filter.reportTypes.includes('categories')) {
      const categoryPerformance = await Order.aggregate([
        { $match: dateFilter },
        {
          $lookup: {
            from: 'services',
            localField: 'serviceId',
            foreignField: '_id',
            as: 'service'
          }
        },
        { $unwind: '$service' },
        {
          $group: {
            _id: '$service.categoryId',
            orders: { $sum: 1 },
            revenue: { $sum: '$totalAmount' }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        { $sort: { revenue: -1 } }
      ]);

      reportData.categories = {
        performance: categoryPerformance.map((c: any) => ({
          categoryName: c.category.name,
          orders: c.orders,
          revenue: c.revenue
        }))
      };
    }

    // Format response based on requested format
    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=somadhan-ache-analytics-${Date.now()}.pdf`
      );

      doc.pipe(res);

      // Header
      doc
        .fontSize(24)
        .fillColor('#2563eb')
        .text('Somadhan Ache Analytics', { align: 'center' })
        .moveDown(0.5);

      doc
        .fontSize(12)
        .fillColor('#666')
        .text(
          `Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          { align: 'center' }
        )
        .moveDown(0.3);

      doc
        .fontSize(10)
        .fillColor('#999')
        .text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' })
        .moveDown(2);

      // Helper function to add sections
      const addSection = (title: string, content: () => void) => {
        if (doc.y > 700) doc.addPage();
        doc
          .fontSize(16)
          .fillColor('#1e3a8a')
          .text(title, { underline: true })
          .moveDown(1);
        content();
        doc.moveDown(2);
      };

      // Helper function to add metrics
      const addMetric = (label: string, value: string | number, change?: number) => {
        const y = doc.y;
        doc.fontSize(10).fillColor('#444').text(label + ':', 50, y, { width: 200 });
        doc.fontSize(10).fillColor('#000').text(String(value), 250, y, { width: 200 });

        if (change !== undefined) {
          const changeColor = change >= 0 ? '#10b981' : '#ef4444';
          const changeSymbol = change >= 0 ? '↑' : '↓';
          doc
            .fillColor(changeColor)
            .text(`${changeSymbol} ${Math.abs(change).toFixed(1)}%`, 400, y, { width: 150 });
        }

        doc.moveDown(0.8);
      };

      // Summary Section
      if (reportData.summary) {
        addSection('Executive Summary', () => {
          const { summary } = reportData;
          doc.fontSize(11).fillColor('#000');

          addMetric('Total Revenue', `৳${summary.totalRevenue.toFixed(2)}`, summary.revenueChange);
          addMetric('Total Orders', summary.totalOrders, summary.ordersChange);
          addMetric('Active Users', summary.activeUsers, summary.usersChange);
          addMetric('Active Vendors', summary.activeVendors, summary.vendorsChange);
          addMetric('Completion Rate', `${summary.completionRate.toFixed(1)}%`);
          addMetric('Average Rating', summary.averageRating.toFixed(2) + '★');
        });
      }

      // Financial Section
      if (reportData.financial) {
        addSection('Financial Analytics', () => {
          const { financial } = reportData;

          doc.fontSize(12).fillColor('#1e40af').text('Revenue Breakdown', { underline: true }).moveDown(0.5);
          doc.fontSize(10).fillColor('#000');
          addMetric('Platform Commission', `৳${financial.revenueBreakdown.platformCommission.toFixed(2)}`);
          addMetric('Vendor Payouts', `৳${financial.revenueBreakdown.vendorPayouts.toFixed(2)}`);
          addMetric('Refunds', `৳${financial.refunds.total.toFixed(2)} (${financial.refunds.count} txns)`);

          if (financial.revenueBreakdown.byMethod.length > 0) {
            doc.moveDown(1);
            doc.fontSize(12).fillColor('#1e40af').text('Revenue by Payment Method', { underline: true }).moveDown(0.5);
            doc.fontSize(10).fillColor('#000');
            financial.revenueBreakdown.byMethod.forEach((method: any) => {
              addMetric(method._id || 'Unknown', `৳${method.total.toFixed(2)} (${method.count} txns)`);
            });
          }

          if (financial.topServices.length > 0) {
            doc.moveDown(1);
            doc.fontSize(12).fillColor('#1e40af').text('Top 10 Services by Revenue', { underline: true }).moveDown(0.5);
            doc.fontSize(9).fillColor('#000');
            financial.topServices.forEach((service: any, idx: number) => {
              doc.text(
                `${idx + 1}. ${service.serviceName}: ৳${service.revenue.toFixed(2)} (${service.orders} orders)`
              );
            });
          }

          if (financial.topVendors.length > 0) {
            doc.moveDown(1);
            doc.fontSize(12).fillColor('#1e40af').text('Top 10 Vendors by Revenue', { underline: true }).moveDown(0.5);
            doc.fontSize(9).fillColor('#000');
            financial.topVendors.forEach((vendor: any, idx: number) => {
              doc.text(
                `${idx + 1}. ${vendor.vendorName}: ৳${vendor.revenue.toFixed(2)} (${vendor.orders} orders)`
              );
            });
          }
        });
      }

      // Orders Section
      if (reportData.orders) {
        addSection('Order Analytics', () => {
          const { orders } = reportData;

          addMetric('Total Orders', orders.total);
          addMetric('Average Order Value', `৳${orders.averageOrderValue.toFixed(2)}`);
          addMetric('Completion Rate', `${orders.completionRate.toFixed(1)}%`);

          doc.moveDown(1);
          doc.fontSize(12).fillColor('#1e40af').text('Orders by Status', { underline: true }).moveDown(0.5);
          doc.fontSize(10).fillColor('#000');
          orders.byStatus.forEach((status: any) => {
            const percentage = ((status.count / orders.total) * 100).toFixed(1);
            addMetric(status._id, `${status.count} (${percentage}%)`);
          });

          if (orders.byCategory.length > 0) {
            doc.moveDown(1);
            doc.fontSize(12).fillColor('#1e40af').text('Orders by Category', { underline: true }).moveDown(0.5);
            doc.fontSize(9).fillColor('#000');
            orders.byCategory.forEach((cat: any) => {
              doc.text(`${cat.categoryName}: ${cat.orders} orders, ৳${cat.revenue.toFixed(2)}`);
            });
          }
        });
      }

      // Users Section
      if (reportData.users) {
        addSection('User Analytics', () => {
          const { users } = reportData;

          addMetric('New Users', users.newUsers);
          addMetric('Active Users', users.activeUsers);

          doc.moveDown(1);
          doc.fontSize(12).fillColor('#1e40af').text('Users by Role', { underline: true }).moveDown(0.5);
          doc.fontSize(10).fillColor('#000');
          users.byRole.forEach((role: any) => {
            addMetric(role._id, role.count);
          });
        });
      }

      // Vendors Section
      if (reportData.vendors) {
        addSection('Vendor Analytics', () => {
          const { vendors } = reportData;

          addMetric('New Vendors', vendors.newVendors);
          addMetric('Active Vendors', vendors.activeVendors);

          if (vendors.topVendors.length > 0) {
            doc.moveDown(1);
            doc.fontSize(12).fillColor('#1e40af').text('Top 10 Vendors', { underline: true }).moveDown(0.5);
            doc.fontSize(9).fillColor('#000');
            vendors.topVendors.forEach((vendor: any, idx: number) => {
              doc.text(
                `${idx + 1}. ${vendor.vendorName}: ${vendor.totalOrders} orders, ৳${vendor.totalRevenue.toFixed(2)}`
              );
            });
          }

          if (vendors.byStatus.length > 0) {
            doc.moveDown(1);
            doc.fontSize(12).fillColor('#1e40af').text('Vendors by Status', { underline: true }).moveDown(0.5);
            doc.fontSize(10).fillColor('#000');
            vendors.byStatus.forEach((status: any) => {
              addMetric(status._id, status.count);
            });
          }
        });
      }

      // Services Section
      if (reportData.services) {
        addSection('Service Analytics', () => {
          const { services } = reportData;

          addMetric('New Services', services.newServices);

          if (services.topServices.length > 0) {
            doc.moveDown(1);
            doc.fontSize(12).fillColor('#1e40af').text('Top 10 Most Booked Services', { underline: true }).moveDown(0.5);
            doc.fontSize(9).fillColor('#000');
            services.topServices.forEach((service: any, idx: number) => {
              doc.text(`${idx + 1}. ${service.serviceName}: ${service.bookings} bookings`);
            });
          }

          if (services.byCategory.length > 0) {
            doc.moveDown(1);
            doc.fontSize(12).fillColor('#1e40af').text('Services by Category', { underline: true }).moveDown(0.5);
            doc.fontSize(9).fillColor('#000');
            services.byCategory.forEach((cat: any) => {
              doc.text(`${cat.categoryName}: ${cat.count} services`);
            });
          }
        });
      }

      // Reviews Section
      if (reportData.reviews) {
        addSection('Review Analytics', () => {
          const { reviews } = reportData;

          addMetric('Total Reviews', reviews.total);
          addMetric('Average Rating', reviews.averageRating.toFixed(2) + '★');

          doc.moveDown(1);
          doc.fontSize(12).fillColor('#1e40af').text('Rating Distribution', { underline: true }).moveDown(0.5);
          doc.fontSize(10).fillColor('#000');
          reviews.distribution.forEach((rating: any) => {
            const percentage = ((rating.count / reviews.total) * 100).toFixed(1);
            addMetric(`${rating._id}★`, `${rating.count} (${percentage}%)`);
          });
        });
      }

      // Categories Section
      if (reportData.categories) {
        addSection('Category Performance', () => {
          const { categories } = reportData;

          if (categories.performance.length > 0) {
            doc.fontSize(12).fillColor('#1e40af').text('Orders & Revenue by Category', { underline: true }).moveDown(0.5);
            doc.fontSize(9).fillColor('#000');
            categories.performance.forEach((category: any) => {
              doc.text(
                `${category.categoryName}: ${category.orders} orders, ৳${category.revenue.toFixed(2)}`
              );
            });
          }
        });
      }

      // Footer
      doc
        .moveDown(2)
        .fontSize(8)
        .fillColor('#999')
        .text(
          '© Somadhan Ache - All Rights Reserved',
          { align: 'center' }
        );

      doc.end();
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report-${Date.now()}.csv`);

      let csv = `Report Generated: ${new Date().toISOString()}\n`;
      csv += `Period: ${startDate.toISOString()} to ${endDate.toISOString()}\n\n`;

      // Summary
      if (reportData.summary) {
        csv += 'EXECUTIVE SUMMARY\n';
        csv += 'Metric,Value,Change %\n';
        csv += `Total Revenue,${reportData.summary.totalRevenue.toFixed(2)},${reportData.summary.revenueChange.toFixed(1)}%\n`;
        csv += `Total Orders,${reportData.summary.totalOrders},${reportData.summary.ordersChange.toFixed(1)}%\n`;
        csv += `Active Users,${reportData.summary.activeUsers},${reportData.summary.usersChange.toFixed(1)}%\n`;
        csv += `Active Vendors,${reportData.summary.activeVendors},${reportData.summary.vendorsChange.toFixed(1)}%\n\n`;
      }

      res.send(csv);
    } else if (format === 'json') {
      res.status(200).json({
        success: true,
        data: {
          reportMetadata: {
            generatedAt: new Date().toISOString(),
            dateFrom: startDate.toISOString(),
            dateTo: endDate.toISOString(),
            reportTypes: filter.reportTypes
          },
          report: reportData
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: 'Supported formats: json, csv, pdf'
        }
      });
    }
  } catch (error) {
    next(error);
  }
};
