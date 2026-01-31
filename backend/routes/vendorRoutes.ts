import express, { Router } from 'express';
import * as vendorController from '../controllers/vendorController';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';

const router: Router = express.Router();

// Public routes
router.get('/', vendorController.getAllVendors);
router.get('/:id/working-hours', vendorController.getVendorWorkingHours);

// Protected routes (require authentication)
router.use(authenticate);

// Get my vendor profile (must be before /:id route)
router.get('/me', authorize('vendor'), vendorController.getMyVendorProfile);

// Vendor working hours & vacation management
router.put('/working-hours', authorize('vendor'), vendorController.updateWorkingHours);
router.post('/vacation', authorize('vendor'), vendorController.setVacationMode);

// Public vendor detail route
router.get('/:id', vendorController.getVendorById);

// Admin and Super Admin: Get pending vendors
router.get('/pending/list', authorize('admin', 'super_admin'), vendorController.getPendingVendors);

// Vendor owner can update their own vendor profile
router.put('/:id', vendorController.updateVendor);

// Enhanced vendor profile management
router.patch('/:id/profile', vendorController.updateVendorProfile);
router.post('/:id/documents', vendorController.uploadVendorDocuments);
router.delete('/:id/documents/:documentId', vendorController.deleteVendorDocument);

// Admin and Super Admin only routes
router.delete('/:id', authorize('admin', 'super_admin'), vendorController.deleteVendor);
router.patch('/:id/approve', authorize('admin', 'super_admin'), vendorController.approveVendor);
router.patch('/:id/reject', authorize('admin', 'super_admin'), vendorController.rejectVendor);
router.patch('/:id/status', authorize('admin', 'super_admin'), vendorController.toggleVendorStatus);

export default router;
