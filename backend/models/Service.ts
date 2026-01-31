import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface for Service document
export interface IService extends Document {
  vendorId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount: number;
  billingType: 'per_service' | 'per_visit';
  duration?: number;
  images: string[];
  features: string[];
  workProcessSteps: string[];
  terms?: string;
  isActive: boolean;
  isAvailable: boolean;
  tags: string[];
  rating: number;
  totalBookings: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual
  discountedPrice: number;
}

const serviceSchema = new Schema<IService>({
  vendorId: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    minlength: [3, 'Service name must be at least 3 characters'],
    maxlength: [200, 'Service name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    lowercase: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    minlength: [20, 'Description must be at least 20 characters'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  billingType: {
    type: String,
    enum: {
      values: ['per_service', 'per_visit'],
      message: '{VALUE} is not a valid billing type'
    },
    required: true,
    default: 'per_service'
  },
  duration: {
    type: Number,
    min: [0, 'Duration cannot be negative']
  },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(images: string[]): boolean {
        return images.length <= 10;
      },
      message: 'Maximum 10 images allowed'
    }
  },
  features: {
    type: [String],
    default: []
  },
  workProcessSteps: {
    type: [String],
    default: []
  },
  terms: {
    type: String,
    maxlength: [2000, 'Terms cannot exceed 2000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  tags: {
    type: [String],
    default: []
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalBookings: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
serviceSchema.index({ vendorId: 1 });
serviceSchema.index({ categoryId: 1 });
// Note: slug already has index from schema definition
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ isAvailable: 1 });
serviceSchema.index({ price: 1 });
serviceSchema.index({ rating: -1 });
serviceSchema.index({ totalBookings: -1 });
serviceSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Compound indexes
serviceSchema.index({ categoryId: 1, isActive: 1 });
serviceSchema.index({ vendorId: 1, isActive: 1 });

// Virtual for discounted price
serviceSchema.virtual('discountedPrice').get(function(this: IService): number {
  if (this.discount > 0) {
    return this.price - (this.price * this.discount / 100);
  }
  return this.price;
});

// Generate slug from name before saving
serviceSchema.pre<IService>('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Ensure JSON includes virtuals
serviceSchema.set('toJSON', { virtuals: true });
serviceSchema.set('toObject', { virtuals: true });

const Service: Model<IService> = mongoose.model<IService>('Service', serviceSchema);

export default Service;
