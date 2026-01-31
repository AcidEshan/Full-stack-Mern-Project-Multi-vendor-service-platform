import mongoose, { Document, Schema } from 'mongoose';

// Payment method enum
export enum PaymentMethod {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  SSLCOMMERZ = 'sslcommerz',
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer'
}

// Transaction status enum
export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CANCELLED = 'cancelled'
}

// Transaction type enum
export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  PAYOUT = 'payout',
  COMMISSION = 'commission'
}

// Transaction document interface
export interface ITransaction extends Document {
  transactionNumber: string;
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  vendor: mongoose.Types.ObjectId;
  
  // Transaction details
  type: TransactionType;
  amount: number;
  currency: string;
  
  // Commission breakdown
  commissionRate: number;
  commissionAmount: number;
  vendorAmount: number;
  
  // Payment details
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  
  // Payment gateway data
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  paypalTransactionId?: string;
  sslcommerzTransactionId?: string;
  sslcommerzSessionKey?: string;
  sslcommerzValidationId?: string;
  sslcommerzBankTranId?: string;
  paymentGatewayResponse?: any;
  
  // Refund information
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: Date;
  refundedBy?: mongoose.Types.ObjectId;
  
  // Payout information
  payoutId?: string;
  payoutAmount?: number;
  payoutDate?: Date;
  payoutStatus?: string;
  
  // Metadata
  description?: string;
  metadata?: any;
  failureReason?: string;
  
  // Timestamps
  processedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  isRefundable(): boolean;
  canPartialRefund(): boolean;
}

// Transaction model interface with static methods
export interface ITransactionModel extends mongoose.Model<ITransaction> {
  getStatistics(filter?: any): Promise<any>;
  getRevenueByDateRange(startDate: Date, endDate: Date, vendorId?: string): Promise<any>;
}

// Transaction schema
const transactionSchema = new Schema<ITransaction>(
  {
    transactionNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
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
    type: {
      type: String,
      enum: Object.values(TransactionType),
      default: TransactionType.PAYMENT,
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true
    },
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 5
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0
    },
    vendorAmount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
      required: true,
      index: true
    },
    stripePaymentIntentId: {
      type: String,
      index: true
    },
    stripeChargeId: {
      type: String
    },
    paypalTransactionId: {
      type: String,
      index: true
    },
    sslcommerzTransactionId: {
      type: String,
      index: true
    },
    sslcommerzSessionKey: {
      type: String,
      index: true
    },
    sslcommerzValidationId: {
      type: String
    },
    sslcommerzBankTranId: {
      type: String,
      index: true
    },
    paymentGatewayResponse: {
      type: Schema.Types.Mixed
    },
    refundId: {
      type: String
    },
    refundAmount: {
      type: Number,
      min: 0
    },
    refundReason: {
      type: String,
      trim: true,
      maxlength: 500
    },
    refundedAt: {
      type: Date
    },
    refundedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    payoutId: {
      type: String
    },
    payoutAmount: {
      type: Number,
      min: 0
    },
    payoutDate: {
      type: Date
    },
    payoutStatus: {
      type: String
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    metadata: {
      type: Schema.Types.Mixed
    },
    failureReason: {
      type: String,
      trim: true,
      maxlength: 500
    },
    processedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
transactionSchema.index({ order: 1, status: 1 });
transactionSchema.index({ user: 1, status: 1 });
transactionSchema.index({ vendor: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ paymentMethod: 1, status: 1 });

// Pre-save middleware to generate transaction number
transactionSchema.pre('save', async function (next) {
  if (this.isNew && !this.transactionNumber) {
    // Generate transaction number: TXN-YYYYMMDD-RANDOM
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(100000 + Math.random() * 900000);
    this.transactionNumber = `TXN-${dateStr}-${random}`;
  }
  next();
});

// Pre-save middleware to calculate commission and vendor amount
transactionSchema.pre('save', function (next) {
  if (this.isModified('amount') || this.isModified('commissionRate')) {
    // Calculate commission amount
    this.commissionAmount = (this.amount * this.commissionRate) / 100;
    
    // Calculate vendor amount (total - commission)
    this.vendorAmount = this.amount - this.commissionAmount;
  }
  next();
});

// Static method to get transaction statistics
transactionSchema.statics.getStatistics = async function (filter: any = {}) {
  const stats = await this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalCommission: { $sum: '$commissionAmount' },
        totalVendorAmount: { $sum: '$vendorAmount' }
      }
    }
  ]);
  
  return stats;
};

// Static method to get revenue by date range
transactionSchema.statics.getRevenueByDateRange = async function (
  startDate: Date,
  endDate: Date,
  vendorId?: string
) {
  const match: any = {
    createdAt: { $gte: startDate, $lte: endDate },
    status: TransactionStatus.COMPLETED,
    type: TransactionType.PAYMENT
  };
  
  if (vendorId) {
    match.vendor = new mongoose.Types.ObjectId(vendorId);
  }
  
  const revenue = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        totalRevenue: { $sum: '$amount' },
        totalCommission: { $sum: '$commissionAmount' },
        totalVendorAmount: { $sum: '$vendorAmount' },
        transactionCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  return revenue;
};

// Instance method to check if refundable
transactionSchema.methods.isRefundable = function (): boolean {
  return (
    this.status === TransactionStatus.COMPLETED &&
    this.type === TransactionType.PAYMENT &&
    !this.refundId
  );
};

// Instance method to check if partially refundable
transactionSchema.methods.canPartialRefund = function (): boolean {
  return (
    this.status === TransactionStatus.COMPLETED ||
    this.status === TransactionStatus.PARTIALLY_REFUNDED
  );
};

export const Transaction = mongoose.model<ITransaction, ITransactionModel>('Transaction', transactionSchema);
