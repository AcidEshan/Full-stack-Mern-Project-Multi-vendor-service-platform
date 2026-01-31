import mongoose, { Document, Schema } from 'mongoose';

// Interface for Favorite document
export interface IFavorite extends Document {
  userId: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  vendorId?: mongoose.Types.ObjectId;
  type: 'service' | 'vendor';
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: function(this: IFavorite) { return this.type === 'service'; }
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: function(this: IFavorite) { return this.type === 'vendor'; }
    },
    type: {
      type: String,
      enum: ['service', 'vendor'],
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes to prevent duplicate favorites
// For service favorites: unique combination of userId + serviceId + type
favoriteSchema.index(
  { userId: 1, serviceId: 1, type: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { type: 'service', serviceId: { $exists: true } }
  }
);

// For vendor favorites: unique combination of userId + vendorId + type
favoriteSchema.index(
  { userId: 1, vendorId: 1, type: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { type: 'vendor', vendorId: { $exists: true } }
  }
);

const Favorite = mongoose.model<IFavorite>('Favorite', favoriteSchema);

export default Favorite;
