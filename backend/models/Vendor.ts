import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface for address
export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// Interface for document
export interface IVendorDocument {
  documentType?: string;
  documentUrl?: string;
  uploadedAt: Date;
}

// Interface for working hours
export interface IWorkingHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isOpen: boolean;
  openTime?: string; // Format: "09:00"
  closeTime?: string; // Format: "17:00"
}

// Interface for Vendor document
export interface IVendor extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  companyLogo?: string;
  coverImage?: string;
  description?: string;
  address?: IAddress;
  businessRegistrationNumber?: string;
  taxId?: string;
  
  // Social Media & Contact
  website?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  
  // Business Information
  yearsInBusiness?: number;
  numberOfEmployees?: number;
  serviceAreas?: string[];
  languages?: string[];
  
  // Working Hours & Availability
  workingHours?: IWorkingHours[];
  isOnVacation?: boolean;
  vacationStartDate?: Date;
  vacationEndDate?: Date;
  vacationNote?: string;
  
  // Approval Status
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  approvalDate?: Date;
  rejectionReason?: string;
  
  isActive: boolean;
  
  // Performance Metrics
  rating: number;
  totalReviews: number;
  totalRevenue: number;
  commission: number;
  totalOrders: number;
  completedOrders: number;
  
  // Documents
  documents: IVendorDocument[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    minlength: [3, 'Company name must be at least 3 characters'],
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  companyLogo: {
    type: String,
    default: null
  },
  coverImage: {
    type: String,
    default: null
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  businessRegistrationNumber: String,
  taxId: String,
  
  // Social Media & Contact
  website: {
    type: String,
    trim: true
  },
  facebook: {
    type: String,
    trim: true
  },
  twitter: {
    type: String,
    trim: true
  },
  instagram: {
    type: String,
    trim: true
  },
  linkedin: {
    type: String,
    trim: true
  },
  
  // Business Information
  yearsInBusiness: {
    type: Number,
    min: 0
  },
  numberOfEmployees: {
    type: Number,
    min: 1
  },
  serviceAreas: [{
    type: String,
    trim: true
  }],
  languages: [{
    type: String,
    trim: true
  }],
  
  // Working Hours & Availability
  workingHours: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    openTime: {
      type: String,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
    },
    closeTime: {
      type: String,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
    }
  }],
  isOnVacation: {
    type: Boolean,
    default: false
  },
  vacationStartDate: Date,
  vacationEndDate: Date,
  vacationNote: {
    type: String,
    maxlength: [500, 'Vacation note cannot exceed 500 characters']
  },
  
  // Approval Status
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  rejectionReason: String,
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Performance Metrics
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  commission: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  completedOrders: {
    type: Number,
    default: 0
  },
  
  // Documents
  documents: [{
    documentType: String,
    documentUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
// Note: userId index already created by unique: true
vendorSchema.index({ approvalStatus: 1 });
vendorSchema.index({ companyName: 'text' });

const Vendor: Model<IVendor> = mongoose.model<IVendor>('Vendor', vendorSchema);

export default Vendor;
