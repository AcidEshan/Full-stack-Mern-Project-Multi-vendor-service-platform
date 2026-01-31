import mongoose, { Document, Schema } from 'mongoose';

// Interface for Message document
export interface IMessage extends Document {
  conversationId: string;
  senderId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  message: string;
  messageType: 'text' | 'image' | 'document' | 'system';
  attachments?: {
    fileId: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
  }[];
  relatedOrderId?: mongoose.Types.ObjectId;
  isRead: boolean;
  readAt?: Date;
  isDeleted: boolean;
  deletedBy?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: String,
      required: true,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters']
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'document', 'system'],
      default: 'text'
    },
    attachments: [{
      fileId: { type: String, required: true },
      fileName: { type: String, required: true },
      fileType: { type: String, required: true },
      fileUrl: { type: String, required: true }
    }],
    relatedOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, isRead: 1 });
messageSchema.index({ recipientId: 1, isRead: 1 });

// Generate conversation ID from two user IDs (ensures consistency)
export function generateConversationId(userId1: string, userId2: string): string {
  const ids = [userId1.toString(), userId2.toString()].sort();
  return `${ids[0]}_${ids[1]}`;
}

const Message = mongoose.model<IMessage>('Message', messageSchema);

export default Message;
