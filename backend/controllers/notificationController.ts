import { Request, Response, NextFunction } from 'express';
import { Notification, NotificationType, NotificationPriority } from '../models/Notification';
import { User } from '../models/User';

// Get all notifications for current user
export const getMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;
    const { page = 1, limit = 20, type, isRead } = req.query;

    // Build filter
    const filter: any = { user: userId };
    if (type) {
      filter.type = type;
    }
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('relatedOrder', 'orderNumber status')
        .populate('relatedTransaction', 'transactionNumber amount')
        .populate('relatedReview', 'rating')
        .populate('relatedVendor', 'businessName'),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: userId, isRead: false })
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      },
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

// Get unread notification count
export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;
    const count = await Notification.getUnreadCount(userId.toString());

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
};

// Get notification by ID
export const getNotificationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const notification = await Notification.findOne({ _id: id, user: userId })
      .populate('relatedOrder', 'orderNumber status totalAmount')
      .populate('relatedTransaction', 'transactionNumber amount status')
      .populate('relatedReview', 'rating comment')
      .populate('relatedVendor', 'businessName contactEmail');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId, isRead: false },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or already read'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;

    const modifiedCount = await Notification.markAllAsRead(userId.toString());

    res.status(200).json({
      success: true,
      message: `${modifiedCount} notifications marked as read`
    });
  } catch (error) {
    next(error);
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const notification = await Notification.findOneAndDelete({ _id: id, user: userId });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete all read notifications
export const deleteAllRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;

    const result = await Notification.deleteMany({ user: userId, isRead: true });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} read notifications deleted`
    });
  } catch (error) {
    next(error);
  }
};

// Get notification preferences
export const getPreferences = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;

    const user = await User.findById(userId).select('notificationPreferences');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.notificationPreferences || {
        email: {
          orderUpdates: true,
          paymentUpdates: true,
          reviewNotifications: true,
          promotions: false
        },
        push: {
          orderUpdates: true,
          paymentUpdates: true,
          reviewNotifications: true,
          promotions: false
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update notification preferences
export const updatePreferences = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;
    const { email, push } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'notificationPreferences.email': email,
          'notificationPreferences.push': push
        }
      },
      { new: true }
    ).select('notificationPreferences');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated',
      data: user.notificationPreferences
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Send system notification to all users
export const sendSystemNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, message, priority = NotificationPriority.MEDIUM, link } = req.body;

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // Get all users
    const users = await User.find({ isActive: true }).select('_id');

    // Create notifications for all users
    const notifications = users.map(user => ({
      user: user._id,
      type: NotificationType.SYSTEM,
      title,
      message,
      link,
      priority
    }));

    const result = await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: `System notification sent to ${result.length} users`,
      data: {
        count: result.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Send notification to specific user
export const sendNotificationToUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { type, title, message, priority = NotificationPriority.MEDIUM, link, metadata } = req.body;

    // Validate required fields
    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Type, title, and message are required'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create notification
    const notification = await Notification.createNotification({
      user: userId,
      type,
      title,
      message,
      link,
      priority,
      metadata
    });

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all notifications (with filters)
export const getAllNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 50, type, priority, isRead, userId } = req.query;

    // Build filter
    const filter: any = {};
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (userId) filter.user = userId;

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('user', 'name email')
        .populate('relatedOrder', 'orderNumber')
        .populate('relatedVendor', 'businessName'),
      Notification.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete notifications by criteria
export const deleteNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { olderThan, type, isRead } = req.query;

    // Build filter
    const filter: any = {};
    
    if (olderThan) {
      const date = new Date();
      date.setDate(date.getDate() - Number(olderThan));
      filter.createdAt = { $lt: date };
    }
    
    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    // Prevent deleting all notifications without criteria
    if (Object.keys(filter).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one filter criteria is required'
      });
    }

    const result = await Notification.deleteMany(filter);

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} notifications deleted`
    });
  } catch (error) {
    next(error);
  }
};
