import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import {
  getHealth,
  getSystemStats,
  bulkDeleteUsers,
  bulkUpdateUsers,
  cleanupInactiveUsers,
  getPlatformSettings,
  generateReport,
  triggerBackup,
  cleanupOldData,
  getAuditLogs,
  clearCache
} from '../controllers/adminToolsController';

const router = Router();

// ============================================
// System Health & Monitoring
// ============================================

// Get system health (admin only)
router.get(
  '/health',
  authenticate,
  authorize('super_admin', 'admin'),
  getHealth
);

// Get comprehensive system stats
router.get(
  '/system/stats',
  authenticate,
  authorize('super_admin', 'admin'),
  getSystemStats
);

// ============================================
// Data Management
// ============================================

// Bulk delete users
router.delete(
  '/users/bulk',
  authenticate,
  authorize('super_admin'),
  bulkDeleteUsers
);

// Bulk update users
router.patch(
  '/users/bulk',
  authenticate,
  authorize('super_admin'),
  bulkUpdateUsers
);

// Cleanup inactive users
router.post(
  '/users/cleanup',
  authenticate,
  authorize('super_admin'),
  cleanupInactiveUsers
);

// ============================================
// Platform Settings
// ============================================

// Get platform settings
router.get(
  '/settings',
  authenticate,
  authorize('super_admin', 'admin'),
  getPlatformSettings
);

// ============================================
// Reports
// ============================================

// Generate reports (revenue, users, vendors, orders)
router.get(
  '/reports',
  authenticate,
  authorize('super_admin', 'admin'),
  generateReport
);

// ============================================
// Backup & Maintenance
// ============================================

// Trigger backup
router.post(
  '/backup',
  authenticate,
  authorize('super_admin'),
  triggerBackup
);

// Cleanup old data
router.post(
  '/cleanup',
  authenticate,
  authorize('super_admin'),
  cleanupOldData
);

// ============================================
// Audit Logs
// ============================================

// Get audit logs
router.get(
  '/audit-logs',
  authenticate,
  authorize('super_admin', 'admin'),
  getAuditLogs
);

// ============================================
// Cache Management
// ============================================

// Clear cache
router.post(
  '/cache/clear',
  authenticate,
  authorize('super_admin'),
  clearCache
);

export default router;
