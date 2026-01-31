import mongoose, { Document, Schema } from 'mongoose';

// Order status enum
export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Payment status enum
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// Order document interface
export interface IOrder extends Document {
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  vendor: mongoose.Types.ObjectId;
  service: mongoose.Types.ObjectId;
  
  // Booking details
  scheduledDate: Date;
  scheduledTime: string;
  duration: number; // in minutes
  
  // Pricing
  servicePrice: number;
  discount: number;
  discountAmount: number;
  couponApplied?: {
    code: string;
    couponId: mongoose.Types.ObjectId;
    discountAmount: number;
  };
  subtotal: number;
  tax: number;
  platformFee: number;
  totalAmount: number;
  
  // Status tracking
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  
  // Customer information
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  
  // Address
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Additional details
  notes?: string;
  specialRequirements?: string;
  
  // Vendor actions
  vendorNotes?: string;
  rejectionReason?: string;
  acceptedAt?: Date;
  rejectedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: 'user' | 'vendor' | 'admin';
  cancellationReason?: string;
  
  // Rescheduling
  rescheduledFrom?: {
    date: Date;
    time: string;
  };
  rescheduledAt?: Date;
  rescheduledBy?: 'user' | 'vendor';
  
  // Review tracking
  isReviewed: boolean;
  reviewId?: mongoose.Types.ObjectId;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  canBeCancelled(): boolean;
  canBeProcessed(): boolean;
  canBeStarted(): boolean;
  canBeCompleted(): boolean;
}

// Order model interface with static methods
export interface IOrderModel extends mongoose.Model<IOrder> {
  getStatistics(vendorId?: string, userId?: string): Promise<any>;
}

// Order schema
const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true
    },
    scheduledTime: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true,
      min: 0
    },
    servicePrice: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    couponApplied: {
      code: {
        type: String,
        uppercase: true
      },
      couponId: {
        type: Schema.Types.ObjectId,
        ref: 'Coupon'
      },
      discountAmount: {
        type: Number,
        min: 0
      }
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    platformFee: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      required: true,
      index: true
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      required: true,
      index: true
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    address: {
      street: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      zipCode: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true, default: 'USA' },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
      }
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    specialRequirements: {
      type: String,
      trim: true,
      maxlength: 500
    },
    vendorNotes: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500
    },
    acceptedAt: {
      type: Date
    },
    rejectedAt: {
      type: Date
    },
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    cancelledBy: {
      type: String,
      enum: ['user', 'vendor', 'admin']
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500
    },
    rescheduledFrom: {
      date: Date,
      time: String
    },
    rescheduledAt: Date,
    rescheduledBy: {
      type: String,
      enum: ['user', 'vendor']
    },
    isReviewed: {
      type: Boolean,
      default: false
    },
    reviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Review'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ vendor: 1, status: 1 });
orderSchema.index({ service: 1, status: 1 });
orderSchema.index({ scheduledDate: 1, status: 1 });
orderSchema.index({ createdAt: -1 });
// Note: orderNumber already has unique index from schema definition

// Pre-save middleware to generate order number
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    // Generate order number: ORD-YYYYMMDD-RANDOM
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(100000 + Math.random() * 900000);
    this.orderNumber = `ORD-${dateStr}-${random}`;
  }
  next();
});

// Static method to get order statistics
orderSchema.statics.getStatistics = async function (vendorId?: string, userId?: string) {
  const match: any = {};
  if (vendorId) match.vendor = new mongoose.Types.ObjectId(vendorId);
  if (userId) match.user = new mongoose.Types.ObjectId(userId);
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);
  
  return stats;
};

// Instance method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function (): boolean {
  return [OrderStatus.PENDING, OrderStatus.ACCEPTED].includes(this.status);
};

// Instance method to check if order can be accepted/rejected
orderSchema.methods.canBeProcessed = function (): boolean {
  return this.status === OrderStatus.PENDING;
};

// Instance method to check if order can be started
orderSchema.methods.canBeStarted = function (): boolean {
  return this.status === OrderStatus.ACCEPTED;
};

// Instance method to check if order can be completed
orderSchema.methods.canBeCompleted = function (): boolean {
  return this.status === OrderStatus.IN_PROGRESS;
};

export const Order = mongoose.model<IOrder, IOrderModel>('Order', orderSchema);
