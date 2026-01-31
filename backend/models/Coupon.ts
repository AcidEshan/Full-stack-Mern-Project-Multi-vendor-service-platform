import mongoose, { Document, Schema } from 'mongoose';

// Coupon type enum
export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  FREE_DELIVERY = 'free_delivery'
}

// Coupon status enum
export enum CouponStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  USED_UP = 'used_up'
}

// Coupon document interface
export interface ICoupon extends Document {
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  status: CouponStatus;
  startDate: Date;
  endDate: Date;
  usageLimit: number;
  usageCount: number;
  userUsageLimit: number;
  applicableFor: 'all' | 'specific_users' | 'specific_categories' | 'specific_services';
  applicableUsers?: mongoose.Types.ObjectId[];
  applicableCategories?: mongoose.Types.ObjectId[];
  applicableServices?: mongoose.Types.ObjectId[];
  applicableVendors?: mongoose.Types.ObjectId[];
  isFirstOrderOnly: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  isValid(): boolean;
  canBeUsedBy(userId: string): Promise<boolean>;
  calculateDiscount(orderAmount: number): number;
}

// Coupon schema
const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: Object.values(CouponType),
      required: true
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    maxDiscountAmount: {
      type: Number,
      min: 0
    },
    status: {
      type: String,
      enum: Object.values(CouponStatus),
      default: CouponStatus.ACTIVE
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    usageLimit: {
      type: Number,
      default: 0,
      min: 0
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0
    },
    userUsageLimit: {
      type: Number,
      default: 1,
      min: 1
    },
    applicableFor: {
      type: String,
      enum: ['all', 'specific_users', 'specific_categories', 'specific_services'],
      default: 'all'
    },
    applicableUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    applicableCategories: [{
      type: Schema.Types.ObjectId,
      ref: 'Category'
    }],
    applicableServices: [{
      type: Schema.Types.ObjectId,
      ref: 'Service'
    }],
    applicableVendors: [{
      type: Schema.Types.ObjectId,
      ref: 'Vendor'
    }],
    isFirstOrderOnly: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
couponSchema.index({ code: 1, status: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });
couponSchema.index({ status: 1 });

// Check if coupon is valid
couponSchema.methods.isValid = function(): boolean {
  const now = new Date();
  
  if (this.status !== CouponStatus.ACTIVE) return false;
  if (now < this.startDate || now > this.endDate) return false;
  if (this.usageLimit > 0 && this.usageCount >= this.usageLimit) return false;
  
  return true;
};

// Check if coupon can be used by user
couponSchema.methods.canBeUsedBy = async function(userId: string): Promise<boolean> {
  if (!this.isValid()) return false;
  
  // Check user-specific restrictions
  if (this.applicableFor === 'specific_users') {
    if (!this.applicableUsers.some((id: any) => id.toString() === userId)) {
      return false;
    }
  }
  
  // Check user usage limit
  const Order = mongoose.model('Order');
  const userUsageCount = await Order.countDocuments({
    user: userId,
    'couponApplied.code': this.code
  });
  
  if (userUsageCount >= this.userUsageLimit) return false;
  
  // Check first order only
  if (this.isFirstOrderOnly) {
    const orderCount = await Order.countDocuments({ user: userId });
    if (orderCount > 0) return false;
  }
  
  return true;
};

// Calculate discount amount
couponSchema.methods.calculateDiscount = function(orderAmount: number): number {
  if (orderAmount < this.minOrderAmount) return 0;
  
  let discount = 0;
  
  if (this.type === CouponType.PERCENTAGE) {
    discount = (orderAmount * this.value) / 100;
  } else if (this.type === CouponType.FIXED) {
    discount = this.value;
  }
  
  // Apply max discount limit
  if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
    discount = this.maxDiscountAmount;
  }
  
  // Discount cannot exceed order amount
  if (discount > orderAmount) {
    discount = orderAmount;
  }
  
  return Math.round(discount * 100) / 100;
};

const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);
export default Coupon;
