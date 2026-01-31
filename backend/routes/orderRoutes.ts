import express from 'express';
import {
  // User booking operations
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  rescheduleOrder,
  applyCouponToOrder,
  
  // Vendor order management
  getVendorOrders,
  acceptOrder,
  rejectOrder,
  startOrder,
  completeOrder,
  vendorCancelOrder,
  
  // Admin oversight
  adminGetAllOrders,
  adminCancelOrder,
  getOrderStatistics
} from '../controllers/orderController';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';

const router = express.Router();

// ==================== USER ROUTES ====================

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create a new order/booking
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - scheduledDate
 *               - scheduledTime
 *               - customerName
 *               - customerPhone
 *               - customerEmail
 *               - address
 *             properties:
 *               serviceId:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date
 *               scheduledTime:
 *                 type: string
 *               customerName:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *               address:
 *                 type: object
 *               notes:
 *                 type: string
 *               specialRequirements:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post('/', authenticate, createOrder);

/**
 * @swagger
 * /api/v1/orders/my-orders:
 *   get:
 *     summary: Get user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
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
 *         description: Orders retrieved successfully
 */
router.get('/my-orders', authenticate, getMyOrders);

/**
 * @swagger
 * /api/v1/orders/{orderId}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 */
router.get('/:orderId', authenticate, getOrderById);

/**
 * @swagger
 * /api/v1/orders/{orderId}/cancel:
 *   patch:
 *     summary: Cancel order (User)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancellationReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 */
router.patch('/:orderId/cancel', authenticate, cancelOrder);

/**
 * @swagger
 * /api/v1/orders/{orderId}/reschedule:
 *   patch:
 *     summary: Reschedule order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *               - scheduledDate
 *               - scheduledTime
 *             properties:
 *               scheduledDate:
 *                 type: string
 *                 format: date
 *               scheduledTime:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order rescheduled successfully
 */
router.patch('/:orderId/reschedule', authenticate, rescheduleOrder);

/**
 * @swagger
 * /api/v1/orders/{orderId}/apply-coupon:
 *   patch:
 *     summary: Apply coupon to order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *               - couponCode
 *             properties:
 *               couponCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 */
router.patch('/:orderId/apply-coupon', authenticate, applyCouponToOrder);

// ==================== VENDOR ROUTES ====================

/**
 * @swagger
 * /api/v1/orders/vendor/orders:
 *   get:
 *     summary: Get vendor's orders
 *     tags: [Orders - Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
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
 *         description: Orders retrieved successfully
 */
router.get('/vendor/orders', authenticate, authorize('vendor'), getVendorOrders);

/**
 * @swagger
 * /api/v1/orders/vendor/{orderId}/accept:
 *   patch:
 *     summary: Accept order
 *     tags: [Orders - Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vendorNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order accepted successfully
 */
router.patch('/vendor/:orderId/accept', authenticate, authorize('vendor'), acceptOrder);

/**
 * @swagger
 * /api/v1/orders/vendor/{orderId}/reject:
 *   patch:
 *     summary: Reject order
 *     tags: [Orders - Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order rejected successfully
 */
router.patch('/vendor/:orderId/reject', authenticate, authorize('vendor'), rejectOrder);

/**
 * @swagger
 * /api/v1/orders/vendor/{orderId}/start:
 *   patch:
 *     summary: Start order (mark as in progress)
 *     tags: [Orders - Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order started successfully
 */
router.patch('/vendor/:orderId/start', authenticate, authorize('vendor'), startOrder);

/**
 * @swagger
 * /api/v1/orders/vendor/{orderId}/complete:
 *   patch:
 *     summary: Complete order
 *     tags: [Orders - Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vendorNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order completed successfully
 */
router.patch('/vendor/:orderId/complete', authenticate, authorize('vendor'), completeOrder);

/**
 * @swagger
 * /api/v1/orders/vendor/{orderId}/cancel:
 *   patch:
 *     summary: Cancel order (Vendor)
 *     tags: [Orders - Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *               - cancellationReason
 *             properties:
 *               cancellationReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 */
router.patch('/vendor/:orderId/cancel', authenticate, authorize('vendor'), vendorCancelOrder);

// ==================== ADMIN ROUTES ====================

/**
 * @swagger
 * /api/v1/orders/admin/all:
 *   get:
 *     summary: Get all orders (Admin)
 *     tags: [Orders - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
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
 *         description: Orders retrieved successfully
 */
router.get('/admin/all', authenticate, authorize('admin', 'super_admin'), adminGetAllOrders);

/**
 * @swagger
 * /api/v1/orders/admin/statistics:
 *   get:
 *     summary: Get order statistics
 *     tags: [Orders - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/admin/statistics', authenticate, authorize('admin', 'super_admin'), getOrderStatistics);

/**
 * @swagger
 * /api/v1/orders/admin/{orderId}/cancel:
 *   patch:
 *     summary: Cancel order (Admin)
 *     tags: [Orders - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *               - cancellationReason
 *             properties:
 *               cancellationReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 */
router.patch('/admin/:orderId/cancel', authenticate, authorize('admin', 'super_admin'), adminCancelOrder);

export default router;
