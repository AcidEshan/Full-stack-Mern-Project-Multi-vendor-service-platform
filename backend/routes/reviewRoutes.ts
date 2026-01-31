import express from 'express';
import {
  // User review operations
  createReview,
  getMyReviews,
  updateReview,
  deleteReview,
  
  // Public review browsing
  getServiceReviews,
  getVendorReviews,
  getReviewById,
  
  // Vendor review management
  respondToReview,
  updateVendorResponse,
  
  // Admin review moderation
  toggleReviewVisibility,
  adminDeleteReview,
  adminGetAllReviews,
  getReviewStatistics
} from '../controllers/reviewController';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

/**
 * @swagger
 * /api/v1/reviews/service/{serviceId}:
 *   get:
 *     summary: Get reviews for a service
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 */
router.get('/service/:serviceId', getServiceReviews);

/**
 * @swagger
 * /api/v1/reviews/vendor/{vendorId}:
 *   get:
 *     summary: Get reviews for a vendor
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 */
router.get('/vendor/:vendorId', getVendorReviews);

/**
 * @swagger
 * /api/v1/reviews/{reviewId}:
 *   get:
 *     summary: Get review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review details retrieved successfully
 */
router.get('/:reviewId', getReviewById);

// ==================== USER ROUTES ====================

/**
 * @swagger
 * /api/v1/reviews:
 *   post:
 *     summary: Submit a review for completed order
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - rating
 *               - comment
 *             properties:
 *               orderId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Review submitted successfully
 */
router.post('/', authenticate, createReview);

/**
 * @swagger
 * /api/v1/reviews/my-reviews:
 *   get:
 *     summary: Get user's reviews
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 */
router.get('/my-reviews', authenticate, getMyReviews);

/**
 * @swagger
 * /api/v1/reviews/{reviewId}:
 *   put:
 *     summary: Update review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 */
router.put('/:reviewId', authenticate, updateReview);

/**
 * @swagger
 * /api/v1/reviews/{reviewId}:
 *   delete:
 *     summary: Delete review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted successfully
 */
router.delete('/:reviewId', authenticate, deleteReview);

// ==================== VENDOR ROUTES ====================

/**
 * @swagger
 * /api/v1/reviews/{reviewId}/respond:
 *   post:
 *     summary: Respond to review
 *     tags: [Reviews - Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - response
 *             properties:
 *               response:
 *                 type: string
 *     responses:
 *       200:
 *         description: Response added successfully
 */
router.post('/:reviewId/respond', authenticate, authorize('vendor'), respondToReview);

/**
 * @swagger
 * /api/v1/reviews/{reviewId}/respond:
 *   put:
 *     summary: Update vendor response
 *     tags: [Reviews - Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - response
 *             properties:
 *               response:
 *                 type: string
 *     responses:
 *       200:
 *         description: Response updated successfully
 */
router.put('/:reviewId/respond', authenticate, authorize('vendor'), updateVendorResponse);

// ==================== ADMIN ROUTES ====================

/**
 * @swagger
 * /api/v1/reviews/admin/all:
 *   get:
 *     summary: Get all reviews (Admin)
 *     tags: [Reviews - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isVisible
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 */
router.get('/admin/all', authenticate, authorize('admin', 'super_admin'), adminGetAllReviews);

/**
 * @swagger
 * /api/v1/reviews/admin/statistics:
 *   get:
 *     summary: Get review statistics
 *     tags: [Reviews - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/admin/statistics', authenticate, authorize('admin', 'super_admin'), getReviewStatistics);

/**
 * @swagger
 * /api/v1/reviews/{reviewId}/visibility:
 *   patch:
 *     summary: Hide/unhide review
 *     tags: [Reviews - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isVisible
 *             properties:
 *               isVisible:
 *                 type: boolean
 *               moderationNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review visibility updated successfully
 */
router.patch('/:reviewId/visibility', authenticate, authorize('admin', 'super_admin'), toggleReviewVisibility);

/**
 * @swagger
 * /api/v1/reviews/admin/{reviewId}:
 *   delete:
 *     summary: Delete review (Admin)
 *     tags: [Reviews - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted successfully
 */
router.delete('/admin/:reviewId', authenticate, authorize('admin', 'super_admin'), adminDeleteReview);

export default router;
