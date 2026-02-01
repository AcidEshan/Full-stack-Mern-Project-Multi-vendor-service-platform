import mongoose from 'mongoose';
import os from 'os';
import User from '../models/User';
import Vendor from '../models/Vendor';
import { Order } from '../models/Order';
import Service from '../models/Service';
import { Transaction } from '../models/Transaction';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected' | 'connecting';
    responseTime: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercentage: number;
  };
  cpu: {
    cores: number;
    loadAverage: number[];
  };
  process: {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
  };
}

export interface DatabaseStats {
  collections: {
    users: number;
    vendors: number;
    orders: number;
    services: number;
    transactions: number;
  };
  indexes: any;
  storageSize: number;
}

// Check system health
export const getSystemHealth = async (): Promise<SystemHealth> => {
  const startTime = Date.now();
  
  // Check database connection
  let dbStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  let dbResponseTime = 0;
  
  try {
    await mongoose.connection.db.admin().ping();
    dbResponseTime = Date.now() - startTime;
    dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'connecting';
  } catch (error) {
    dbStatus = 'disconnected';
  }

  // Memory stats
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercentage = (usedMemory / totalMemory) * 100;

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (dbStatus === 'disconnected' || memoryUsagePercentage > 90) {
    status = 'unhealthy';
  } else if (dbResponseTime > 1000 || memoryUsagePercentage > 75) {
    status = 'degraded';
  }

  return {
    status,
    timestamp: new Date(),
    uptime: os.uptime(),
    database: {
      status: dbStatus,
      responseTime: dbResponseTime
    },
    memory: {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      usagePercentage: memoryUsagePercentage
    },
    cpu: {
      cores: os.cpus().length,
      loadAverage: os.loadavg()
    },
    process: {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    }
  };
};

// Get database statistics
export const getDatabaseStats = async (): Promise<DatabaseStats> => {
  const [
    userCount,
    vendorCount,
    orderCount,
    serviceCount,
    transactionCount,
    dbStats
  ] = await Promise.all([
    User.countDocuments(),
    Vendor.countDocuments(),
    Order.countDocuments(),
    Service.countDocuments(),
    Transaction.countDocuments(),
    mongoose.connection.db.stats()
  ]);

  return {
    collections: {
      users: userCount,
      vendors: vendorCount,
      orders: orderCount,
      services: serviceCount,
      transactions: transactionCount
    },
    indexes: dbStats.indexes,
    storageSize: dbStats.storageSize
  };
};

// Check for system alerts
export const getSystemAlerts = async (): Promise<Array<{
  level: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
}>> => {
  const alerts: Array<{
    level: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: Date;
  }> = [];

  const health = await getSystemHealth();

  // Memory alerts
  if (health.memory.usagePercentage > 90) {
    alerts.push({
      level: 'critical',
      message: `Memory usage critical: ${health.memory.usagePercentage.toFixed(2)}%`,
      timestamp: new Date()
    });
  } else if (health.memory.usagePercentage > 75) {
    alerts.push({
      level: 'warning',
      message: `Memory usage high: ${health.memory.usagePercentage.toFixed(2)}%`,
      timestamp: new Date()
    });
  }

  // Database alerts
  if (health.database.status === 'disconnected') {
    alerts.push({
      level: 'critical',
      message: 'Database connection lost',
      timestamp: new Date()
    });
  } else if (health.database.responseTime > 1000) {
    alerts.push({
      level: 'warning',
      message: `Database response time slow: ${health.database.responseTime}ms`,
      timestamp: new Date()
    });
  }

  // Check for pending vendor approvals
  const pendingVendors = await Vendor.countDocuments({ 
    isApproved: false, 
    rejectionReason: { $exists: false } 
  });
  
  if (pendingVendors > 10) {
    alerts.push({
      level: 'warning',
      message: `${pendingVendors} vendors pending approval`,
      timestamp: new Date()
    });
  }

  // Check for unverified users
  const unverifiedUsers = await User.countDocuments({ 
    isEmailVerified: false,
    createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Older than 7 days
  });
  
  if (unverifiedUsers > 50) {
    alerts.push({
      level: 'info',
      message: `${unverifiedUsers} users unverified for more than 7 days`,
      timestamp: new Date()
    });
  }

  return alerts;
};

// Format bytes to human readable
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Get performance metrics
export const getPerformanceMetrics = async () => {
  const startTime = Date.now();

  // Test database query performance
  const dbQueryStart = Date.now();
  await User.findOne().lean();
  const dbQueryTime = Date.now() - dbQueryStart;

  // Test aggregation performance
  const aggregationStart = Date.now();
  await Order.aggregate([
    { $limit: 1 },
    { $group: { _id: null, count: { $sum: 1 } } }
  ]);
  const aggregationTime = Date.now() - aggregationStart;

  return {
    totalCheckTime: Date.now() - startTime,
    dbQueryTime,
    aggregationTime,
    timestamp: new Date()
  };
};
