import express from 'express';
import {
  validateCoupon,
  getAvailableCoupons,
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCouponStatistics
} from '../controllers/couponController';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';

const router = express.Router();

// ==================== USER ROUTES ====================
router.post('/validate', authenticate, validateCoupon);
router.get('/available', authenticate, getAvailableCoupons);

// ==================== ADMIN ROUTES ====================
// IMPORTANT: Specific routes must come BEFORE parameterized routes (/:couponId)
router.get('/admin/all', authenticate, authorize('admin', 'super_admin'), getAllCoupons);
router.get('/admin/statistics', authenticate, authorize('admin', 'super_admin'), getCouponStatistics);

// Coupon CRUD operations
router.post('/', authenticate, authorize('admin', 'super_admin'), createCoupon);
router.get('/:couponId', authenticate, authorize('admin', 'super_admin'), getCouponById);
router.put('/:couponId', authenticate, authorize('admin', 'super_admin'), updateCoupon);
router.delete('/:couponId', authenticate, authorize('admin', 'super_admin'), deleteCoupon);
router.patch('/:couponId/toggle-status', authenticate, authorize('admin', 'super_admin'), toggleCouponStatus);

export default router;
