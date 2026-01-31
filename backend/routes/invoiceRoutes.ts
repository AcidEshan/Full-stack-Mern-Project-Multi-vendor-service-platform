import express from 'express';
import {
  generateOrderInvoice,
  generateOrderReceipt,
  emailOrderInvoice,
  getMyInvoices
} from '../controllers/invoiceController';
import authenticate from '../middleware/authenticate';

const router = express.Router();

/**
 * @swagger
 * /api/v1/invoices/my-invoices:
 *   get:
 *     summary: Get all invoices for logged-in user
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of invoices retrieved successfully
 */
router.get('/my-invoices', authenticate, getMyInvoices);

/**
 * @swagger
 * /api/v1/invoices/order/{orderId}:
 *   get:
 *     summary: Generate and download invoice PDF for an order
 *     tags: [Invoices]
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
 *         description: Invoice PDF generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Order or transaction not found
 */
router.get('/order/:orderId', authenticate, generateOrderInvoice);

/**
 * @swagger
 * /api/v1/invoices/order/{orderId}/receipt:
 *   get:
 *     summary: Generate and download receipt PDF for an order
 *     tags: [Invoices]
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
 *         description: Receipt PDF generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/order/:orderId/receipt', authenticate, generateOrderReceipt);

/**
 * @swagger
 * /api/v1/invoices/order/{orderId}/email:
 *   post:
 *     summary: Send invoice via email
 *     tags: [Invoices]
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
 *         description: Invoice sent successfully
 *       404:
 *         description: Order or transaction not found
 */
router.post('/order/:orderId/email', authenticate, emailOrderInvoice);

export default router;
