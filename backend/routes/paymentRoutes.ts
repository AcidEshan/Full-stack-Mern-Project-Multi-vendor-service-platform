import express from 'express';
import {
  // Payment initiation
  createPaymentIntent,
  confirmPayment,
  
  // Webhook
  handleStripeWebhook,
  
  // Transaction management
  getMyTransactions,
  getVendorTransactions,
  getTransactionById,
  
  // Admin operations
  adminGetAllTransactions,
  processRefund,
  getRevenueStatistics,
  
  // SSLCommerz
  initSSLCommerzPayment,
  sslcommerzPaymentSuccess,
  sslcommerzPaymentFail,
  sslcommerzPaymentCancel,
  sslcommerzIPN,
  validateSSLCommerzTransaction,
  querySSLCommerzTransaction,
  initiateSSLCommerzRefund,
  querySSLCommerzRefund,
  
  // Manual payment verification
  getPendingPaymentVerifications,
  verifyManualPayment,
  uploadPaymentProof,
  getPaymentVerificationStats
} from '../controllers/paymentController';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

/**
 * @swagger
 * /api/v1/payments/webhook/stripe:
 *   post:
 *     summary: Stripe webhook handler
 *     tags: [Payments]
 *     description: Receives webhook events from Stripe
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

// ==================== USER ROUTES ====================

/**
 * @swagger
 * /api/v1/payments/create-intent:
 *   post:
 *     summary: Create payment intent for order
 *     tags: [Payments]
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
 *             properties:
 *               orderId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 default: stripe
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 */
router.post('/create-intent', authenticate, createPaymentIntent);

/**
 * @swagger
 * /api/v1/payments/confirm:
 *   post:
 *     summary: Confirm payment (for non-Stripe methods)
 *     tags: [Payments]
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
 *               - paymentMethod
 *             properties:
 *               orderId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *               paymentDetails:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment confirmation received
 */
router.post('/confirm', authenticate, confirmPayment);

/**
 * @swagger
 * /api/v1/payments/my-transactions:
 *   get:
 *     summary: Get user's transactions
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
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
 *         description: Transactions retrieved successfully
 */
router.get('/my-transactions', authenticate, getMyTransactions);
// Alias for compatibility with frontend
router.get('/user/transactions', authenticate, getMyTransactions);

/**
 * @swagger
 * /api/v1/payments/{transactionId}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction details retrieved successfully
 */
router.get('/:transactionId', authenticate, getTransactionById);

// ==================== VENDOR ROUTES ====================

/**
 * @swagger
 * /api/v1/payments/vendor/transactions:
 *   get:
 *     summary: Get vendor's transactions
 *     tags: [Payments - Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
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
 *         description: Transactions retrieved successfully
 */
router.get('/vendor/transactions', authenticate, authorize('vendor'), getVendorTransactions);

// ==================== ADMIN ROUTES ====================

/**
 * @swagger
 * /api/v1/payments/admin/transactions:
 *   get:
 *     summary: Get all transactions (Admin)
 *     tags: [Payments - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: vendorId
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
 *         description: Transactions retrieved successfully
 */
router.get('/admin/transactions', authenticate, authorize('admin', 'super_admin'), adminGetAllTransactions);

/**
 * @swagger
 * /api/v1/payments/admin/revenue:
 *   get:
 *     summary: Get revenue statistics
 *     tags: [Payments - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: vendorId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Revenue statistics retrieved successfully
 */
router.get('/admin/revenue', authenticate, authorize('admin', 'super_admin'), getRevenueStatistics);

/**
 * @swagger
 * /api/v1/payments/admin/{transactionId}/refund:
 *   post:
 *     summary: Process refund
 *     tags: [Payments - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed successfully
 */
router.post('/admin/:transactionId/refund', authenticate, authorize('admin', 'super_admin'), processRefund);

// ==================== SSLCOMMERZ ROUTES ====================

/**
 * @swagger
 * /api/v1/payments/sslcommerz/init:
 *   post:
 *     summary: Initialize SSLCommerz payment
 *     tags: [Payments - SSLCommerz]
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
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 */
router.post('/sslcommerz/init', authenticate, initSSLCommerzPayment);

/**
 * @swagger
 * /api/v1/payments/sslcommerz/success:
 *   post:
 *     summary: SSLCommerz payment success callback
 *     tags: [Payments - SSLCommerz]
 *     responses:
 *       200:
 *         description: Payment processed successfully
 */
router.post('/sslcommerz/success', sslcommerzPaymentSuccess);

/**
 * @swagger
 * /api/v1/payments/sslcommerz/fail:
 *   post:
 *     summary: SSLCommerz payment failure callback
 *     tags: [Payments - SSLCommerz]
 *     responses:
 *       200:
 *         description: Payment failure handled
 */
router.post('/sslcommerz/fail', sslcommerzPaymentFail);

/**
 * @swagger
 * /api/v1/payments/sslcommerz/cancel:
 *   post:
 *     summary: SSLCommerz payment cancellation callback
 *     tags: [Payments - SSLCommerz]
 *     responses:
 *       200:
 *         description: Payment cancellation handled
 */
router.post('/sslcommerz/cancel', sslcommerzPaymentCancel);

/**
 * @swagger
 * /api/v1/payments/sslcommerz/ipn:
 *   post:
 *     summary: SSLCommerz IPN (Instant Payment Notification)
 *     tags: [Payments - SSLCommerz]
 *     responses:
 *       200:
 *         description: IPN processed successfully
 */
router.post('/sslcommerz/ipn', sslcommerzIPN);

/**
 * @swagger
 * /api/v1/payments/sslcommerz/validate:
 *   post:
 *     summary: Validate SSLCommerz transaction
 *     tags: [Payments - SSLCommerz]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *               - validationId
 *             properties:
 *               transactionId:
 *                 type: string
 *               validationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Validation result returned
 */
router.post('/sslcommerz/validate', authenticate, authorize('admin', 'super_admin'), validateSSLCommerzTransaction);

/**
 * @swagger
 * /api/v1/payments/sslcommerz/query/{transactionNumber}:
 *   get:
 *     summary: Query SSLCommerz transaction status
 *     tags: [Payments - SSLCommerz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction status retrieved
 */
router.get('/sslcommerz/query/:transactionNumber', authenticate, authorize('admin', 'super_admin'), querySSLCommerzTransaction);

/**
 * @swagger
 * /api/v1/payments/sslcommerz/refund:
 *   post:
 *     summary: Initiate SSLCommerz refund
 *     tags: [Payments - SSLCommerz]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *               - refundAmount
 *             properties:
 *               transactionId:
 *                 type: string
 *               refundAmount:
 *                 type: number
 *               refundReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund initiated successfully
 */
router.post('/sslcommerz/refund', authenticate, authorize('admin', 'super_admin'), initiateSSLCommerzRefund);

/**
 * @swagger
 * /api/v1/payments/sslcommerz/refund-query/{refundRefId}:
 *   get:
 *     summary: Query SSLCommerz refund status
 *     tags: [Payments - SSLCommerz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: refundRefId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Refund status retrieved
 */
router.get('/sslcommerz/refund-query/:refundRefId', authenticate, authorize('admin', 'super_admin'), querySSLCommerzRefund);

// ==================== MANUAL PAYMENT VERIFICATION ====================

/**
 * @swagger
 * /api/v1/payments/:transactionId/upload-proof:
 *   post:
 *     summary: Upload payment proof for cash/bank transfer
 *     tags: [Payments - Manual]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
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
 *               - proofImageUrl
 *             properties:
 *               proofImageUrl:
 *                 type: string
 *               proofDetails:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment proof uploaded successfully
 */
router.post('/:transactionId/upload-proof', authenticate, uploadPaymentProof);

/**
 * @swagger
 * /api/v1/payments/admin/pending-verifications:
 *   get:
 *     summary: Get all pending manual payment verifications
 *     tags: [Payments - Admin]
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
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [CASH, BANK_TRANSFER]
 *     responses:
 *       200:
 *         description: Pending verifications retrieved successfully
 */
router.get('/admin/pending-verifications', authenticate, authorize('admin', 'super_admin'), getPendingPaymentVerifications);

/**
 * @swagger
 * /api/v1/payments/admin/:transactionId/verify:
 *   post:
 *     summary: Verify and approve/reject manual payment
 *     tags: [Payments - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
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
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               notes:
 *                 type: string
 *               referenceNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified successfully
 */
router.post('/admin/:transactionId/verify', authenticate, authorize('admin', 'super_admin'), verifyManualPayment);

/**
 * @swagger
 * /api/v1/payments/admin/verification-stats:
 *   get:
 *     summary: Get payment verification statistics
 *     tags: [Payments - Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/admin/verification-stats', authenticate, authorize('admin', 'super_admin'), getPaymentVerificationStats);

export default router;
