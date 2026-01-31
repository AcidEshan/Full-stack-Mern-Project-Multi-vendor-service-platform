import { Router } from 'express';
import {
  addServiceToFavorites,
  addVendorToFavorites,
  removeServiceFromFavorites,
  removeVendorFromFavorites,
  getFavoriteServices,
  getFavoriteVendors,
  checkServiceInFavorites,
  checkVendorInFavorites
} from '../controllers/favoriteController';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';

const router = Router();

// All favorite routes require authentication
router.use(authenticate);

// Add to favorites (both users and vendors can favorite)
router.post('/service/:serviceId', authorize('user', 'vendor'), addServiceToFavorites);
router.post('/vendor/:vendorId', authorize('user', 'vendor'), addVendorToFavorites);

// Remove from favorites
router.delete('/service/:serviceId', authorize('user', 'vendor'), removeServiceFromFavorites);
router.delete('/vendor/:vendorId', authorize('user', 'vendor'), removeVendorFromFavorites);

// Get favorites
router.get('/services', authorize('user', 'vendor'), getFavoriteServices);
router.get('/vendors', authorize('user', 'vendor'), getFavoriteVendors);

// Check if in favorites
router.get('/service/:serviceId/check', authorize('user', 'vendor'), checkServiceInFavorites);
router.get('/vendor/:vendorId/check', authorize('user', 'vendor'), checkVendorInFavorites);

export default router;
