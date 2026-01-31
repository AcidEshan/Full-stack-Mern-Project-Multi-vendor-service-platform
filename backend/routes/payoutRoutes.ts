import express from 'express';
import {
  requestPayout,
  getVendorPayouts,
  getPayoutById,
  getAllPayouts,
  processPayout,
  completePayout,
  getPayoutStatistics
} from '../controllers/payoutController';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';

const router = express.Router();

// ==================== VENDOR ROUTES ====================
router.post('/request', authenticate, authorize('vendor'), requestPayout);
router.get('/my-payouts', authenticate, authorize('vendor'), getVendorPayouts);
router.get('/:payoutId', authenticate, getPayoutById);

// ==================== ADMIN ROUTES ====================
router.get('/admin/all', authenticate, authorize('admin', 'super_admin'), getAllPayouts);
router.get('/admin/statistics', authenticate, authorize('admin', 'super_admin'), getPayoutStatistics);
router.patch('/:payoutId/process', authenticate, authorize('admin', 'super_admin'), processPayout);
router.patch('/:payoutId/complete', authenticate, authorize('admin', 'super_admin'), completePayout);

export default router;
