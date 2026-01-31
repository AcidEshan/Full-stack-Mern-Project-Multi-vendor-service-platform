import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import {
  getMyNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  getPreferences,
  updatePreferences,
  sendSystemNotification,
  sendNotificationToUser,
  getAllNotifications,
  deleteNotifications
} from '../controllers/notificationController';

const router = Router();

// ============================================
// User Routes
// ============================================

// Get my notifications
router.get('/my', authenticate, getMyNotifications);

// Get unread count
router.get('/unread-count', authenticate, getUnreadCount);

// Get notification by ID
router.get('/:id', authenticate, getNotificationById);

// Mark notification as read
router.patch('/:id/read', authenticate, markAsRead);

// Mark all as read
router.patch('/mark-all-read', authenticate, markAllAsRead);

// Delete notification
router.delete('/:id', authenticate, deleteNotification);

// Delete all read notifications
router.delete('/read/all', authenticate, deleteAllRead);

// Get notification preferences
router.get('/preferences/me', authenticate, getPreferences);

// Update notification preferences
router.put('/preferences/me', authenticate, updatePreferences);

// ============================================
// Admin Routes
// ============================================

// Send system notification to all users
router.post(
  '/admin/system',
  authenticate,
  authorize('super_admin', 'admin'),
  sendSystemNotification
);

// Send notification to specific user
router.post(
  '/admin/user/:userId',
  authenticate,
  authorize('super_admin', 'admin'),
  sendNotificationToUser
);

// Get all notifications (admin)
router.get(
  '/admin/all',
  authenticate,
  authorize('super_admin', 'admin'),
  getAllNotifications
);

// Delete notifications by criteria
router.delete(
  '/admin/bulk',
  authenticate,
  authorize('super_admin', 'admin'),
  deleteNotifications
);

export default router;
