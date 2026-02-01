import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Favorite from '../models/Favorite';
import Service from '../models/Service';
import Vendor from '../models/Vendor';

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id) && id !== 'undefined' && id !== 'null';
};

// @desc    Add service to favorites
// @route   POST /api/v1/favorites/service/:serviceId
// @access  Private (User)
export const addServiceToFavorites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { serviceId } = req.params;
    const userId = req.user!._id;

    // Validate serviceId format
    if (!isValidObjectId(serviceId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SERVICE_ID',
          message: 'Invalid service ID format. Please provide a valid service ID.'
        }
      });
      return;
    }

    // Check if service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SERVICE_NOT_FOUND',
          message: 'Service not found'
        }
      });
      return;
    }

    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({ userId, serviceId, type: 'service' });
    if (existingFavorite) {
      res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_IN_FAVORITES',
          message: 'Service is already in your favorites'
        }
      });
      return;
    }

    // Add to favorites
    const favorite = await Favorite.create({
      userId,
      serviceId,
      type: 'service'
    });

    res.status(201).json({
      success: true,
      message: 'Service added to favorites',
      data: { favorite }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add vendor to favorites
// @route   POST /api/v1/favorites/vendor/:vendorId
// @access  Private (User)
export const addVendorToFavorites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { vendorId } = req.params;
    const userId = req.user!._id;

    // Validate vendorId format
    if (!isValidObjectId(vendorId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_VENDOR_ID',
          message: 'Invalid vendor ID format. Please provide a valid vendor ID.'
        }
      });
      return;
    }

    // Check if vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      res.status(404).json({
        success: false,
        error: {
          code: 'VENDOR_NOT_FOUND',
          message: 'Vendor not found'
        }
      });
      return;
    }

    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({ userId, vendorId, type: 'vendor' });
    if (existingFavorite) {
      res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_IN_FAVORITES',
          message: 'Vendor is already in your favorites'
        }
      });
      return;
    }

    // Add to favorites
    const favorite = await Favorite.create({
      userId,
      vendorId,
      type: 'vendor'
    });

    res.status(201).json({
      success: true,
      message: 'Vendor added to favorites',
      data: { favorite }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove service from favorites
// @route   DELETE /api/v1/favorites/service/:serviceId
// @access  Private (User)
export const removeServiceFromFavorites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { serviceId } = req.params;
    const userId = req.user!._id;

    // Validate serviceId format
    if (!isValidObjectId(serviceId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SERVICE_ID',
          message: 'Invalid service ID format. Please provide a valid service ID.'
        }
      });
      return;
    }

    const favorite = await Favorite.findOneAndDelete({ userId, serviceId, type: 'service' });
    if (!favorite) {
      res.status(404).json({
        success: false,
        error: {
          code: 'FAVORITE_NOT_FOUND',
          message: 'Service not found in favorites'
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Service removed from favorites'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove vendor from favorites
// @route   DELETE /api/v1/favorites/vendor/:vendorId
// @access  Private (User)
export const removeVendorFromFavorites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { vendorId } = req.params;
    const userId = req.user!._id;

    // Validate vendorId format
    if (!isValidObjectId(vendorId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_VENDOR_ID',
          message: 'Invalid vendor ID format. Please provide a valid vendor ID.'
        }
      });
      return;
    }

    const favorite = await Favorite.findOneAndDelete({ userId, vendorId, type: 'vendor' });
    if (!favorite) {
      res.status(404).json({
        success: false,
        error: {
          code: 'FAVORITE_NOT_FOUND',
          message: 'Vendor not found in favorites'
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Vendor removed from favorites'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's favorite services
// @route   GET /api/v1/favorites/services
// @access  Private (User)
export const getFavoriteServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [favorites, total] = await Promise.all([
      Favorite.find({ userId, type: 'service' })
        .populate({
          path: 'serviceId',
          populate: [
            { path: 'categoryId', select: 'name slug icon' },
            { path: 'vendorId', select: 'companyName companyLogo rating' }
          ]
        })
        .sort({ createdAt: -1 } as any)
        .skip(skip)
        .limit(Number(limit)),
      Favorite.countDocuments({ userId, type: 'service' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        favorites: favorites.map(f => f.serviceId),
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's favorite vendors
// @route   GET /api/v1/favorites/vendors
// @access  Private (User)
export const getFavoriteVendors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [favorites, total] = await Promise.all([
      Favorite.find({ userId, type: 'vendor' })
        .populate({
          path: 'vendorId',
          populate: { path: 'userId', select: 'firstName lastName email phone' }
        })
        .sort({ createdAt: -1 } as any)
        .skip(skip)
        .limit(Number(limit)),
      Favorite.countDocuments({ userId, type: 'vendor' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        favorites: favorites.map(f => f.vendorId),
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if service is in favorites
// @route   GET /api/v1/favorites/service/:serviceId/check
// @access  Private (User)
export const checkServiceInFavorites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { serviceId } = req.params;
    const userId = req.user!._id;

    // Validate serviceId format
    if (!isValidObjectId(serviceId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SERVICE_ID',
          message: 'Invalid service ID format. Please provide a valid service ID.'
        }
      });
      return;
    }

    const favorite = await Favorite.findOne({ userId, serviceId, type: 'service' });

    res.status(200).json({
      success: true,
      data: {
        isFavorite: !!favorite
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if vendor is in favorites
// @route   GET /api/v1/favorites/vendor/:vendorId/check
// @access  Private (User)
export const checkVendorInFavorites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { vendorId } = req.params;
    const userId = req.user!._id;

    // Validate vendorId format
    if (!isValidObjectId(vendorId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_VENDOR_ID',
          message: 'Invalid vendor ID format. Please provide a valid vendor ID.'
        }
      });
      return;
    }

    const favorite = await Favorite.findOne({ userId, vendorId, type: 'vendor' });

    res.status(200).json({
      success: true,
      data: {
        isFavorite: !!favorite
      }
    });
  } catch (error) {
    next(error);
  }
};
