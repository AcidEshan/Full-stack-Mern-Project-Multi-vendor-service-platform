import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Vendor } from '../models/Vendor';
import { Order } from '../models/Order';
import { Service } from '../models/Service';
import { Transaction } from '../models/Transaction';
import { Review } from '../models/Review';
import { Category } from '../models/Category';
import { Notification } from '../models/Notification';
import { 
  getSystemHealth, 
  getDatabaseStats, 
  getSystemAlerts,
  formatBytes,
  getPerformanceMetrics
} from '../utils/systemHealth';
import {
  generateRevenueReport,
  generateUserReport,
  generateVendorReport,
  generateOrderReport,
  exportToCSV
} from '../utils/reportGenerator';

// ============================================
// System Health & Monitoring
// ============================================

export const getHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await getSystemHealth();

    res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [health, dbStats, alerts, performance] = await Promise.all([
      getSystemHealth(),
      getDatabaseStats(),
      getSystemAlerts(),
      getPerformanceMetrics()
    ]);

    res.status(200).json({
      success: true,
      data: {
        health,
        database: {
          ...dbStats,
          storageSize: formatBytes(dbStats.storageSize)
        },
        alerts,
        performance
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Data Management
// ============================================

export const bulkDeleteUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    // Prevent deleting super admins and admins
    const users = await User.find({ _id: { $in: userIds } });
    const protectedUsers = users.filter(u => ['super_admin', 'admin'].includes(u.role));

    if (protectedUsers.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users',
        data: { protectedUsers: protectedUsers.map(u => u.email) }
      });
    }

    const result = await User.deleteMany({ _id: { $in: userIds }, role: 'user' });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} users deleted`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userIds, updates } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Updates object is required'
      });
    }

    // Prevent updating sensitive fields
    const prohibitedFields = ['role', 'password', 'email'];
    const hasProhibitedFields = Object.keys(updates).some(key => prohibitedFields.includes(key));

    if (hasProhibitedFields) {
      return res.status(403).json({
        success: false,
        message: `Cannot update fields: ${prohibitedFields.join(', ')}`
      });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds }, role: 'user' },
      { $set: updates }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} users updated`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    next(error);
  }
};

export const cleanupInactiveUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = 180 } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(days));

    // Find users who haven't logged in for X days and have no orders
    const inactiveUsers = await User.find({
      role: 'user',
      lastLogin: { $lt: cutoffDate },
      isActive: true
    }).select('_id');

    const userIds = inactiveUsers.map(u => u._id);

    // Check which users have no orders
    const usersWithOrders = await Order.distinct('user', {
      user: { $in: userIds }
    });

    const usersToDeactivate = userIds.filter(
      id => !usersWithOrders.some(orderId => orderId.toString() === id.toString())
    );

    const result = await User.updateMany(
      { _id: { $in: usersToDeactivate } },
      { $set: { isActive: false } }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} inactive users deactivated`,
      data: { 
        deactivatedCount: result.modifiedCount,
        criteria: `No activity for ${days} days and no orders`
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Platform Settings
// ============================================

export const getPlatformSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a real app, these would come from a Settings collection
    const settings = {
      commission: {
        rate: Number(process.env.PLATFORM_COMMISSION_RATE) || 5,
        currency: process.env.CURRENCY || 'usd'
      },
      email: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        from: process.env.EMAIL_FROM
      },
      security: {
        maxLoginAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS) || 5,
        lockTimeMinutes: Number(process.env.LOCK_TIME_MINUTES) || 15,
        bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10
      },
      rateLimit: {
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
        maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
      },
      upload: {
        maxFileSize: Number(process.env.MAX_FILE_SIZE) || 10485760,
        allowedImageTypes: process.env.ALLOWED_IMAGE_TYPES?.split(',') || []
      }
    };

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Reports
// ============================================

export const generateReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, startDate, endDate, format = 'json' } = req.query;

    if (!type || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Report type, start date, and end date are required'
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    let report: any;

    switch (type) {
      case 'revenue':
        report = await generateRevenueReport(start, end);
        break;
      case 'users':
        report = await generateUserReport(start, end);
        break;
      case 'vendors':
        report = await generateVendorReport(start, end);
        break;
      case 'orders':
        report = await generateOrderReport(start, end);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type. Available: revenue, users, vendors, orders'
        });
    }

    if (format === 'csv') {
      // Convert report to CSV
      let csvData = '';
      let headers: string[] = [];

      if (type === 'revenue' && report.topVendors) {
        headers = ['Vendor', 'Revenue', 'Transactions'];
        const data = report.topVendors.map((v: any) => ({
          Vendor: v.vendor.businessName,
          Revenue: v.revenue,
          Transactions: v.transactions
        }));
        csvData = exportToCSV(data, headers);
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${Date.now()}.csv"`);
      return res.send(csvData);
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Backup & Maintenance
// ============================================

export const triggerBackup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In production, this would trigger a database backup process
    // For now, we'll return collection counts as a simple backup check

    const collections = await getDatabaseStats();

    res.status(200).json({
      success: true,
      message: 'Backup info retrieved',
      data: {
        timestamp: new Date(),
        collections: collections.collections,
        note: 'In production, implement actual backup mechanism (mongodump, cloud backup, etc.)'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const cleanupOldData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = 365 } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(days));

    const results = await Promise.all([
      // Delete old analytics (handled by TTL index automatically)
      Notification.deleteMany({
        isRead: true,
        createdAt: { $lt: cutoffDate }
      })
    ]);

    res.status(200).json({
      success: true,
      message: 'Old data cleaned up',
      data: {
        notificationsDeleted: results[0].deletedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Audit Logs
// ============================================

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;

    // In production, you'd have a separate AuditLog model
    // For now, return recent transactions and orders as audit trail

    const filter: any = {};
    if (userId) filter.user = userId;

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, orders, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit) / 2)
        .populate('user', 'name email')
        .populate('vendor', 'businessName'),
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit) / 2)
        .populate('user', 'name email')
        .populate('vendor', 'businessName'),
      Transaction.countDocuments(filter) + Order.countDocuments(filter)
    ]);

    const auditLogs = [
      ...transactions.map(t => ({
        type: 'transaction',
        action: t.status,
        user: t.user,
        details: `Transaction ${t.transactionNumber}`,
        timestamp: t.createdAt
      })),
      ...orders.map(o => ({
        type: 'order',
        action: o.status,
        user: o.user,
        details: `Order ${o.orderNumber}`,
        timestamp: o.createdAt
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    res.status(200).json({
      success: true,
      data: auditLogs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Cache Management
// ============================================

export const clearCache = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In production, this would clear Redis/Memcached
    // For now, just return a success message

    res.status(200).json({
      success: true,
      message: 'Cache cleared successfully',
      note: 'Implement Redis cache clearing in production'
    });
  } catch (error) {
    next(error);
  }
};
