import { Request, Response, NextFunction } from 'express';
import { Review } from '../models/Review';
import { Order, OrderStatus } from '../models/Order';
import Service from '../models/Service';
import Vendor from '../models/Vendor';
import mongoose from 'mongoose';

// ==================== USER REVIEW OPERATIONS ====================

/**
 * Submit a review for completed order
 * POST /api/v1/reviews
 * @access Private (User)
 */
export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { orderId, rating, comment, images } = req.body;

    // Validate required fields
    if (!orderId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, rating, and comment are required'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
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
        message: 'Not authorized to review this order'
      });
    }

    // Check if order is completed
    if (order.status !== OrderStatus.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed orders'
      });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Order has already been reviewed'
      });
    }

    // Create review
    const review = await Review.create({
      order: orderId,
      user: userId,
      vendor: order.vendor,
      service: order.service,
      rating,
      comment,
      images: images || [],
      isVerifiedPurchase: true
    });

    // Update order
    order.isReviewed = true;
    order.reviewId = review._id as mongoose.Types.ObjectId;
    await order.save();

    // Populate review details
    await review.populate([
      { path: 'user', select: 'firstName lastName' },
      { path: 'service', select: 'name' },
      { path: 'vendor', select: 'companyName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's reviews
 * GET /api/v1/reviews/my-reviews
 * @access Private (User)
 */
export const getMyReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await Review.find({ user: userId })
      .populate('service', 'name images')
      .populate('vendor', 'companyName logo')
      .populate('order', 'orderNumber scheduledDate')
      .sort({ createdAt: -1 } as any)
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments({ user: userId });

    res.json({
      success: true,
      data: reviews,
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
 * Update review
 * PUT /api/v1/reviews/:reviewId
 * @access Private (User - owner)
 */
export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?._id;
    const { rating, comment, images } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.user.toString() !== userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    // Update fields
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }
      review.rating = rating;
    }
    if (comment !== undefined) review.comment = comment;
    if (images !== undefined) review.images = images;

    await review.save();

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete review
 * DELETE /api/v1/reviews/:reviewId
 * @access Private (User - owner)
 */
export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.user.toString() !== userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await Review.findByIdAndDelete(reviewId);

    // Update order
    await Order.findByIdAndUpdate(review.order, {
      isReviewed: false,
      reviewId: null
    });

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== PUBLIC REVIEW BROWSING ====================

/**
 * Get reviews for a service
 * GET /api/v1/reviews/service/:serviceId
 * @access Public
 */
export const getServiceReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serviceId } = req.params;
    const { rating, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter: any = {
      service: serviceId,
      isVisible: true
    };

    if (rating) {
      filter.rating = Number(rating);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy as string]: sortOrder === 'desc' ? -1 : 1 };

    const reviews = await Review.find(filter)
      .populate('user', 'firstName lastName')
      .sort(sort as any)
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments(filter);

    // Get rating statistics
    const stats = await (Review as any).calculateAverageRating(serviceId, 'service');
    const distribution = await (Review as any).getRatingDistribution(serviceId, 'service');

    res.json({
      success: true,
      data: reviews,
      statistics: {
        averageRating: Math.round(stats.averageRating * 10) / 10,
        totalReviews: stats.totalReviews,
        distribution
      },
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
 * Get reviews for a vendor
 * GET /api/v1/reviews/vendor/:vendorId
 * @access Public
 */
export const getVendorReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vendorId } = req.params;
    const { rating, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter: any = {
      vendor: vendorId,
      isVisible: true
    };

    if (rating) {
      filter.rating = Number(rating);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy as string]: sortOrder === 'desc' ? -1 : 1 };

    const reviews = await Review.find(filter)
      .populate('user', 'firstName lastName')
      .populate('service', 'name')
      .sort(sort as any)
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments(filter);

    // Get rating statistics
    const stats = await (Review as any).calculateAverageRating(vendorId, 'vendor');
    const distribution = await (Review as any).getRatingDistribution(vendorId, 'vendor');

    res.json({
      success: true,
      data: reviews,
      statistics: {
        averageRating: Math.round(stats.averageRating * 10) / 10,
        totalReviews: stats.totalReviews,
        distribution
      },
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
 * Get review by ID
 * GET /api/v1/reviews/:reviewId
 * @access Public
 */
export const getReviewById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId)
      .populate('user', 'firstName lastName')
      .populate('service', 'name images')
      .populate('vendor', 'companyName logo');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (!review.isVisible) {
      return res.status(404).json({
        success: false,
        message: 'Review not available'
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// ==================== VENDOR REVIEW MANAGEMENT ====================

/**
 * Respond to review
 * POST /api/v1/reviews/:reviewId/respond
 * @access Private (Vendor)
 */
export const respondToReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params;
    const vendorId = req.user?._id;
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({
        success: false,
        message: 'Response is required'
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if vendor owns this review
    if (review.vendor.toString() !== vendorId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this review'
      });
    }

    // Check if already responded
    if (review.vendorResponse) {
      return res.status(400).json({
        success: false,
        message: 'Review has already been responded to'
      });
    }

    // Add response
    review.vendorResponse = response;
    review.vendorRespondedAt = new Date();
    await review.save();

    await review.populate([
      { path: 'user', select: 'firstName lastName' },
      { path: 'service', select: 'name' }
    ]);

    res.json({
      success: true,
      message: 'Response added successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update vendor response
 * PUT /api/v1/reviews/:reviewId/respond
 * @access Private (Vendor)
 */
export const updateVendorResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params;
    const vendorId = req.user?._id;
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({
        success: false,
        message: 'Response is required'
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.vendor.toString() !== vendorId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this response'
      });
    }

    review.vendorResponse = response;
    await review.save();

    res.json({
      success: true,
      message: 'Response updated successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ADMIN REVIEW MODERATION ====================

/**
 * Hide/unhide review
 * PATCH /api/v1/reviews/:reviewId/visibility
 * @access Private (Admin, Super Admin)
 */
export const toggleReviewVisibility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params;
    const adminId = req.user?._id;
    const { isVisible, moderationNotes } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.isVisible = isVisible;
    review.moderatedBy = adminId;
    if (moderationNotes) {
      review.moderationNotes = moderationNotes;
    }

    await review.save();

    res.json({
      success: true,
      message: `Review ${isVisible ? 'shown' : 'hidden'} successfully`,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete review (Admin)
 * DELETE /api/v1/reviews/admin/:reviewId
 * @access Private (Admin, Super Admin)
 */
export const adminDeleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await Review.findByIdAndDelete(reviewId);

    // Update order
    await Order.findByIdAndUpdate(review.order, {
      isReviewed: false,
      reviewId: null
    });

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all reviews (Admin)
 * GET /api/v1/reviews/admin/all
 * @access Private (Admin, Super Admin)
 */
export const adminGetAllReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      isVisible,
      rating,
      vendorId,
      serviceId,
      userId,
      page = 1,
      limit = 20
    } = req.query;

    const filter: any = {};
    if (isVisible !== undefined) filter.isVisible = isVisible === 'true';
    if (rating) filter.rating = Number(rating);
    if (vendorId) filter.vendor = vendorId;
    if (serviceId) filter.service = serviceId;
    if (userId) filter.user = userId;

    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await Review.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('vendor', 'companyName email')
      .populate('service', 'name')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 } as any)
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments(filter);

    res.json({
      success: true,
      data: reviews,
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
 * Get review statistics (Admin)
 * GET /api/v1/reviews/admin/statistics
 * @access Private (Admin, Super Admin)
 */
export const getReviewStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vendorId, serviceId } = req.query;

    const match: any = {};
    if (vendorId) match.vendor = new mongoose.Types.ObjectId(vendorId as string);
    if (serviceId) match.service = new mongoose.Types.ObjectId(serviceId as string);

    // Rating distribution
    const distribution = await Review.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Overall statistics
    const overallStats = await Review.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          visibleReviews: {
            $sum: { $cond: ['$isVisible', 1, 0] }
          },
          withVendorResponse: {
            $sum: { $cond: [{ $ne: ['$vendorResponse', null] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        distribution,
        overall: overallStats[0] || {
          totalReviews: 0,
          averageRating: 0,
          visibleReviews: 0,
          withVendorResponse: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
