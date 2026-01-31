import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import {
  getDashboardOverview,
  getRevenueAnalytics,
  getUserAnalytics,
  getVendorAnalyticsOverview,
  getVendorAnalytics,
  getServiceAnalytics,
  getOrderAnalytics,
  getSearchAnalytics,
  trackEvent,
  generateReport
} from '../controllers/analyticsController';

const router = Router();

// ============================================
// Public/User Routes (Event Tracking)
// ============================================

// Track analytics event (can be used by authenticated or anonymous users)
router.post('/track', trackEvent);

// ============================================
// Admin Analytics Routes
// ============================================

// Dashboard overview
router.get(
  '/dashboard',
  authenticate,
  authorize('super_admin', 'admin'),
  getDashboardOverview
);

// Revenue analytics
router.get(
  '/revenue',
  authenticate,
  authorize('super_admin', 'admin'),
  getRevenueAnalytics
);

// User analytics
router.get(
  '/users',
  authenticate,
  authorize('super_admin', 'admin'),
  getUserAnalytics
);

// Vendor analytics overview (all vendors)
router.get(
  '/vendors',
  authenticate,
  authorize('super_admin', 'admin'),
  getVendorAnalyticsOverview
);

// Specific vendor analytics (requires vendorId query param)
router.get(
  '/vendors/details',
  authenticate,
  authorize('super_admin', 'admin'),
  getVendorAnalytics
);

// Service analytics
router.get(
  '/services',
  authenticate,
  authorize('super_admin', 'admin'),
  getServiceAnalytics
);

// Order analytics
router.get(
  '/orders',
  authenticate,
  authorize('super_admin', 'admin'),
  getOrderAnalytics
);

// Search analytics
router.get(
  '/search',
  authenticate,
  authorize('super_admin', 'admin'),
  getSearchAnalytics
);
// ============================================
// Report Generation
// ============================================

// Generate comprehensive analytics report
router.post(
  '/generate-report',
  authenticate,
  authorize('super_admin', 'admin'),
  generateReport
);
export default router;
