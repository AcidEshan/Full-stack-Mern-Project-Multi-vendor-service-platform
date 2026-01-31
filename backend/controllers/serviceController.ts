import { Request, Response, NextFunction } from 'express';
import Service from '../models/Service';
import Vendor from '../models/Vendor';
import Category from '../models/Category';

// @desc    Create new service
// @route   POST /api/v1/vendor/services
// @access  Private (Vendor - approved only)
export const createService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      categoryId,
      name,
      description,
      price,
      discount,
      billingType,
      duration,
      images,
      features,
      workProcessSteps,
      terms,
      tags
    } = req.body;

    // Validate required fields
    if (!categoryId || !name || !description || !price) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Required fields: categoryId, name, description, price'
        }
      });
      return;
    }

    // Check if vendor exists and is approved
    const vendor = await Vendor.findOne({ userId: req.user!._id });
    if (!vendor) {
      res.status(404).json({
        success: false,
        error: {
          code: 'VENDOR_NOT_FOUND',
          message: 'Vendor profile not found'
        }
      });
      return;
    }

    if (vendor.approvalStatus !== 'approved') {
      res.status(403).json({
        success: false,
        error: {
          code: 'VENDOR_NOT_APPROVED',
          message: 'Your vendor account must be approved before creating services'
        }
      });
      return;
    }

    // Check if vendor is active
    if (!vendor.isActive) {
      res.status(403).json({
        success: false,
        error: {
          code: 'VENDOR_DEACTIVATED',
          message: 'Your vendor account is deactivated. You cannot create services.'
        }
      });
      return;
    }

    // Check if category exists and is active
    const category = await Category.findById(categoryId);
    if (!category) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found'
        }
      });
      return;
    }

    if (!category.isActive) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CATEGORY_INACTIVE',
          message: 'Selected category is not active'
        }
      });
      return;
    }

    // Create service
    const service = new Service({
      vendorId: vendor._id,
      categoryId,
      name: name.trim(),
      description: description.trim(),
      price,
      discount: discount || 0,
      billingType: billingType || 'per_service',
      duration,
      images: images || [],
      features: features || [],
      workProcessSteps: workProcessSteps || [],
      terms: terms?.trim(),
      tags: tags || []
    });

    await service.save();

    // Populate vendor and category info
    await service.populate([
      { path: 'vendorId', select: 'companyName companyLogo rating' },
      { path: 'categoryId', select: 'name slug icon' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor's services
// @route   GET /api/v1/vendor/services
// @access  Private (Vendor)
export const getVendorServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isActive, isAvailable, categoryId, page = 1, limit = 20 } = req.query;

    // Find vendor
    const vendor = await Vendor.findOne({ userId: req.user!._id });
    if (!vendor) {
      res.status(404).json({
        success: false,
        error: {
          code: 'VENDOR_NOT_FOUND',
          message: 'Vendor profile not found'
        }
      });
      return;
    }

    const filter: any = { vendorId: vendor._id };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
    if (categoryId) filter.categoryId = categoryId;

    const skip = (Number(page) - 1) * Number(limit);

    const [services, total] = await Promise.all([
      Service.find(filter)
        .populate('categoryId', 'name slug icon description')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Service.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        services,
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

// @desc    Get all services (public browsing with advanced search)
// @route   GET /api/v1/services
// @access  Public
export const getAllServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      categoryId,
      vendorId,
      minPrice,
      maxPrice,
      minRating,
      location,
      search,
      tags,
      sort = '-createdAt',
      page = 1,
      limit = 20
    } = req.query;

    const filter: any = { isActive: true, isAvailable: true };

    // Category filter
    if (categoryId) filter.categoryId = categoryId;
    
    // Vendor filter
    if (vendorId) filter.vendorId = vendorId;
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Rating filter
    if (minRating) {
      filter.rating = { $gte: Number(minRating) };
    }

    // Tags filter
    if (tags) {
      const tagArray = typeof tags === 'string' ? tags.split(',') : tags;
      filter.tags = { $in: tagArray };
    }

    // Text search (searches in name, description, tags)
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ];
    }

    // Filter out services from deactivated or non-approved vendors
    const vendorFilter: any = { approvalStatus: 'approved', isActive: true };
    
    // Location-based filtering (search in vendor's service areas)
    if (location) {
      vendorFilter.serviceAreas = new RegExp(location as string, 'i');
    }
    
    // Get only active and approved vendors
    const activeVendors = await Vendor.find(vendorFilter).select('_id');
    const activeVendorIds = activeVendors.map(v => v._id);
    
    // Only show services from active vendors.
    // If a vendorId filter is provided, ensure that vendor is active & approved; otherwise return an empty result.
    if (vendorId) {
      const vendorIsActive = activeVendorIds.some(vId => vId.toString() === vendorId.toString());
      if (!vendorIsActive) {
        // No services to show for an inactive/non-approved vendor
        res.status(200).json({
          success: true,
          data: {
            services: [],
            pagination: {
              current: Number(page),
              pages: 0,
              total: 0,
              limit: Number(limit)
            }
          }
        });
        return;
      }
      filter.vendorId = vendorId;
    } else {
      filter.vendorId = { $in: activeVendorIds };
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Parse sort parameter (supports: -createdAt, price_low, price_high, rating, popular, name)
    let sortOption: any = {};
    if (sort === 'price_low') sortOption = { price: 1 };
    else if (sort === 'price_high') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { rating: -1 };
    else if (sort === 'popular') sortOption = { totalBookings: -1 };
    else if (sort === 'name') sortOption = { name: 1 };
    else sortOption = { createdAt: -1 };

    const [services, total] = await Promise.all([
      Service.find(filter)
        .populate({
          path: 'vendorId',
          select: 'companyName companyLogo rating totalReviews approvalStatus serviceAreas',
          populate: {
            path: 'userId',
            select: 'firstName lastName email phone'
          }
        })
        .populate('categoryId', 'name slug icon description')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Service.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        services,
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

// @desc    Get service by ID
// @route   GET /api/v1/services/:id
// @access  Public
export const getServiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const service = await Service.findById(req.params.id)
      .populate({
        path: 'vendorId',
        select: 'companyName companyLogo description address rating totalReviews approvalStatus serviceAreas workingHours isActive',
        populate: {
          path: 'userId',
          select: 'firstName lastName email phone'
        }
      })
      .populate('categoryId', 'name slug icon description');

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

    // Check if vendor is active and approved
    const vendor = service.vendorId as any;
    if (!vendor || !vendor.isActive || vendor.approvalStatus !== 'approved') {
      res.status(404).json({
        success: false,
        error: {
          code: 'SERVICE_NOT_AVAILABLE',
          message: 'This service is currently not available'
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update service
// @route   PUT /api/v1/vendor/services/:id
// @access  Private (Vendor)
export const updateService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Find vendor
    const vendor = await Vendor.findOne({ userId: req.user!._id });
    if (!vendor) {
      res.status(404).json({
        success: false,
        error: {
          code: 'VENDOR_NOT_FOUND',
          message: 'Vendor profile not found'
        }
      });
      return;
    }

    // Find service
    const service = await Service.findOne({ _id: req.params.id, vendorId: vendor._id });
    if (!service) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SERVICE_NOT_FOUND',
          message: 'Service not found or unauthorized'
        }
      });
      return;
    }

    const {
      categoryId,
      name,
      description,
      price,
      discount,
      billingType,
      duration,
      images,
      features,
      workProcessSteps,
      terms,
      tags
    } = req.body;

    // If category is being updated, validate it
    if (categoryId && categoryId !== service.categoryId.toString()) {
      const category = await Category.findById(categoryId);
      if (!category || !category.isActive) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CATEGORY',
            message: 'Invalid or inactive category'
          }
        });
        return;
      }
      service.categoryId = categoryId;
    }

    // Update fields
    if (name) service.name = name.trim();
    if (description) service.description = description.trim();
    if (price !== undefined) service.price = price;
    if (discount !== undefined) service.discount = discount;
    if (billingType) service.billingType = billingType;
    if (duration !== undefined) service.duration = duration;
    if (images) service.images = images;
    if (features) service.features = features;
    if (workProcessSteps) service.workProcessSteps = workProcessSteps;
    if (terms !== undefined) service.terms = terms?.trim();
    if (tags) service.tags = tags;

    await service.save();

    await service.populate([
      { path: 'vendorId', select: 'companyName companyLogo rating' },
      { path: 'categoryId', select: 'name slug icon' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete service
// @route   DELETE /api/v1/vendor/services/:id
// @access  Private (Vendor)
export const deleteService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Find vendor
    const vendor = await Vendor.findOne({ userId: req.user!._id });
    if (!vendor) {
      res.status(404).json({
        success: false,
        error: {
          code: 'VENDOR_NOT_FOUND',
          message: 'Vendor profile not found'
        }
      });
      return;
    }

    // Find service
    const service = await Service.findOne({ _id: req.params.id, vendorId: vendor._id });
    if (!service) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SERVICE_NOT_FOUND',
          message: 'Service not found or unauthorized'
        }
      });
      return;
    }

    await service.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle service active status
// @route   PATCH /api/v1/vendor/services/:id/toggle-active
// @access  Private (Vendor)
export const toggleServiceActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Find vendor
    const vendor = await Vendor.findOne({ userId: req.user!._id });
    if (!vendor) {
      res.status(404).json({
        success: false,
        error: {
          code: 'VENDOR_NOT_FOUND',
          message: 'Vendor profile not found'
        }
      });
      return;
    }

    // Find service
    const service = await Service.findOne({ _id: req.params.id, vendorId: vendor._id });
    if (!service) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SERVICE_NOT_FOUND',
          message: 'Service not found or unauthorized'
        }
      });
      return;
    }

    service.isActive = !service.isActive;
    await service.save();

    res.status(200).json({
      success: true,
      message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle service availability
// @route   PATCH /api/v1/vendor/services/:id/toggle-availability
// @access  Private (Vendor)
export const toggleServiceAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Find vendor
    const vendor = await Vendor.findOne({ userId: req.user!._id });
    if (!vendor) {
      res.status(404).json({
        success: false,
        error: {
          code: 'VENDOR_NOT_FOUND',
          message: 'Vendor profile not found'
        }
      });
      return;
    }

    // Find service
    const service = await Service.findOne({ _id: req.params.id, vendorId: vendor._id });
    if (!service) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SERVICE_NOT_FOUND',
          message: 'Service not found or unauthorized'
        }
      });
      return;
    }

    service.isAvailable = !service.isAvailable;
    await service.save();

    res.status(200).json({
      success: true,
      message: `Service is now ${service.isAvailable ? 'available' : 'unavailable'}`,
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get services by category
// @route   GET /api/v1/categories/:categoryId/services
// @access  Public
export const getServicesByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20, sort = '-createdAt' } = req.query;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found'
        }
      });
      return;
    }

    // Filter out services from deactivated or non-approved vendors
    const vendorFilter: any = { approvalStatus: 'approved', isActive: true };
    const activeVendors = await Vendor.find(vendorFilter).select('_id');
    const activeVendorIds = activeVendors.map(v => v._id);
    
    const filter: any = { 
      categoryId, 
      isActive: true, 
      isAvailable: true,
      vendorId: { $in: activeVendorIds }
    };
    const skip = (Number(page) - 1) * Number(limit);

    // Parse sort
    let sortOption: any = {};
    if (sort === 'price_low') sortOption = { price: 1 };
    else if (sort === 'price_high') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { rating: -1 };
    else if (sort === 'popular') sortOption = { totalBookings: -1 };
    else sortOption = { createdAt: -1 };

    const [services, total] = await Promise.all([
      Service.find(filter)
        .populate('vendorId', 'companyName companyLogo rating')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Service.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        category,
        services,
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

// @desc    Admin - Get all services
// @route   GET /api/v1/admin/services
// @access  Private (Admin, Super Admin)
export const adminGetAllServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isActive, vendorId, categoryId, page = 1, limit = 20 } = req.query;

    const filter: any = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (vendorId) filter.vendorId = vendorId;
    if (categoryId) filter.categoryId = categoryId;

    const skip = (Number(page) - 1) * Number(limit);

    const [services, total] = await Promise.all([
      Service.find(filter)
        .populate({
          path: 'vendorId',
          select: 'companyName companyLogo rating totalReviews approvalStatus userId',
          populate: {
            path: 'userId',
            select: 'firstName lastName email phone'
          }
        })
        .populate('categoryId', 'name slug icon')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Service.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        services,
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

// @desc    Admin - Block/unblock service
// @route   PATCH /api/v1/admin/services/:id/block
// @access  Private (Admin, Super Admin)
export const adminBlockService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isActive } = req.body;

    const service = await Service.findById(req.params.id);
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

    service.isActive = isActive !== undefined ? isActive : !service.isActive;
    await service.save();

    res.status(200).json({
      success: true,
      message: `Service ${service.isActive ? 'unblocked' : 'blocked'} successfully`,
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};
