import mongoose, { Document, Schema } from 'mongoose';

// Payout status enum
export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Payout method enum
export enum PayoutMethod {
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_BANKING = 'mobile_banking',
  PAYPAL = 'paypal',
  STRIPE = 'stripe'
}

// Payout document interface
export interface IPayout extends Document {
  payoutNumber: string;
  vendor: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  method: PayoutMethod;
  status: PayoutStatus;
  
  // Banking details
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  routingNumber?: string;
  swiftCode?: string;
  
  // Mobile banking
  mobileProvider?: string;
  mobileNumber?: string;
  
  // Transaction details
  transactions: mongoose.Types.ObjectId[];
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  // Processing info
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  
  // Gateway info
  gatewayTransactionId?: string;
  gatewayResponse?: any;
  
  // Admin actions
  processedBy?: mongoose.Types.ObjectId;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Payout schema
const payoutSchema = new Schema<IPayout>(
  {
    payoutNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
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
      default: 'BDT',
      uppercase: true
    },
    method: {
      type: String,
      enum: Object.values(PayoutMethod),
      required: true
    },
    status: {
      type: String,
      enum: Object.values(PayoutStatus),
      default: PayoutStatus.PENDING,
      index: true
    },
    bankName: String,
    accountNumber: String,
    accountHolderName: String,
    routingNumber: String,
    swiftCode: String,
    mobileProvider: String,
    mobileNumber: String,
    transactions: [{
      type: Schema.Types.ObjectId,
      ref: 'Transaction'
    }],
    period: {
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      }
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: Date,
    completedAt: Date,
    failureReason: String,
    gatewayTransactionId: String,
    gatewayResponse: Schema.Types.Mixed,
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  },
  {
    timestamps: true
  }
);

// Indexes
payoutSchema.index({ vendor: 1, status: 1 });
payoutSchema.index({ status: 1, createdAt: -1 });

// Pre-save hook to generate payout number
payoutSchema.pre('save', async function(next) {
  if (this.isNew && !this.payoutNumber) {
    const count = await mongoose.model('Payout').countDocuments();
    this.payoutNumber = `PO-${Date.now()}-${count + 1}`;
  }
  next();
});

const Payout = mongoose.model<IPayout>('Payout', payoutSchema);
export default Payout;
