import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
// @ts-ignore
import SSLCommerzPayment from 'sslcommerz-lts';
import { Transaction, TransactionStatus, TransactionType, PaymentMethod } from '../models/Transaction';
import { Order, OrderStatus, PaymentStatus } from '../models/Order';
import Vendor from '../models/Vendor';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15'
});

// Initialize SSLCommerz
const sslcommerz = new SSLCommerzPayment(
  process.env.SSLCOMMERZ_STORE_ID || '',
  process.env.SSLCOMMERZ_STORE_PASSWORD || '',
  process.env.SSLCOMMERZ_IS_LIVE === 'true'
);

// ==================== PAYMENT INITIATION ====================

/**
 * Create payment intent for order
 * POST /api/v1/payments/create-intent
 * @access Private (User)
 */
export const createPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { orderId, paymentMethod = 'stripe' } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Get order details
    const order = await Order.findById(orderId).populate('vendor user service');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check order ownership
    if (order.user._id.toString() !== userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this order'
      });
    }

    // Check if order is in correct status (allow payment when accepted OR completed)
    if (![OrderStatus.ACCEPTED, OrderStatus.COMPLETED].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order must be accepted or completed before payment'
      });
    }

    // Check if already paid
    if (order.paymentStatus === PaymentStatus.PAID) {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    // Get commission rate from environment or use default
    const commissionRate = Number(process.env.PLATFORM_COMMISSION_RATE) || 5;

    // Calculate amounts
    const commissionAmount = (order.totalAmount * commissionRate) / 100;
    const vendorAmount = order.totalAmount - commissionAmount;

    // Generate unique transaction number
    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // Convert to cents
      currency: process.env.CURRENCY?.toLowerCase() || 'usd',
      metadata: {
        orderId: order._id.toString(),
        userId: userId?.toString() || '',
        vendorId: order.vendor._id.toString(),
        orderNumber: order.orderNumber
      },
      description: `Payment for order ${order.orderNumber}`
    });

    // Create transaction record
    const transaction = await Transaction.create({
      transactionNumber,
      order: orderId,
      user: userId,
      vendor: order.vendor._id,
      type: TransactionType.PAYMENT,
      amount: order.totalAmount,
      vendorAmount,
      commissionAmount,
      commissionRate,
      currency: process.env.CURRENCY || 'USD',
      paymentMethod: PaymentMethod.STRIPE,
      status: TransactionStatus.PENDING,
      stripePaymentIntentId: paymentIntent.id,
      description: `Payment for order ${order.orderNumber}`
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        transactionId: transaction._id,
        transactionNumber: transaction.transactionNumber,
        amount: order.totalAmount,
        currency: process.env.CURRENCY || 'USD'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm payment (for non-Stripe methods)
 * POST /api/v1/payments/confirm
 * @access Private (User)
 */
export const confirmPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { orderId, paymentMethod, paymentDetails } = req.body;

    if (!orderId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and payment method are required'
      });
    }

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check ownership
    if (order.user.toString() !== userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Get commission rate
    const commissionRate = Number(process.env.PLATFORM_COMMISSION_RATE) || 5;

    // Create transaction for manual payment methods
    const transaction = await Transaction.create({
      order: orderId,
      user: userId,
      vendor: order.vendor,
      type: TransactionType.PAYMENT,
      amount: order.totalAmount,
      currency: process.env.CURRENCY || 'USD',
      commissionRate,
      paymentMethod: paymentMethod.toUpperCase(),
      status: TransactionStatus.PROCESSING,
      description: `Payment for order ${order.orderNumber}`,
      metadata: paymentDetails
    });

    // Update order payment status
    order.paymentStatus = PaymentStatus.PENDING;
    await order.save();

    res.json({
      success: true,
      message: 'Payment confirmation received. Pending verification.',
      data: {
        transactionId: transaction._id,
        transactionNumber: transaction.transactionNumber
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== STRIPE WEBHOOK ====================

/**
 * Handle Stripe webhook events
 * POST /api/v1/payments/webhook/stripe
 * @access Public (Stripe webhook)
 */
export const handleStripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured');
      return res.status(500).json({ success: false, message: 'Webhook not configured' });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};

// Helper: Handle successful payment
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { orderId } = paymentIntent.metadata;

    // Find transaction
    const transaction = await Transaction.findOne({
      stripePaymentIntentId: paymentIntent.id
    });

    if (!transaction) {
      console.error('Transaction not found for payment intent:', paymentIntent.id);
      return;
    }

    // Update transaction
    transaction.status = TransactionStatus.COMPLETED;
    transaction.stripeChargeId = paymentIntent.latest_charge as string;
    transaction.completedAt = new Date();
    transaction.paymentGatewayResponse = paymentIntent;
    await transaction.save();

    // Update order
    const order = await Order.findById(orderId);
    if (order) {
      order.paymentStatus = PaymentStatus.PAID;
      await order.save();

      // Update vendor metrics
      await Vendor.findByIdAndUpdate(order.vendor, {
        $inc: {
          totalRevenue: transaction.vendorAmount,
          commission: transaction.commissionAmount
        }
      });

      // Send payment confirmation email
      try {
        await order.populate([
          { path: 'user', select: 'firstName lastName email' }
        ]);
        
        const { emailTemplates } = await import('../utils/emailTemplates');
        const { sendOrderEmail } = await import('../utils/emailService');

        const user = order.user as any;
        const email = emailTemplates.paymentConfirmation({
          customerName: user.firstName + ' ' + user.lastName,
          orderId: order._id.toString(),
          transactionId: transaction.transactionNumber,
          amount: transaction.amount,
          paymentMethod: transaction.paymentMethod
        });
        await sendOrderEmail(user.email, email.subject, email.html, email.text);
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
      }
    }

    console.log(`Payment successful for order ${orderId}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Helper: Handle failed payment
async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Find transaction
    const transaction = await Transaction.findOne({
      stripePaymentIntentId: paymentIntent.id
    });

    if (!transaction) {
      console.error('Transaction not found for payment intent:', paymentIntent.id);
      return;
    }

    // Update transaction
    transaction.status = TransactionStatus.FAILED;
    transaction.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
    transaction.paymentGatewayResponse = paymentIntent;
    await transaction.save();

    // Update order
    const order = await Order.findById(transaction.order);
    if (order) {
      order.paymentStatus = PaymentStatus.FAILED;
      await order.save();
    }

    console.log(`Payment failed for order ${transaction.order}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Helper: Handle refund
async function handleRefund(charge: Stripe.Charge) {
  try {
    // Find transaction by charge ID
    const transaction = await Transaction.findOne({
      stripeChargeId: charge.id
    });

    if (!transaction) {
      console.error('Transaction not found for charge:', charge.id);
      return;
    }

    // Update transaction
    const refundAmount = charge.amount_refunded / 100; // Convert from cents
    transaction.refundAmount = refundAmount;
    transaction.refundedAt = new Date();
    
    if (refundAmount >= transaction.amount) {
      transaction.status = TransactionStatus.REFUNDED;
    } else {
      transaction.status = TransactionStatus.PARTIALLY_REFUNDED;
    }
    
    await transaction.save();

    // Update order
    const order = await Order.findById(transaction.order);
    if (order) {
      order.paymentStatus = PaymentStatus.REFUNDED;
      await order.save();
    }

    console.log(`Refund processed for transaction ${transaction.transactionNumber}`);
  } catch (error) {
    console.error('Error handling refund:', error);
  }
}

// ==================== TRANSACTION MANAGEMENT ====================

/**
 * Get user's transactions
 * GET /api/v1/payments/my-transactions
 * @access Private (User)
 */
export const getMyTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { status, type, page = 1, limit = 10 } = req.query;

    const filter: any = { user: userId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const transactions = await Transaction.find(filter)
      .populate('order', 'orderNumber scheduledDate totalAmount')
      .populate('vendor', 'companyName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get vendor's transactions
 * GET /api/v1/payments/vendor/transactions
 * @access Private (Vendor)
 */
export const getVendorTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user?._id;
    const { status, type, startDate, endDate, page = 1, limit = 10 } = req.query;

    const filter: any = { vendor: vendorId };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const transactions = await Transaction.find(filter)
      .populate('order', 'orderNumber scheduledDate')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(filter);

    // Get statistics
    const stats = await Transaction.getStatistics({ vendor: vendorId, status: TransactionStatus.COMPLETED });

    res.json({
      success: true,
      data: transactions,
      statistics: stats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get transaction by ID
 * GET /api/v1/payments/:transactionId
 * @access Private (User owns transaction, Vendor receives payment, Admin)
 */
export const getTransactionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    const transaction = await Transaction.findById(transactionId)
      .populate('order', 'orderNumber scheduledDate totalAmount status')
      .populate('user', 'firstName lastName email')
      .populate('vendor', 'companyName email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Authorization check
    const isUser = transaction.user._id.toString() === userId?.toString();
    const isVendor = transaction.vendor._id.toString() === userId?.toString();
    const isAdmin = ['admin', 'super_admin'].includes(userRole || '');

    if (!isUser && !isVendor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this transaction'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ADMIN OPERATIONS ====================

/**
 * Get all transactions (Admin)
 * GET /api/v1/payments/admin/transactions
 * @access Private (Admin, Super Admin)
 */
export const adminGetAllTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      status,
      type,
      paymentMethod,
      userId,
      vendorId,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (userId) filter.user = userId;
    if (vendorId) filter.vendor = vendorId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const transactions = await Transaction.find(filter)
      .populate('order', 'orderNumber')
      .populate('user', 'firstName lastName email')
      .populate('vendor', 'companyName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(filter);

    // Get overall statistics
    const stats = await Transaction.getStatistics(filter);

    res.json({
      success: true,
      data: transactions,
      statistics: stats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process refund
 * POST /api/v1/payments/admin/:transactionId/refund
 * @access Private (Admin, Super Admin)
 */
export const processRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId } = req.params;
    const { amount, reason } = req.body;
    const adminId = req.user?._id;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if refundable
    if (!transaction.isRefundable() && !transaction.canPartialRefund()) {
      return res.status(400).json({
        success: false,
        message: 'Transaction cannot be refunded'
      });
    }

    // Validate refund amount
    const refundAmount = amount || transaction.amount;
    if (refundAmount > transaction.amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed transaction amount'
      });
    }

    // Process refund with Stripe
    if (transaction.paymentMethod === PaymentMethod.STRIPE && transaction.stripePaymentIntentId) {
      const refund = await stripe.refunds.create({
        payment_intent: transaction.stripePaymentIntentId,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: 'requested_by_customer'
      });

      transaction.refundId = refund.id;
      transaction.refundAmount = refundAmount;
      transaction.refundReason = reason;
      transaction.refundedAt = new Date();
      transaction.refundedBy = adminId;
      
      if (refundAmount >= transaction.amount) {
        transaction.status = TransactionStatus.REFUNDED;
      } else {
        transaction.status = TransactionStatus.PARTIALLY_REFUNDED;
      }
      
      await transaction.save();

      // Update order
      const order = await Order.findById(transaction.order);
      if (order) {
        order.paymentStatus = PaymentStatus.REFUNDED;
        await order.save();
      }

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: transaction
      });
    } else {
      // Manual refund for other payment methods
      transaction.refundAmount = refundAmount;
      transaction.refundReason = reason;
      transaction.refundedAt = new Date();
      transaction.refundedBy = adminId;
      transaction.status = refundAmount >= transaction.amount 
        ? TransactionStatus.REFUNDED 
        : TransactionStatus.PARTIALLY_REFUNDED;
      
      await transaction.save();

      res.json({
        success: true,
        message: 'Refund marked for processing',
        data: transaction
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue statistics
 * GET /api/v1/payments/admin/revenue
 * @access Private (Admin, Super Admin)
 */
export const getRevenueStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, vendorId } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const dailyRevenue = await Transaction.getRevenueByDateRange(
      start,
      end,
      vendorId as string
    );

    // Get overall statistics
    const overallMatch: any = {
      createdAt: { $gte: start, $lte: end },
      status: TransactionStatus.COMPLETED,
      type: TransactionType.PAYMENT
    };

    if (vendorId) {
      overallMatch.vendor = vendorId;
    }

    const overallStats = await Transaction.aggregate([
      { $match: overallMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalCommission: { $sum: '$commissionAmount' },
          totalVendorAmount: { $sum: '$vendorAmount' },
          transactionCount: { $sum: 1 },
          averageTransaction: { $avg: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        dailyRevenue,
        overall: overallStats[0] || {
          totalRevenue: 0,
          totalCommission: 0,
          totalVendorAmount: 0,
          transactionCount: 0,
          averageTransaction: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SSLCOMMERZ PAYMENT GATEWAY ====================

/**
 * Initialize SSLCommerz payment
 * POST /api/v1/payments/sslcommerz/init
 * @access Private (User)
 */
export const initSSLCommerzPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Get order details
    const order = await Order.findById(orderId)
      .populate('vendor', 'companyName email phone')
      .populate('user', 'firstName lastName email phone')
      .populate('service', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('[SSLCOMMERZ INIT] Order status:', order.status, 'Payment status:', order.paymentStatus);

    // Check order ownership
    if (order.user._id.toString() !== userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this order'
      });
    }

    // Check if order is in correct status (allow payment when accepted OR completed)
    if (![OrderStatus.ACCEPTED, OrderStatus.COMPLETED].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order must be accepted or completed before payment'
      });
    }

    // Check if already paid
    if (order.paymentStatus === PaymentStatus.PAID) {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    // Get commission rate
    const commissionRate = Number(process.env.PLATFORM_COMMISSION_RATE) || 5;

    // Calculate amounts
    const commissionAmount = (order.totalAmount * commissionRate) / 100;
    const vendorAmount = order.totalAmount - commissionAmount;

    // Generate unique transaction number
    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    console.log('[SSLCOMMERZ] Creating transaction with:', {
      transactionNumber,
      amount: order.totalAmount,
      vendorAmount,
      commissionAmount,
      commissionRate
    });

    // Create transaction record
    const transaction = await Transaction.create({
      transactionNumber,
      order: orderId,
      user: userId,
      vendor: order.vendor._id,
      type: TransactionType.PAYMENT,
      amount: order.totalAmount,
      vendorAmount,
      commissionAmount,
      commissionRate,
      currency: 'BDT',
      paymentMethod: PaymentMethod.SSLCOMMERZ,
      status: TransactionStatus.PENDING,
      description: `Payment for order ${order.orderNumber}`
    });

    // Base URLs from environment
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

    // Prepare SSLCommerz payment data
    const sslcommerzData = {
      total_amount: order.totalAmount,
      currency: 'BDT',
      tran_id: transaction.transactionNumber,
      success_url: `${backendUrl}/api/v1/payments/sslcommerz/success`,
      fail_url: `${backendUrl}/api/v1/payments/sslcommerz/fail`,
      cancel_url: `${backendUrl}/api/v1/payments/sslcommerz/cancel`,
      ipn_url: `${backendUrl}/api/v1/payments/sslcommerz/ipn`,
      shipping_method: 'NO',
      product_name: order.service?.name || 'Service',
      product_category: 'Service',
      product_profile: 'general',
      cus_name: order.customerName,
      cus_email: order.customerEmail,
      cus_add1: order.address.street || 'N/A',
      cus_add2: order.address.city || 'N/A',
      cus_city: order.address.city || 'N/A',
      cus_state: order.address.state || 'N/A',
      cus_postcode: order.address.zipCode || '1000',
      cus_country: order.address.country || 'Bangladesh',
      cus_phone: order.customerPhone,
      cus_fax: order.customerPhone,
      ship_name: order.customerName,
      ship_add1: order.address.street || 'N/A',
      ship_add2: order.address.city || 'N/A',
      ship_city: order.address.city || 'N/A',
      ship_state: order.address.state || 'N/A',
      ship_postcode: order.address.zipCode || 1000,
      ship_country: order.address.country || 'Bangladesh',
      value_a: orderId.toString(),
      value_b: userId?.toString() || '',
      value_c: transaction._id.toString(),
      value_d: order.vendor._id.toString()
    };

    // Initialize payment with SSLCommerz
    const apiResponse = await sslcommerz.init(sslcommerzData);

    if (apiResponse?.GatewayPageURL) {
      // Store session key in transaction
      transaction.sslcommerzSessionKey = apiResponse.sessionkey;
      await transaction.save();

      res.json({
        success: true,
        message: 'Payment initiated successfully',
        data: {
          gatewayUrl: apiResponse.GatewayPageURL,
          transactionId: transaction._id,
          transactionNumber: transaction.transactionNumber,
          sessionKey: apiResponse.sessionkey
        }
      });
    } else {
      transaction.status = TransactionStatus.FAILED;
      transaction.failureReason = 'Failed to initialize payment gateway';
      await transaction.save();

      return res.status(500).json({
        success: false,
        message: 'Failed to initialize payment',
        error: apiResponse
      });
    }
  } catch (error: any) {
    console.error('SSLCommerz Init Error:', error);
    next(error);
  }
};

/**
 * SSLCommerz payment success callback
 * POST /api/v1/payments/sslcommerz/success
 * @access Public (Callback from SSLCommerz)
 */
export const sslcommerzPaymentSuccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tran_id, val_id, amount, card_type, store_amount, bank_tran_id, status } = req.body;

    console.log('SSLCommerz Success Callback:', req.body);

    // Find transaction
    const transaction = await Transaction.findOne({ transactionNumber: tran_id });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Validate payment with SSLCommerz
    const validationData = { val_id };
    const validationResponse = await sslcommerz.validate(validationData);

    console.log('SSLCommerz Validation Response:', validationResponse);

    // Check if validation successful
    if (validationResponse.status === 'VALID' || validationResponse.status === 'VALIDATED') {
      // Update transaction
      transaction.status = TransactionStatus.COMPLETED;
      transaction.sslcommerzValidationId = val_id;
      transaction.sslcommerzBankTranId = bank_tran_id;
      transaction.sslcommerzTransactionId = tran_id;
      transaction.completedAt = new Date();
      transaction.processedAt = new Date();
      transaction.paymentGatewayResponse = validationResponse;
      await transaction.save();

      // Update order
      const order = await Order.findById(transaction.order);
      if (order) {
        order.paymentStatus = PaymentStatus.PAID;
        await order.save();

        // Update vendor metrics
        await Vendor.findByIdAndUpdate(order.vendor, {
          $inc: {
            totalRevenue: transaction.vendorAmount,
            commission: transaction.commissionAmount
          }
        });

        // Send payment confirmation email
        try {
          await order.populate([
            { path: 'user', select: 'firstName lastName email' }
          ]);
          
          const { emailTemplates } = await import('../utils/emailTemplates');
          const { sendOrderEmail } = await import('../utils/emailService');

          const user = order.user as any;
          const email = emailTemplates.paymentConfirmation({
            customerName: user.firstName + ' ' + user.lastName,
            orderId: order._id.toString(),
            transactionId: transaction.transactionNumber,
            amount: transaction.amount,
            paymentMethod: transaction.paymentMethod
          });
          await sendOrderEmail(user.email, email.subject, email.html, email.text);
        } catch (emailError) {
          console.error('Failed to send payment confirmation email:', emailError);
        }
      }

      // Redirect to frontend success page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/payment/success?transaction=${transaction.transactionNumber}`);
    } else {
      // Payment validation failed
      transaction.status = TransactionStatus.FAILED;
      transaction.failureReason = 'Payment validation failed';
      transaction.paymentGatewayResponse = validationResponse;
      await transaction.save();

      const order = await Order.findById(transaction.order);
      if (order) {
        order.paymentStatus = PaymentStatus.FAILED;
        await order.save();
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/payment/failed?transaction=${transaction.transactionNumber}`);
    }
  } catch (error: any) {
    console.error('SSLCommerz Success Handler Error:', error);
    next(error);
  }
};

/**
 * SSLCommerz payment failure callback
 * POST /api/v1/payments/sslcommerz/fail
 * @access Public (Callback from SSLCommerz)
 */
export const sslcommerzPaymentFail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tran_id, error } = req.body;

    console.log('SSLCommerz Fail Callback:', req.body);

    // Find transaction
    const transaction = await Transaction.findOne({ transactionNumber: tran_id });

    if (transaction) {
      transaction.status = TransactionStatus.FAILED;
      transaction.failureReason = error || 'Payment failed';
      transaction.paymentGatewayResponse = req.body;
      await transaction.save();

      // Update order
      const order = await Order.findById(transaction.order);
      if (order) {
        order.paymentStatus = PaymentStatus.FAILED;
        await order.save();
      }
    }

    // Redirect to frontend fail page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/payment/failed?transaction=${tran_id}`);
  } catch (error: any) {
    console.error('SSLCommerz Fail Handler Error:', error);
    next(error);
  }
};

/**
 * SSLCommerz payment cancellation callback
 * POST /api/v1/payments/sslcommerz/cancel
 * @access Public (Callback from SSLCommerz)
 */
export const sslcommerzPaymentCancel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tran_id } = req.body;

    console.log('SSLCommerz Cancel Callback:', req.body);

    // Find transaction
    const transaction = await Transaction.findOne({ transactionNumber: tran_id });

    if (transaction) {
      transaction.status = TransactionStatus.CANCELLED;
      transaction.failureReason = 'Payment cancelled by user';
      transaction.paymentGatewayResponse = req.body;
      await transaction.save();

      // Update order
      const order = await Order.findById(transaction.order);
      if (order) {
        order.paymentStatus = PaymentStatus.FAILED;
        await order.save();
      }
    }

    // Redirect to frontend cancel page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/payment/cancelled?transaction=${tran_id}`);
  } catch (error: any) {
    console.error('SSLCommerz Cancel Handler Error:', error);
    next(error);
  }
};

/**
 * SSLCommerz IPN (Instant Payment Notification) handler
 * POST /api/v1/payments/sslcommerz/ipn
 * @access Public (Server-to-Server notification from SSLCommerz)
 */
export const sslcommerzIPN = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tran_id, val_id, amount, status } = req.body;

    console.log('SSLCommerz IPN Received:', req.body);

    // Find transaction
    const transaction = await Transaction.findOne({ transactionNumber: tran_id });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Validate payment with SSLCommerz
    const validationData = { val_id };
    const validationResponse = await sslcommerz.validate(validationData);

    if (validationResponse.status === 'VALID' || validationResponse.status === 'VALIDATED') {
      // Update transaction if not already completed
      if (transaction.status !== TransactionStatus.COMPLETED) {
        transaction.status = TransactionStatus.COMPLETED;
        transaction.sslcommerzValidationId = val_id;
        transaction.completedAt = new Date();
        transaction.processedAt = new Date();
        transaction.paymentGatewayResponse = validationResponse;
        await transaction.save();

        // Update order
        const order = await Order.findById(transaction.order);
        if (order && order.paymentStatus !== PaymentStatus.PAID) {
          order.paymentStatus = PaymentStatus.PAID;
          await order.save();

          // Update vendor metrics
          await Vendor.findByIdAndUpdate(order.vendor, {
            $inc: {
              totalRevenue: transaction.vendorAmount,
              commission: transaction.commissionAmount
            }
          });
        }
      }

      return res.json({
        success: true,
        message: 'IPN processed successfully'
      });
    } else {
      return res.json({
        success: false,
        message: 'Payment validation failed'
      });
    }
  } catch (error: any) {
    console.error('SSLCommerz IPN Handler Error:', error);
    next(error);
  }
};

/**
 * Validate SSLCommerz transaction
 * POST /api/v1/payments/sslcommerz/validate
 * @access Private (Admin, User who owns transaction)
 */
export const validateSSLCommerzTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId, validationId } = req.body;

    if (!transactionId || !validationId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID and Validation ID are required'
      });
    }

    // Find transaction
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Validate with SSLCommerz
    const validationData = { val_id: validationId };
    const validationResponse = await sslcommerz.validate(validationData);

    res.json({
      success: true,
      data: validationResponse
    });
  } catch (error: any) {
    console.error('SSLCommerz Validation Error:', error);
    next(error);
  }
};

/**
 * Query SSLCommerz transaction by transaction ID
 * GET /api/v1/payments/sslcommerz/query/:transactionNumber
 * @access Private (Admin, User who owns transaction)
 */
export const querySSLCommerzTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionNumber } = req.params;

    if (!transactionNumber) {
      return res.status(400).json({
        success: false,
        message: 'Transaction number is required'
      });
    }

    // Query SSLCommerz
    const queryData = { tran_id: transactionNumber };
    const queryResponse = await sslcommerz.transactionQueryByTransactionId(queryData);

    res.json({
      success: true,
      data: queryResponse
    });
  } catch (error: any) {
    console.error('SSLCommerz Query Error:', error);
    next(error);
  }
};

/**
 * Initiate SSLCommerz refund
 * POST /api/v1/payments/sslcommerz/refund
 * @access Private (Admin)
 */
export const initiateSSLCommerzRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId, refundAmount, refundReason } = req.body;

    if (!transactionId || !refundAmount) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID and refund amount are required'
      });
    }

    // Find transaction
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if transaction is refundable
    if (transaction.status !== TransactionStatus.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: 'Only completed transactions can be refunded'
      });
    }

    if (!transaction.sslcommerzBankTranId) {
      return res.status(400).json({
        success: false,
        message: 'Bank transaction ID not found'
      });
    }

    // Initiate refund with SSLCommerz
    const refundData = {
      refund_amount: refundAmount,
      refund_remarks: refundReason || 'Refund requested',
      bank_tran_id: transaction.sslcommerzBankTranId,
      refe_id: transaction.transactionNumber
    };

    const refundResponse = await sslcommerz.initiateRefund(refundData);

    if (refundResponse.status === 'success') {
      // Update transaction
      transaction.refundAmount = refundAmount;
      transaction.refundReason = refundReason;
      transaction.refundId = refundResponse.refund_ref_id;
      transaction.refundedAt = new Date();
      transaction.refundedBy = req.user?._id;
      transaction.status = refundAmount >= transaction.amount 
        ? TransactionStatus.REFUNDED 
        : TransactionStatus.PARTIALLY_REFUNDED;
      await transaction.save();

      // Update order
      const order = await Order.findById(transaction.order);
      if (order) {
        order.paymentStatus = PaymentStatus.REFUNDED;
        await order.save();
      }

      res.json({
        success: true,
        message: 'Refund initiated successfully',
        data: {
          refundRefId: refundResponse.refund_ref_id,
          transaction
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Refund initiation failed',
        error: refundResponse
      });
    }
  } catch (error: any) {
    console.error('SSLCommerz Refund Error:', error);
    next(error);
  }
};

/**
 * Query SSLCommerz refund status
 * GET /api/v1/payments/sslcommerz/refund-query/:refundRefId
 * @access Private (Admin)
 */
export const querySSLCommerzRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refundRefId } = req.params;

    if (!refundRefId) {
      return res.status(400).json({
        success: false,
        message: 'Refund reference ID is required'
      });
    }

    // Query refund status
    const refundData = { refund_ref_id: refundRefId };
    const refundQueryResponse = await sslcommerz.refundQuery(refundData);

    res.json({
      success: true,
      data: refundQueryResponse
    });
  } catch (error: any) {
    console.error('SSLCommerz Refund Query Error:', error);
    next(error);
  }
};

// ==================== MANUAL PAYMENT VERIFICATION ====================

/**
 * Get all pending manual payments for admin verification
 * GET /api/v1/payments/admin/pending-verifications
 * @access Private (Admin)
 */
export const getPendingPaymentVerifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20, paymentMethod } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build filter for manual payment methods
    const filter: any = {
      status: TransactionStatus.PROCESSING,
      paymentMethod: { $in: ['CASH', 'BANK_TRANSFER'] }
    };

    if (paymentMethod) {
      filter.paymentMethod = (paymentMethod as string).toUpperCase();
    }

    // Get pending transactions
    const transactions = await Transaction.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('vendor', 'companyName email phone')
      .populate('order', 'orderNumber scheduledDate scheduledTime')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify and approve manual payment
 * POST /api/v1/payments/admin/:transactionId/verify
 * @access Private (Admin)
 */
export const verifyManualPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transactionId } = req.params;
    const { action, notes, referenceNumber } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Valid action (approve/reject) is required'
      });
    }

    // Get transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if already verified
    if (transaction.status !== TransactionStatus.PROCESSING) {
      return res.status(400).json({
        success: false,
        message: `Transaction already ${transaction.status}. Cannot verify again.`
      });
    }

    // Get order
    const order = await Order.findById(transaction.order);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (action === 'approve') {
      // Approve payment
      transaction.status = TransactionStatus.COMPLETED;
      transaction.completedAt = new Date();
      transaction.processedAt = new Date();
      if (referenceNumber) {
        transaction.metadata = {
          ...transaction.metadata,
          adminReferenceNumber: referenceNumber
        };
      }
      if (notes) {
        transaction.metadata = {
          ...transaction.metadata,
          adminNotes: notes
        };
      }
      await transaction.save();

      // Update order
      order.paymentStatus = PaymentStatus.PAID;
      await order.save();

      // Update vendor metrics
      await Vendor.findByIdAndUpdate(order.vendor, {
        $inc: {
          totalRevenue: transaction.vendorAmount,
          commission: transaction.commissionAmount
        }
      });

      // Send payment confirmation email
      try {
        await order.populate([
          { path: 'user', select: 'firstName lastName email' }
        ]);
        
        const { emailTemplates } = await import('../utils/emailTemplates');
        const { sendOrderEmail } = await import('../utils/emailService');

        const user = order.user as any;
        const email = emailTemplates.paymentConfirmation({
          customerName: user.firstName + ' ' + user.lastName,
          orderId: order._id.toString(),
          transactionId: transaction.transactionNumber,
          amount: transaction.amount,
          paymentMethod: transaction.paymentMethod
        });
        await sendOrderEmail(user.email, email.subject, email.html, email.text);
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
      }

      res.json({
        success: true,
        message: 'Payment verified and approved successfully',
        data: transaction
      });
    } else {
      // Reject payment
      transaction.status = TransactionStatus.FAILED;
      transaction.failureReason = notes || 'Payment verification failed';
      transaction.processedAt = new Date();
      await transaction.save();

      // Update order
      order.paymentStatus = PaymentStatus.FAILED;
      await order.save();

      res.json({
        success: true,
        message: 'Payment rejected',
        data: transaction
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Upload payment proof for cash/bank transfer
 * POST /api/v1/payments/:transactionId/upload-proof
 * @access Private (User)
 */
export const uploadPaymentProof = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user?._id;
    const { proofImageUrl, proofDetails } = req.body;

    if (!proofImageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Payment proof image URL is required'
      });
    }

    // Get transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check ownership
    if (transaction.user.toString() !== userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if transaction is in correct state
    if (transaction.status !== TransactionStatus.PROCESSING) {
      return res.status(400).json({
        success: false,
        message: 'Payment proof can only be uploaded for pending transactions'
      });
    }

    // Update transaction with proof
    transaction.metadata = {
      ...transaction.metadata,
      paymentProofUrl: proofImageUrl,
      proofDetails: proofDetails || {},
      proofUploadedAt: new Date()
    };
    await transaction.save();

    res.json({
      success: true,
      message: 'Payment proof uploaded successfully. Waiting for admin verification.',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment verification statistics
 * GET /api/v1/payments/admin/verification-stats
 * @access Private (Admin)
 */
export const getPaymentVerificationStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pendingCount = await Transaction.countDocuments({
      status: TransactionStatus.PROCESSING,
      paymentMethod: { $in: ['CASH', 'BANK_TRANSFER'] }
    });

    const approvedToday = await Transaction.countDocuments({
      status: TransactionStatus.COMPLETED,
      paymentMethod: { $in: ['CASH', 'BANK_TRANSFER'] },
      completedAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    const rejectedToday = await Transaction.countDocuments({
      status: TransactionStatus.FAILED,
      paymentMethod: { $in: ['CASH', 'BANK_TRANSFER'] },
      processedAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    const totalPendingAmount = await Transaction.aggregate([
      {
        $match: {
          status: TransactionStatus.PROCESSING,
          paymentMethod: { $in: ['CASH', 'BANK_TRANSFER'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        pendingVerifications: pendingCount,
        approvedToday,
        rejectedToday,
        totalPendingAmount: totalPendingAmount[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

