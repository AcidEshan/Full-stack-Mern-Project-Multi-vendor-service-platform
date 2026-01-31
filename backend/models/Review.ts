import mongoose, { Document, Schema } from 'mongoose';

// Review document interface
export interface IReview extends Document {
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  vendor: mongoose.Types.ObjectId;
  service: mongoose.Types.ObjectId;
  
  // Rating and feedback
  rating: number;
  comment: string;
  images?: string[];
  
  // Vendor response
  vendorResponse?: string;
  vendorRespondedAt?: Date;
  
  // Moderation
  isVisible: boolean;
  isVerifiedPurchase: boolean;
  moderatedBy?: mongoose.Types.ObjectId;
  moderationNotes?: string;
  
  // Engagement
  helpfulCount: number;
  reportCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Review schema
const reviewSchema = new Schema<IReview>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true, // One review per order
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: [10, 'Comment must be at least 10 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    images: [{
      type: String,
      trim: true
    }],
    vendorResponse: {
      type: String,
      trim: true,
      maxlength: [500, 'Response cannot exceed 500 characters']
    },
    vendorRespondedAt: {
      type: Date
    },
    isVisible: {
      type: Boolean,
      default: true,
      index: true
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: true
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    moderationNotes: {
      type: String,
      trim: true,
      maxlength: 500
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
reviewSchema.index({ user: 1, service: 1 });
reviewSchema.index({ vendor: 1, isVisible: 1 });
reviewSchema.index({ service: 1, isVisible: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

// Static method to calculate average rating
reviewSchema.statics.calculateAverageRating = async function (
  targetId: string,
  targetType: 'service' | 'vendor'
) {
  const match: any = { isVisible: true };
  if (targetType === 'service') {
    match.service = new mongoose.Types.ObjectId(targetId);
  } else {
    match.vendor = new mongoose.Types.ObjectId(targetId);
  }

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  return result[0] || { averageRating: 0, totalReviews: 0 };
};

// Static method to get rating distribution
reviewSchema.statics.getRatingDistribution = async function (
  targetId: string,
  targetType: 'service' | 'vendor'
) {
  const match: any = { isVisible: true };
  if (targetType === 'service') {
    match.service = new mongoose.Types.ObjectId(targetId);
  } else {
    match.vendor = new mongoose.Types.ObjectId(targetId);
  }

  const distribution = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);

  // Format as object: { 5: 10, 4: 5, 3: 2, 2: 1, 1: 0 }
  const result: any = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  distribution.forEach((item) => {
    result[item._id] = item.count;
  });

  return result;
};

// Post-save middleware to update service and vendor ratings
reviewSchema.post('save', async function () {
  try {
    const Review = this.constructor as any;

    // Update service rating
    const serviceStats = await Review.calculateAverageRating(
      this.service.toString(),
      'service'
    );

    await mongoose.model('Service').findByIdAndUpdate(this.service, {
      rating: Math.round(serviceStats.averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: serviceStats.totalReviews
    });

    // Update vendor rating
    const vendorStats = await Review.calculateAverageRating(
      this.vendor.toString(),
      'vendor'
    );

    await mongoose.model('Vendor').findByIdAndUpdate(this.vendor, {
      rating: Math.round(vendorStats.averageRating * 10) / 10,
      totalReviews: vendorStats.totalReviews
    });
  } catch (error) {
    console.error('Error updating ratings:', error);
  }
});

// Post-delete middleware to update ratings
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    try {
      const Review = mongoose.model('Review');

      // Update service rating
      const serviceStats = await (Review as any).calculateAverageRating(
        doc.service.toString(),
        'service'
      );

      await mongoose.model('Service').findByIdAndUpdate(doc.service, {
        rating: Math.round(serviceStats.averageRating * 10) / 10,
        totalReviews: serviceStats.totalReviews
      });

      // Update vendor rating
      const vendorStats = await (Review as any).calculateAverageRating(
        doc.vendor.toString(),
        'vendor'
      );

      await mongoose.model('Vendor').findByIdAndUpdate(doc.vendor, {
        rating: Math.round(vendorStats.averageRating * 10) / 10,
        totalReviews: vendorStats.totalReviews
      });
    } catch (error) {
      console.error('Error updating ratings after delete:', error);
    }
  }
});

export const Review = mongoose.model<IReview>('Review', reviewSchema);
