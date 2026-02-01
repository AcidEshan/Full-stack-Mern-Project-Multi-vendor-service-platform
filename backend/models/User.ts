import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import validator from 'validator';

// Interface for refresh token
export interface IRefreshToken {
  token: string;
  createdAt: Date;
  expiresAt: Date;
  deviceInfo?: string;
  ipAddress?: string;
}

// Interface for user address
export interface IUserAddress {
  _id?: mongoose.Types.ObjectId;
  label: string; // e.g., "Home", "Office", "Other"
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

// Interface for User document
export interface IUser extends Document {
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'vendor' | 'user';
  firstName: string;
  lastName: string;
  phone: string;
  profileImage?: string;
  addresses?: IUserAddress[];
  
  // Account Status
  isActive: boolean;
  isBlocked: boolean;
  isEmailVerified: boolean;
  isApproved: boolean;
  
  // Security Fields
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  emailVerificationCode?: string;
  emailVerificationCodeExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  failedLoginAttempts: number;
  lockUntil?: Date;
  // Notification preferences
  notificationPreferences?: {
    email: {
      orderUpdates: boolean;
      paymentUpdates: boolean;
      reviewNotifications: boolean;
      promotions: boolean;
    };
    push: {
      orderUpdates: boolean;
      paymentUpdates: boolean;
      reviewNotifications: boolean;
      promotions: boolean;
    };
  }; 
  
  // Session Management
  refreshTokens: IRefreshToken[];
  
  // Audit Fields
  lastLogin?: Date;
  lastLoginIP?: string;
  createdBy?: mongoose.Types.ObjectId;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual
  fullName: string;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incLoginAttempts(): Promise<any>;
  resetLoginAttempts(): Promise<any>;
  addRefreshToken(token: string, deviceInfo?: string, ipAddress?: string): Promise<void>;
  removeRefreshToken(token: string): Promise<void>;
  removeAllRefreshTokens(): Promise<void>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string): boolean {
        return validator.isEmail(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: {
      values: ['super_admin', 'admin', 'vendor', 'user'],
      message: '{VALUE} is not a valid role'
    },
    required: true,
    default: 'user'
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    validate: {
      validator: function(v: string): boolean {
        return /^\d{10,15}$/.test(v);
      },
      message: 'Please provide a valid phone number (10-15 digits)'
    }
  },
  profileImage: {
    type: String,
    default: null
  },
  addresses: [{
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Address label cannot exceed 50 characters']
    },
    street: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Street cannot exceed 200 characters']
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters']
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: [20, 'Zip code cannot exceed 20 characters']
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters']
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: function(this: IUser): boolean {
      // Auto-approve all roles except vendor
      return this.role !== 'vendor';
    }
  },
  
  // Security Fields
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  emailVerificationCode: String,
  emailVerificationCodeExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Session Management
  refreshTokens: [{
    token: String,
    createdAt: Date,
    expiresAt: Date,
    deviceInfo: String,
    ipAddress: String
  }],
  
  // Audit Fields
  lastLogin: Date,
  lastLoginIP: String,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  notificationPreferences: {
    email: {
      orderUpdates: { type: Boolean, default: true },
      paymentUpdates: { type: Boolean, default: true },
      reviewNotifications: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false }
    },
    push: {
      orderUpdates: { type: Boolean, default: true },
      paymentUpdates: { type: Boolean, default: true },
      reviewNotifications: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false }
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
// Note: email and phone indexes already created by unique: true
userSchema.index({ role: 1 });
userSchema.index({ isBlocked: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function(this: IUser): string {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre<IUser>('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(this: IUser, candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to check if account is locked
userSchema.methods.isLocked = function(this: IUser): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Method to increment failed login attempts
userSchema.methods.incLoginAttempts = async function(this: IUser): Promise<any> {
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
  const lockTime = parseInt(process.env.LOCK_TIME_MINUTES || '15');
  
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Otherwise increment
  const updates: any = { $inc: { failedLoginAttempts: 1 } };
  
  // Lock account after max attempts
  const attemptsLeft = maxAttempts - this.failedLoginAttempts - 1;
  if (attemptsLeft <= 0) {
    updates.$set = { lockUntil: new Date(Date.now() + (lockTime * 60 * 1000)) };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function(this: IUser): Promise<any> {
  return this.updateOne({
    $set: { failedLoginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Method to add refresh token
userSchema.methods.addRefreshToken = async function(
  this: IUser, 
  token: string, 
  deviceInfo?: string, 
  ipAddress?: string
): Promise<void> {
  const maxTokens = parseInt(process.env.MAX_REFRESH_TOKENS_PER_USER || '5');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  // Add new token
  this.refreshTokens.push({
    token,
    createdAt: new Date(),
    expiresAt,
    deviceInfo,
    ipAddress
  });
  
  // Remove expired tokens
  this.refreshTokens = this.refreshTokens.filter(rt => rt.expiresAt > new Date());
  
  // Keep only last N tokens
  if (this.refreshTokens.length > maxTokens) {
    this.refreshTokens = this.refreshTokens.slice(-maxTokens);
  }
  
  await this.save();
};

// Method to remove refresh token
userSchema.methods.removeRefreshToken = async function(this: IUser, token: string): Promise<void> {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
  await this.save();
};

// Method to remove all refresh tokens
userSchema.methods.removeAllRefreshTokens = async function(this: IUser): Promise<void> {
  this.refreshTokens = [];
  await this.save();
};

// Transform output (remove sensitive fields)
userSchema.methods.toJSON = function(this: IUser) {
  const user = this.toObject();
  delete (user as any).password;
  delete (user as any).refreshTokens;
  delete (user as any).emailVerificationToken;
  delete (user as any).passwordResetToken;
  delete (user as any).failedLoginAttempts;
  delete (user as any).lockUntil;
  return user;
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
