import { Request, Response, NextFunction } from 'express';
import Message, { generateConversationId } from '../models/Message';
import User from '../models/User';
import Vendor from '../models/Vendor';

// @desc    Send a message
// @route   POST /api/v1/messages
// @access  Private
export const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { recipientId, message, messageType = 'text', attachments, relatedOrderId } = req.body;
    const senderId = req.user!._id;

    // Validate required fields
    if (!recipientId || !message) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Recipient ID and message content are required'
        }
      });
      return;
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      res.status(404).json({
        success: false,
        error: {
          code: 'RECIPIENT_NOT_FOUND',
          message: 'Recipient not found'
        }
      });
      return;
    }

    // Generate conversation ID
    const conversationId = generateConversationId(senderId.toString(), recipientId);

    // Create message
    const newMessage = await Message.create({
      conversationId,
      senderId,
      recipientId,
      message: message.trim(),
      messageType,
      attachments: attachments || [],
      relatedOrderId
    });

    // Populate sender and recipient details
    await newMessage.populate([
      { path: 'senderId', select: 'firstName lastName profileImage role' },
      { path: 'recipientId', select: 'firstName lastName profileImage role' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: newMessage }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get conversation messages between two users
// @route   GET /api/v1/messages/conversation/:userId
// @access  Private
export const getConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!._id;
    const { page = 1, limit = 50 } = req.query;

    // Generate conversation ID
    const conversationId = generateConversationId(currentUserId.toString(), userId);

    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      Message.find({
        conversationId,
        isDeleted: false,
        $nor: [{ deletedBy: currentUserId }]
      })
        .populate('senderId', 'firstName lastName profileImage role')
        .populate('recipientId', 'firstName lastName profileImage role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Message.countDocuments({
        conversationId,
        isDeleted: false,
        $nor: [{ deletedBy: currentUserId }]
      })
    ]);

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        recipientId: currentUserId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in ascending order
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all conversations for current user
// @route   GET /api/v1/messages/conversations
// @access  Private
export const getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;

    // Get all messages where user is sender or recipient
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { recipientId: userId }
          ],
          isDeleted: false,
          deletedBy: { $ne: userId }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipientId', userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Populate user details
    const populatedConversations = await Message.populate(messages, [
      { path: 'lastMessage.senderId', select: 'firstName lastName profileImage role' },
      { path: 'lastMessage.recipientId', select: 'firstName lastName profileImage role' }
    ]);

    // Format conversations - filter out any with deleted users
    const conversations = populatedConversations
      .filter((conv: any) => {
        // Skip conversations where sender or recipient is null (user deleted)
        return conv.lastMessage.senderId && conv.lastMessage.recipientId;
      })
      .map((conv: any) => {
        const otherUser = conv.lastMessage.senderId._id.toString() === userId.toString()
          ? conv.lastMessage.recipientId
          : conv.lastMessage.senderId;

        return {
          conversationId: conv._id,
          otherUser,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount
        };
      });

    res.status(200).json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark message as read
// @route   PATCH /api/v1/messages/:messageId/read
// @access  Private
export const markMessageAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { messageId } = req.params;
    const userId = req.user!._id;

    const message = await Message.findOne({ _id: messageId, recipientId: userId });
    if (!message) {
      res.status(404).json({
        success: false,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: 'Message not found'
        }
      });
      return;
    }

    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    res.status(200).json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete message (soft delete)
// @route   DELETE /api/v1/messages/:messageId
// @access  Private
export const deleteMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { messageId } = req.params;
    const userId = req.user!._id;

    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404).json({
        success: false,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: 'Message not found'
        }
      });
      return;
    }

    // Check if user is part of this conversation
    if (message.senderId.toString() !== userId.toString() && message.recipientId.toString() !== userId.toString()) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You cannot delete this message'
        }
      });
      return;
    }

    // Add user to deletedBy array
    if (!message.deletedBy) {
      message.deletedBy = [];
    }
    if (!message.deletedBy.includes(userId)) {
      message.deletedBy.push(userId);
    }

    // If both users deleted, mark as fully deleted
    if (message.deletedBy.length >= 2) {
      message.isDeleted = true;
    }

    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread message count
// @route   GET /api/v1/messages/unread-count
// @access  Private
export const getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;

    const unreadCount = await Message.countDocuments({
      recipientId: userId,
      isRead: false,
      isDeleted: false
    });

    res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search messages
// @route   GET /api/v1/messages/search
// @access  Private
export const searchMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { query, page = 1, limit = 20 } = req.query;

    if (!query) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Search query is required'
        }
      });
      return;
    }

    const searchRegex = new RegExp(query as string, 'i');
    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      Message.find({
        $or: [
          { senderId: userId },
          { recipientId: userId }
        ],
        message: searchRegex,
        isDeleted: false,
        $nor: [{ deletedBy: userId }]
      })
        .populate('senderId', 'firstName lastName profileImage')
        .populate('recipientId', 'firstName lastName profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Message.countDocuments({
        $or: [
          { senderId: userId },
          { recipientId: userId }
        ],
        message: searchRegex,
        isDeleted: false,
        $nor: [{ deletedBy: userId }]
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
