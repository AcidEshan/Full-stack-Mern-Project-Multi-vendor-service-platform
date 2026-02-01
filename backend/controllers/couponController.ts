import { Request, Response, NextFunction } from 'express';
import Coupon, { CouponStatus } from '../models/Coupon';
import { Order } from '../models/Order';

// ==================== USER COUPON OPERATIONS ====================

/**
 * Validate and apply coupon
 * POST /api/v1/coupons/validate
 * @access Private (User)
 */
export const validateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, orderAmount, serviceId, categoryId, vendorId } = req.body;
    const userId = req.user?._id;

    if (!code || !orderAmount) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code and order amount are required'
      });
    }

    // Find coupon
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    // Check if coupon is valid
    if (!coupon.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is not valid or has expired'
      });
    }

    // Check if user can use coupon
    const canUse = await coupon.canBeUsedBy(userId?.toString() || '');
    if (!canUse) {
      return res.status(400).json({
        success: false,
        message: 'You cannot use this coupon'
      });
    }

    // Check minimum order amount
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ${coupon.minOrderAmount}`
      });
    }

    // Check service/category/vendor restrictions
    if (coupon.applicableFor === 'specific_services' && serviceId) {
      if (!coupon.applicableServices?.some((id: any) => id.toString() === serviceId)) {
        return res.status(400).json({
          success: false,
          message: 'Coupon not applicable for this service'
        });
      }
    }

    if (coupon.applicableFor === 'specific_categories' && categoryId) {
      if (!coupon.applicableCategories?.some((id: any) => id.toString() === categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'Coupon not applicable for this category'
        });
      }
    }

    if (vendorId && coupon.applicableVendors?.length) {
      if (!coupon.applicableVendors.some((id: any) => id.toString() === vendorId)) {
        return res.status(400).json({
          success: false,
          message: 'Coupon not applicable for this vendor'
        });
      }
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(orderAmount);

    res.json({
      success: true,
      message: 'Coupon is valid',
      data: {
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        discountAmount,
        finalAmount: orderAmount - discountAmount,
        couponId: coupon._id
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available coupons for user
 * GET /api/v1/coupons/available
 * @access Private (User)
 */
export const getAvailableCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    const coupons = await Coupon.find({
      status: CouponStatus.ACTIVE,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      $or: [
        { applicableFor: 'all' },
        { applicableUsers: userId }
      ]
    }).select('-applicableUsers -applicableServices -applicableCategories');

    // Filter coupons user can use
    const availableCoupons = [];
    for (const coupon of coupons) {
      const canUse = await coupon.canBeUsedBy(userId?.toString() || '');
      if (canUse) {
        availableCoupons.push(coupon);
      }
    }

    res.json({
      success: true,
      data: availableCoupons,
      count: availableCoupons.length
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ADMIN COUPON OPERATIONS ====================

/**
 * Create coupon
 * POST /api/v1/coupons
 * @access Private (Admin)
 */
export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?._id;

    // Validate required fields
    const { code, name, type, value, startDate, endDate } = req.body;
    
    if (!code || !name || !type || value === undefined) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: code, name, type, and value are required',
          details: {
            code: !code ? 'Code is required' : undefined,
            name: !name ? 'Name is required' : undefined,
            type: !type ? 'Type is required (percentage, fixed, or free_delivery)' : undefined,
            value: value === undefined ? 'Value is required' : undefined
          }
        }
      });
      return;
    }

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Start date and end date are required'
        }
      });
      return;
    }

    const couponData = {
      ...req.body,
      createdBy: adminId
    };

    const coupon = await Coupon.create(couponData);

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }
    next(error);
  }
};

/**
 * Get all coupons (Admin)
 * GET /api/v1/coupons/admin/all
 * @access Private (Admin)
 */
export const getAllCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, type, page = 1, limit = 20, search } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const coupons = await Coupon.find(filter)
      .sort({ createdAt: -1 } as any)
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'firstName lastName email');

    const total = await Coupon.countDocuments(filter);

    res.json({
      success: true,
      data: coupons,
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
 * Get coupon by ID
 * GET /api/v1/coupons/:couponId
 * @access Private (Admin)
 */
export const getCouponById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId)
      .populate('createdBy', 'firstName lastName email')
      .populate('applicableServices', 'name')
      .populate('applicableCategories', 'name')
      .populate('applicableVendors', 'companyName');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Get usage statistics
    const usageStats = await Order.aggregate([
      { $match: { 'couponApplied.couponId': coupon._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalDiscount: { $sum: '$couponApplied.discountAmount' },
          uniqueUsers: { $addToSet: '$user' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        ...coupon.toJSON(),
        statistics: usageStats[0] || {
          totalOrders: 0,
          totalDiscount: 0,
          uniqueUsers: []
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update coupon
 * PUT /api/v1/coupons/:couponId
 * @access Private (Admin)
 */
export const updateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { couponId } = req.params;
    const updates = req.body;

    // Don't allow changing code or usage count
    delete updates.code;
    delete updates.usageCount;
    delete updates.createdBy;

    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      updates,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete coupon
 * DELETE /api/v1/coupons/:couponId
 * @access Private (Admin)
 */
export const deleteCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findByIdAndDelete(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle coupon status
 * PATCH /api/v1/coupons/:couponId/toggle-status
 * @access Private (Admin)
 */
export const toggleCouponStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    coupon.status = coupon.status === CouponStatus.ACTIVE 
      ? CouponStatus.INACTIVE
      : CouponStatus.ACTIVE;
    
    await coupon.save();

    res.json({
      success: true,
      message: `Coupon ${coupon.status === CouponStatus.ACTIVE ? 'activated' : 'deactivated'} successfully`,
      data: coupon
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get coupon statistics
 * GET /api/v1/coupons/admin/statistics
 * @access Private (Admin)
 */
export const getCouponStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalCoupons = await Coupon.countDocuments();
    const activeCoupons = await Coupon.countDocuments({ status: CouponStatus.ACTIVE });
    const expiredCoupons = await Coupon.countDocuments({ endDate: { $lt: new Date() } });

    const usageStats = await Order.aggregate([
      { $match: { 'couponApplied.code': { $exists: true } } },
      {
        $group: {
          _id: '$couponApplied.code',
          usageCount: { $sum: 1 },
          totalDiscount: { $sum: '$couponApplied.discountAmount' }
        }
      },
      { $sort: { usageCount: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        totalCoupons,
        activeCoupons,
        expiredCoupons,
        topCoupons: usageStats
      }
    });
  } catch (error) {
    next(error);
  }
};
