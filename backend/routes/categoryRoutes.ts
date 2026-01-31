import express, { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';

const router: Router = express.Router();

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Admin routes (protected)
router.post(
  '/',
  authenticate,
  authorize('admin', 'super_admin'),
  categoryController.createCategory
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'super_admin'),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'super_admin'),
  categoryController.deleteCategory
);

router.patch(
  '/:id/toggle-active',
  authenticate,
  authorize('admin', 'super_admin'),
  categoryController.toggleCategoryStatus
);

export default router;
