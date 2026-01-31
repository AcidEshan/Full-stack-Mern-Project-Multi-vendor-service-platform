import mongoose, { Document, Schema, Model } from 'mongoose';

// Analytics event type enum
export enum AnalyticsEventType {
  PAGE_VIEW = 'page_view',
  SERVICE_VIEW = 'service_view',
  VENDOR_VIEW = 'vendor_view',
  SEARCH = 'search',
  ORDER_PLACED = 'order_placed',
  ORDER_COMPLETED = 'order_completed',
  ORDER_CANCELLED = 'order_cancelled',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  REVIEW_SUBMITTED = 'review_submitted',
  USER_REGISTERED = 'user_registered',
  VENDOR_REGISTERED = 'vendor_registered',
  LOGIN = 'login',
  LOGOUT = 'logout'
}

// Analytics document interface
export interface IAnalytics extends Document {
  eventType: AnalyticsEventType;
  
  // User information
  user?: mongoose.Types.ObjectId;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  
  // Related entities
  relatedOrder?: mongoose.Types.ObjectId;
  relatedService?: mongoose.Types.ObjectId;
  relatedVendor?: mongoose.Types.ObjectId;
  relatedCategory?: mongoose.Types.ObjectId;
  
  // Event metadata
  metadata?: {
    searchQuery?: string;
    page?: string;
    referrer?: string;
    device?: string;
    browser?: string;
    os?: string;
    location?: {
      country?: string;
      city?: string;
      region?: string;
    };
    amount?: number;
    currency?: string;
    duration?: number; // in seconds
    [key: string]: any;
  };
  
  // Timestamps
  createdAt: Date;
}

// Interface for Analytics model with static methods
interface IAnalyticsModel extends Model<IAnalytics> {
  trackEvent(data: {
    eventType: AnalyticsEventType;
    user?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    relatedOrder?: string;
    relatedService?: string;
    relatedVendor?: string;
    relatedCategory?: string;
    metadata?: any;
  }): Promise<IAnalytics | null>;
  
  getEventCount(
    eventType: AnalyticsEventType,
    startDate?: Date,
    endDate?: Date
  ): Promise<number>;
  
  getPopularServices(limit?: number, days?: number): Promise<any[]>;
  getPopularVendors(limit?: number, days?: number): Promise<any[]>;
  getSearchAnalytics(limit?: number, days?: number): Promise<any[]>;
}

// Analytics schema
const analyticsSchema = new Schema<IAnalytics, IAnalyticsModel>(
  {
    eventType: {
      type: String,
      enum: Object.values(AnalyticsEventType),
      required: true,
      index: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    sessionId: {
      type: String,
      index: true
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    relatedOrder: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true
    },
    relatedService: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      index: true
    },
    relatedVendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      index: true
    },
    relatedCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Indexes for efficient queries
analyticsSchema.index({ eventType: 1, createdAt: -1 });
analyticsSchema.index({ user: 1, createdAt: -1 });
analyticsSchema.index({ createdAt: -1 });
analyticsSchema.index({ relatedService: 1, eventType: 1 });
analyticsSchema.index({ relatedVendor: 1, eventType: 1 });

// TTL index - automatically delete analytics data older than 1 year
analyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

// Static method to track event
analyticsSchema.statics.trackEvent = async function (data: {
  eventType: AnalyticsEventType;
  user?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  relatedOrder?: string;
  relatedService?: string;
  relatedVendor?: string;
  relatedCategory?: string;
  metadata?: any;
}) {
  try {
    const event = await this.create(data);
    return event;
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return null;
  }
};

// Static method to get event count by type
analyticsSchema.statics.getEventCount = async function (
  eventType: AnalyticsEventType,
  startDate?: Date,
  endDate?: Date
) {
  const filter: any = { eventType };
  
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = startDate;
    if (endDate) filter.createdAt.$lte = endDate;
  }
  
  return this.countDocuments(filter);
};

// Static method to get popular services
analyticsSchema.statics.getPopularServices = async function (
  limit: number = 10,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        eventType: AnalyticsEventType.SERVICE_VIEW,
        relatedService: { $exists: true },
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$relatedService',
        views: { $sum: 1 }
      }
    },
    {
      $sort: { views: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'services',
        localField: '_id',
        foreignField: '_id',
        as: 'service'
      }
    },
    {
      $unwind: '$service'
    },
    {
      $project: {
        service: {
          _id: 1,
          name: 1,
          price: 1,
          averageRating: 1
        },
        views: 1
      }
    }
  ]);
};

// Static method to get popular vendors
analyticsSchema.statics.getPopularVendors = async function (
  limit: number = 10,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        eventType: AnalyticsEventType.VENDOR_VIEW,
        relatedVendor: { $exists: true },
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$relatedVendor',
        views: { $sum: 1 }
      }
    },
    {
      $sort: { views: -1 }
    },
    {
      $limit: limit
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
          averageRating: 1,
          totalOrders: 1
        },
        views: 1
      }
    }
  ]);
};

// Static method to get search analytics
analyticsSchema.statics.getSearchAnalytics = async function (
  limit: number = 20,
  days: number = 7
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        eventType: AnalyticsEventType.SEARCH,
        'metadata.searchQuery': { $exists: true },
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$metadata.searchQuery',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: limit
    },
    {
      $project: {
        query: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);
};

export const Analytics = mongoose.model<IAnalytics, IAnalyticsModel>('Analytics', analyticsSchema);
