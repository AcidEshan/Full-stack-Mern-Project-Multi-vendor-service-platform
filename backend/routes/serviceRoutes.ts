import express, { Router } from 'express';
import * as serviceController from '../controllers/serviceController';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';

const router: Router = express.Router();

// Public routes
router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getServiceById);

// Vendor routes (protected)
router.post(
  '/vendor/services',
  authenticate,
  authorize('vendor'),
  serviceController.createService
);

router.get(
  '/vendor/services',
  authenticate,
  authorize('vendor'),
  serviceController.getVendorServices
);

router.put(
  '/vendor/services/:id',
  authenticate,
  authorize('vendor'),
  serviceController.updateService
);

router.delete(
  '/vendor/services/:id',
  authenticate,
  authorize('vendor'),
  serviceController.deleteService
);

router.patch(
  '/vendor/services/:id/toggle-active',
  authenticate,
  authorize('vendor'),
  serviceController.toggleServiceActive
);

router.patch(
  '/vendor/services/:id/toggle-availability',
  authenticate,
  authorize('vendor'),
  serviceController.toggleServiceAvailability
);

// Category-based routes (public)
router.get(
  '/categories/:categoryId/services',
  serviceController.getServicesByCategory
);

// Admin routes (protected)
router.get(
  '/admin/services',
  authenticate,
  authorize('admin', 'super_admin'),
  serviceController.adminGetAllServices
);

router.patch(
  '/admin/services/:id/block',
  authenticate,
  authorize('admin', 'super_admin'),
  serviceController.adminBlockService
);

export default router;
