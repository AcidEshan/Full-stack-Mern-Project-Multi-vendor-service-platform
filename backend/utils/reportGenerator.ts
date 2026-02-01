import { Transaction, TransactionStatus } from '../models/Transaction';
import { Order, OrderStatus } from '../models/Order';
import User from '../models/User';
import Vendor from '../models/Vendor';
import { Review } from '../models/Review';
import Service from '../models/Service';

export interface RevenueReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalRevenue: number;
    platformCommission: number;
    vendorEarnings: number;
    totalTransactions: number;
    averageTransactionValue: number;
  };
  breakdown: {
    successful: number;
    refunded: number;
    pending: number;
  };
  topVendors: Array<{
    vendor: any;
    revenue: number;
    transactions: number;
  }>;
}

export interface UserReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    retentionRate: number;
  };
  engagement: {
    usersWithOrders: number;
    averageOrdersPerUser: number;
    averageSpendPerUser: number;
  };
}

export interface VendorReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalVendors: number;
    activeVendors: number;
    newVendors: number;
    averageRating: number;
  };
  performance: Array<{
    vendor: any;
    orders: number;
    revenue: number;
    rating: number;
    completionRate: number;
  }>;
}

export interface OrderReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    pendingOrders: number;
    averageOrderValue: number;
    completionRate: number;
    cancellationRate: number;
  };
  timeline: Array<{
    date: Date;
    orders: number;
    revenue: number;
  }>;
}

// Generate revenue report
export const generateRevenueReport = async (
  startDate: Date,
  endDate: Date
): Promise<RevenueReport> => {
  const transactions = await Transaction.find({
    createdAt: { $gte: startDate, $lte: endDate }
  });

  const successful = transactions.filter(t => t.status === TransactionStatus.COMPLETED);
  const refunded = transactions.filter(t => t.status === TransactionStatus.REFUNDED);
  const pending = transactions.filter(t => t.status === TransactionStatus.PENDING);

  const totalRevenue = successful.reduce((sum, t) => sum + t.amount, 0);
  const platformCommission = successful.reduce((sum, t) => sum + ((t as any).platformCommission || 0), 0);
  const vendorEarnings = successful.reduce((sum, t) => sum + t.vendorAmount, 0);

  // Top vendors
  const topVendors = await Transaction.aggregate([
    {
      $match: {
        status: TransactionStatus.COMPLETED,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$vendor',
        revenue: { $sum: '$vendorAmount' },
        transactions: { $sum: 1 }
      }
    },
    {
      $sort: { revenue: -1 }
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
    }
  ]);

  return {
    period: { startDate, endDate },
    summary: {
      totalRevenue,
      platformCommission,
      vendorEarnings,
      totalTransactions: successful.length,
      averageTransactionValue: successful.length > 0 ? totalRevenue / successful.length : 0
    },
    breakdown: {
      successful: successful.length,
      refunded: refunded.length,
      pending: pending.length
    },
    topVendors: topVendors.map(v => ({
      vendor: v.vendor,
      revenue: v.revenue,
      transactions: v.transactions
    }))
  };
};

// Generate user report
export const generateUserReport = async (
  startDate: Date,
  endDate: Date
): Promise<UserReport> => {
  const [
    totalUsers,
    newUsers,
    verifiedUsers,
    usersWithOrders,
    orderStats
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ 
      role: 'user',
      createdAt: { $gte: startDate, $lte: endDate } 
    }),
    User.countDocuments({ 
      role: 'user',
      isEmailVerified: true 
    }),
    Order.distinct('user', {
      createdAt: { $gte: startDate, $lte: endDate }
    }),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
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
        $group: {
          _id: null,
          avgOrders: { $avg: '$orderCount' },
          avgSpent: { $avg: '$totalSpent' },
          totalUsers: { $sum: 1 }
        }
      }
    ])
  ]);

  const activeUsers = usersWithOrders.length;
  const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

  return {
    period: { startDate, endDate },
    summary: {
      totalUsers,
      newUsers,
      activeUsers,
      verifiedUsers,
      retentionRate
    },
    engagement: {
      usersWithOrders: activeUsers,
      averageOrdersPerUser: orderStats[0]?.avgOrders || 0,
      averageSpendPerUser: orderStats[0]?.avgSpent || 0
    }
  };
};

// Generate vendor report
export const generateVendorReport = async (
  startDate: Date,
  endDate: Date
): Promise<VendorReport> => {
  const [
    totalVendors,
    newVendors,
    activeVendors,
    avgRating,
    vendorPerformance
  ] = await Promise.all([
    Vendor.countDocuments({ isApproved: true }),
    Vendor.countDocuments({
      isApproved: true,
      createdAt: { $gte: startDate, $lte: endDate }
    }),
    Order.distinct('vendor', {
      createdAt: { $gte: startDate, $lte: endDate }
    }),
    Vendor.aggregate([
      {
        $match: { isApproved: true, averageRating: { $gt: 0 } }
      },
      {
        $group: {
          _id: null,
          avg: { $avg: '$averageRating' }
        }
      }
    ]),
    Vendor.aggregate([
      {
        $match: { isApproved: true }
      },
      {
        $lookup: {
          from: 'orders',
          let: { vendorId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$vendor', '$$vendorId'] },
                createdAt: { $gte: startDate, $lte: endDate }
              }
            }
          ],
          as: 'orders'
        }
      },
      {
        $lookup: {
          from: 'transactions',
          let: { vendorId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$vendor', '$$vendorId'] },
                status: TransactionStatus.COMPLETED,
                createdAt: { $gte: startDate, $lte: endDate }
              }
            }
          ],
          as: 'transactions'
        }
      },
      {
        $project: {
          businessName: 1,
          contactEmail: 1,
          averageRating: 1,
          orders: { $size: '$orders' },
          completedOrders: {
            $size: {
              $filter: {
                input: '$orders',
                as: 'order',
                cond: { $eq: ['$$order.status', OrderStatus.COMPLETED] }
              }
            }
          },
          revenue: { $sum: '$transactions.vendorAmount' }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: {
              if: { $gt: ['$orders', 0] },
              then: { $multiply: [{ $divide: ['$completedOrders', '$orders'] }, 100] },
              else: 0
            }
          }
        }
      },
      {
        $sort: { orders: -1 }
      },
      {
        $limit: 20
      }
    ])
  ]);

  return {
    period: { startDate, endDate },
    summary: {
      totalVendors,
      activeVendors: activeVendors.length,
      newVendors,
      averageRating: avgRating[0]?.avg || 0
    },
    performance: vendorPerformance.map(v => ({
      vendor: {
        _id: v._id,
        businessName: v.businessName,
        contactEmail: v.contactEmail
      },
      orders: v.orders,
      revenue: v.revenue,
      rating: v.averageRating,
      completionRate: v.completionRate
    }))
  };
};

// Generate order report
export const generateOrderReport = async (
  startDate: Date,
  endDate: Date
): Promise<OrderReport> => {
  const [
    orders,
    timeline
  ] = await Promise.all([
    Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          orders: 1,
          revenue: 1,
          _id: 0
        }
      }
    ])
  ]);

  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED).length;
  const cancelledOrders = orders.filter(o => o.status === OrderStatus.CANCELLED).length;
  const pendingOrders = orders.filter(o => 
    [OrderStatus.PENDING, OrderStatus.COMPLETED, OrderStatus.IN_PROGRESS].includes(o.status)
  ).length;

  const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0;
  const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
  const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

  return {
    period: { startDate, endDate },
    summary: {
      totalOrders,
      completedOrders,
      cancelledOrders,
      pendingOrders,
      averageOrderValue,
      completionRate,
      cancellationRate
    },
    timeline
  };
};

// Export report to CSV format
export const exportToCSV = (data: any[], headers: string[]): string => {
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      const escaped = ('' + value).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};
