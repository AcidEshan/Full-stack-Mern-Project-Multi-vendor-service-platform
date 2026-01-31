import { Router } from 'express';
import {
  sendMessage,
  getConversation,
  getConversations,
  markMessageAsRead,
  deleteMessage,
  getUnreadCount,
  searchMessages
} from '../controllers/messageController';
import authenticate from '../middleware/authenticate';

const router = Router();

// All message routes require authentication
router.use(authenticate);

// Send message
router.post('/', sendMessage);

// Get conversations list
router.get('/conversations', getConversations);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Search messages
router.get('/search', searchMessages);

// Get specific conversation
router.get('/conversation/:userId', getConversation);

// Mark message as read
router.patch('/:messageId/read', markMessageAsRead);

// Delete message
router.delete('/:messageId', deleteMessage);

export default router;
