import express, { Router } from 'express';
import * as userController from '../controllers/userController';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';

const router: Router = express.Router();

// All routes require authentication
router.use(authenticate);

// User's own profile update (user or vendor can update their own profile)
router.put('/me', authorize('user', 'vendor'), userController.updateMyProfile);

// Delete profile picture
router.delete('/me/profile-picture', authorize('user', 'vendor'), userController.deleteProfilePicture);

// User's own address management (requires user role)
router.get('/addresses', authorize('user'), userController.getAddresses);
router.post('/addresses', authorize('user'), userController.addAddress);
router.put('/addresses/:addressId', authorize('user'), userController.updateAddress);
router.delete('/addresses/:addressId', authorize('user'), userController.deleteAddress);

// Admin routes (require admin/super_admin role)
router.get('/', authorize('admin', 'super_admin'), userController.getAllUsers);
router.get('/:id', authorize('admin', 'super_admin'), userController.getUserById);
router.put('/:id', authorize('admin', 'super_admin'), userController.updateUser);
router.delete('/:id', authorize('admin', 'super_admin'), userController.deleteUser);
router.patch('/:id/block', authorize('admin', 'super_admin'), userController.toggleBlockUser);

export default router;
