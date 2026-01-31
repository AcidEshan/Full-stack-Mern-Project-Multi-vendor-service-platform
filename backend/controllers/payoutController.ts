import { Request, Response, NextFunction } from 'express';
import Payout, { PayoutStatus } from '../models/Payout';
import { Transaction, TransactionStatus, TransactionType } from '../models/Transaction';
import Vendor from '../models/Vendor';

// ==================== VENDOR PAYOUT OPERATIONS ====================

/**
 * Request payout
 * POST /api/v1/payouts/request
 * @access Private (Vendor)
 */
export const requestPayout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user?._id;
    const { method, bankDetails, mobileDetails, period } = req.body;

    if (!method) {
      return res.status(400).json({
        success: false,
        message: 'Payout method is required'
      });
    }

    // Get vendor
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check if vendor is active
    if (!vendor.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your vendor account is deactivated. You cannot request payouts.'
      });
    }

    // Calculate available balance
    const startDate = period?.startDate ? new Date(period.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = period?.endDate ? new Date(period.endDate) : new Date();

    const completedTransactions = await Transaction.find({
      vendor: vendorId,
      status: TransactionStatus.COMPLETED,
      type: TransactionType.PAYMENT,
      completedAt: { $gte: startDate, $lte: endDate },
      payoutId: { $exists: false }
    });

    if (completedTransactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No completed transactions available for payout'
      });
    }

    const totalAmount = completedTransactions.reduce((sum, t) => sum + t.vendorAmount, 0);

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance for payout'
      });
    }

    // Create payout request
    const payoutData: any = {
      vendor: vendorId,
      amount: totalAmount,
      currency: process.env.CURRENCY || 'BDT',
      method,
      transactions: completedTransactions.map(t => t._id),
      period: {
        startDate,
        endDate
      },
      status: PayoutStatus.PENDING
    };

    if (method === 'bank_transfer' && bankDetails) {
      payoutData.bankName = bankDetails.bankName;
      payoutData.accountNumber = bankDetails.accountNumber;
      payoutData.accountHolderName = bankDetails.accountHolderName;
      payoutData.routingNumber = bankDetails.routingNumber;
      payoutData.swiftCode = bankDetails.swiftCode;
    }

    if (method === 'mobile_banking' && mobileDetails) {
      payoutData.mobileProvider = mobileDetails.provider;
      payoutData.mobileNumber = mobileDetails.number;
    }

    const payout = await Payout.create(payoutData);

    // Mark transactions as linked to payout
    await Transaction.updateMany(
      { _id: { $in: completedTransactions.map(t => t._id) } },
      { payoutId: payout._id }
    );

    res.status(201).json({
      success: true,
      message: 'Payout requested successfully',
      data: payout
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get vendor's payouts
 * GET /api/v1/payouts/my-payouts
 * @access Private (Vendor)
 */
export const getVendorPayouts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user?._id;
    const { status, page = 1, limit = 10 } = req.query;

    const filter: any = { vendor: vendorId };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const payouts = await Payout.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Payout.countDocuments(filter);

    // Get available balance
    const availableTransactions = await Transaction.find({
      vendor: vendorId,
      status: TransactionStatus.COMPLETED,
      type: TransactionType.PAYMENT,
      payoutId: { $exists: false }
    });

    const availableBalance = availableTransactions.reduce((sum, t) => sum + t.vendorAmount, 0);

    res.json({
      success: true,
      data: payouts,
      availableBalance,
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
 * Get payout by ID
 * GET /api/v1/payouts/:payoutId
 * @access Private (Vendor, Admin)
 */
export const getPayoutById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { payoutId } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    const payout = await Payout.findById(payoutId)
      .populate('vendor', 'companyName email phone')
      .populate('transactions', 'transactionNumber amount createdAt')
      .populate('processedBy', 'firstName lastName email');

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    // Authorization check
    const isVendor = payout.vendor._id.toString() === userId?.toString();
    const isAdmin = ['admin', 'super_admin'].includes(userRole || '');

    if (!isVendor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payout'
      });
    }

    res.json({
      success: true,
      data: payout
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ADMIN PAYOUT OPERATIONS ====================

/**
 * Get all payouts (Admin)
 * GET /api/v1/payouts/admin/all
 * @access Private (Admin)
 */
export const getAllPayouts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, vendorId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (vendorId) filter.vendor = vendorId;
    if (startDate || endDate) {
      filter.requestedAt = {};
      if (startDate) filter.requestedAt.$gte = new Date(startDate as string);
      if (endDate) filter.requestedAt.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const payouts = await Payout.find(filter)
      .populate('vendor', 'companyName email phone')
      .populate('processedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Payout.countDocuments(filter);

    res.json({
      success: true,
      data: payouts,
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
 * Process payout
 * PATCH /api/v1/payouts/:payoutId/process
 * @access Private (Admin)
 */
export const processPayout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { payoutId } = req.params;
    const adminId = req.user?._id;
    const { action, notes, gatewayTransactionId } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve or reject'
      });
    }

    const payout = await Payout.findById(payoutId);

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    if (payout.status !== PayoutStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: `Cannot process payout with status: ${payout.status}`
      });
    }

    if (action === 'approve') {
      payout.status = PayoutStatus.PROCESSING;
      payout.processedAt = new Date();
      payout.processedBy = adminId;
      payout.notes = notes;

      if (gatewayTransactionId) {
        payout.gatewayTransactionId = gatewayTransactionId;
      }

      await payout.save();

      res.json({
        success: true,
        message: 'Payout approved and processing',
        data: payout
      });
    } else {
      payout.status = PayoutStatus.CANCELLED;
      payout.processedBy = adminId;
      payout.notes = notes || 'Rejected by admin';
      payout.processedAt = new Date();

      await payout.save();

      // Remove payout link from transactions
      await Transaction.updateMany(
        { _id: { $in: payout.transactions } },
        { $unset: { payoutId: 1 } }
      );

      res.json({
        success: true,
        message: 'Payout rejected',
        data: payout
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Complete payout
 * PATCH /api/v1/payouts/:payoutId/complete
 * @access Private (Admin)
 */
export const completePayout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { payoutId } = req.params;
    const { gatewayTransactionId, gatewayResponse } = req.body;

    const payout = await Payout.findById(payoutId);

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    if (payout.status !== PayoutStatus.PROCESSING) {
      return res.status(400).json({
        success: false,
        message: 'Payout must be in processing status'
      });
    }

    payout.status = PayoutStatus.COMPLETED;
    payout.completedAt = new Date();
    payout.gatewayTransactionId = gatewayTransactionId;
    payout.gatewayResponse = gatewayResponse;

    await payout.save();

    res.json({
      success: true,
      message: 'Payout completed successfully',
      data: payout
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payout statistics
 * GET /api/v1/payouts/admin/statistics
 * @access Private (Admin)
 */
export const getPayoutStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const filter: any = {};
    if (startDate || endDate) {
      filter.requestedAt = {};
      if (startDate) filter.requestedAt.$gte = new Date(startDate as string);
      if (endDate) filter.requestedAt.$lte = new Date(endDate as string);
    }

    const totalPayouts = await Payout.countDocuments(filter);
    const pendingPayouts = await Payout.countDocuments({ ...filter, status: PayoutStatus.PENDING });
    const completedPayouts = await Payout.countDocuments({ ...filter, status: PayoutStatus.COMPLETED });

    const payoutAmounts = await Payout.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalPayouts,
        pendingPayouts,
        completedPayouts,
        byStatus: payoutAmounts
      }
    });
  } catch (error) {
    next(error);
  }
};
