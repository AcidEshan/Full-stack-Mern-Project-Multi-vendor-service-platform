import mongoose, { Document, Schema } from 'mongoose';

// Notification type enum
export enum NotificationType {
  ORDER = 'order',
  PAYMENT = 'payment',
  REVIEW = 'review',
  VENDOR_APPROVAL = 'vendor_approval',
  SYSTEM = 'system'
}

// Notification priority enum
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// Notification document interface
export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  
  // Status
  isRead: boolean;
  readAt?: Date;
  
  // Priority
  priority: NotificationPriority;
  
  // Related entities
  relatedOrder?: mongoose.Types.ObjectId;
  relatedTransaction?: mongoose.Types.ObjectId;
  relatedReview?: mongoose.Types.ObjectId;
  relatedVendor?: mongoose.Types.ObjectId;
  
  // Metadata
  metadata?: any;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Notification schema
const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    link: {
      type: String,
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date
    },
    priority: {
      type: String,
      enum: Object.values(NotificationPriority),
      default: NotificationPriority.MEDIUM
    },
    relatedOrder: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    },
    relatedTransaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    relatedReview: {
      type: Schema.Types.ObjectId,
      ref: 'Review'
    },
    relatedVendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function (data: {
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  priority?: NotificationPriority;
  relatedOrder?: string;
  relatedTransaction?: string;
  relatedReview?: string;
  relatedVendor?: string;
  metadata?: any;
}) {
  try {
    const notification = await this.create(data);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function (userId: string) {
  return this.countDocuments({ user: userId, isRead: false });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function (userId: string) {
  const result = await this.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return result.modifiedCount;
};

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
