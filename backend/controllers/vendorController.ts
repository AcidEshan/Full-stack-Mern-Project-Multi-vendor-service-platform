import { Request, Response, NextFunction } from 'express';
import Vendor from '../models/Vendor';
import User from '../models/User';

// @desc    Get my vendor profile (for logged-in vendor)
// @route   GET /api/v1/vendors/me
// @access  Private (Vendor)
export const getMyVendorProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user!._id })
      .populate('userId', 'firstName lastName email phone isEmailVerified isBlocked isActive');
    
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
    
    res.status(200).json({
      success: true,
      data: { vendor }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all vendors
// @route   GET /api/v1/vendors
// @access  Public (for listing), Private (admin for all details)
export const getAllVendors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { approvalStatus, isActive } = req.query;
    
    const filter: any = {};
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const vendors = await Vendor.find(filter)
      .populate('userId', 'firstName lastName email phone isEmailVerified isBlocked isActive')
      .sort({ createdAt: -1 } as any);
    
    res.status(200).json({
      success: true,
      data: {
        vendors,
        count: vendors.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending vendors (not approved)
// @route   GET /api/v1/vendors/pending/list
// @access  Private (Admin, Super Admin)
export const getPendingVendors = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendors = await Vendor.find({ approvalStatus: 'pending' })
      .populate('userId', 'firstName lastName email phone isEmailVerified isBlocked isActive')
      .sort({ createdAt: -1 } as any);
    
    res.status(200).json({
      success: true,
      data: {
        vendors,
        count: vendors.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor by ID
// @route   GET /api/v1/vendors/:id
// @access  Public
export const getVendorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone isEmailVerified isBlocked isActive');
    
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
    
    res.status(200).json({
      success: true,
      data: { vendor }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vendor
// @route   PUT /api/v1/vendors/:id
// @access  Private (Vendor owner, Admin, Super Admin)
export const updateVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      companyName,
      description,
      address,
      companyLogo,
      coverImage,
      website,
      facebook,
      twitter,
      instagram,
      linkedin,
      yearsInBusiness,
      numberOfEmployees,
      serviceAreas,
      languages,
      businessRegistrationNumber,
      taxId
    } = req.body;
    
    const vendor = await Vendor.findById(req.params.id);
    
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
    
    // Update fields
    if (companyName) vendor.companyName = companyName;
    if (description) vendor.description = description;
    if (address) vendor.address = { ...vendor.address, ...address };
    if (companyLogo) vendor.companyLogo = companyLogo;
    if (coverImage) vendor.coverImage = coverImage;
    if (website) vendor.website = website;
    if (facebook) vendor.facebook = facebook;
    if (twitter) vendor.twitter = twitter;
    if (instagram) vendor.instagram = instagram;
    if (linkedin) vendor.linkedin = linkedin;
    if (yearsInBusiness !== undefined) vendor.yearsInBusiness = yearsInBusiness;
    if (numberOfEmployees !== undefined) vendor.numberOfEmployees = numberOfEmployees;
    if (serviceAreas) vendor.serviceAreas = serviceAreas;
    if (languages) vendor.languages = languages;
    if (businessRegistrationNumber) vendor.businessRegistrationNumber = businessRegistrationNumber;
    if (taxId) vendor.taxId = taxId;
    
    await vendor.save();
    
    res.status(200).json({
      success: true,
      message: 'Vendor updated successfully',
      data: { vendor }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vendor
// @route   DELETE /api/v1/vendors/:id
// @access  Private (Admin, Super Admin)
export const deleteVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    
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
    
    // Also delete associated user
    await User.findByIdAndDelete(vendor.userId);
    await vendor.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve vendor
// @route   PATCH /api/v1/vendors/:id/approve
// @access  Private (Admin, Super Admin)
export const approveVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    
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
    
    vendor.approvalStatus = 'approved';
    vendor.approvedBy = req.user!._id;
    vendor.approvalDate = new Date();
    await vendor.save();
    
    // Update user's isApproved status
    await User.findByIdAndUpdate(vendor.userId, { isApproved: true });
    
    res.status(200).json({
      success: true,
      message: 'Vendor approved successfully',
      data: { vendor }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject vendor
// @route   PATCH /api/v1/vendors/:id/reject
// @access  Private (Admin, Super Admin)
export const rejectVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Rejection reason is required'
        }
      });
      return;
    }
    
    const vendor = await Vendor.findById(req.params.id);
    
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
    
    vendor.approvalStatus = 'rejected';
    vendor.rejectionReason = reason;
    await vendor.save();
    
    res.status(200).json({
      success: true,
      message: 'Vendor rejected successfully',
      data: { vendor }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle vendor active status
// @route   PATCH /api/v1/vendors/:id/status
// @access  Private (Admin, Super Admin)
export const toggleVendorStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isActive } = req.body;
    
    const vendor = await Vendor.findById(req.params.id);
    
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
    
    vendor.isActive = isActive;
    await vendor.save();
    
    res.status(200).json({
      success: true,
      message: `Vendor ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { vendor }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vendor profile (Enhanced)
// @route   PATCH /api/v1/vendors/:id/profile
// @access  Private (Vendor owner)
export const updateVendorProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendorId = req.params.id;
    const userId = req.user?._id;
    
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
    
    // Check if user owns this vendor profile
    if (vendor.userId.toString() !== userId?.toString() && !['admin', 'super_admin'].includes(req.user?.role || '')) {
      res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized to update this vendor profile'
        }
      });
      return;
    }
    
    const {
      companyName,
      description,
      companyLogo,
      coverImage,
      address,
      website,
      facebook,
      twitter,
      instagram,
      linkedin,
      yearsInBusiness,
      numberOfEmployees,
      serviceAreas,
      languages,
      businessRegistrationNumber,
      taxId
    } = req.body;
    
    // Update fields
    if (companyName) vendor.companyName = companyName;
    if (description !== undefined) vendor.description = description;
    if (companyLogo !== undefined) vendor.companyLogo = companyLogo;
    if (coverImage !== undefined) vendor.coverImage = coverImage;
    if (address) vendor.address = { ...vendor.address, ...address };
    if (website !== undefined) vendor.website = website;
    if (facebook !== undefined) vendor.facebook = facebook;
    if (twitter !== undefined) vendor.twitter = twitter;
    if (instagram !== undefined) vendor.instagram = instagram;
    if (linkedin !== undefined) vendor.linkedin = linkedin;
    if (yearsInBusiness !== undefined) vendor.yearsInBusiness = yearsInBusiness;
    if (numberOfEmployees !== undefined) vendor.numberOfEmployees = numberOfEmployees;
    if (serviceAreas !== undefined) vendor.serviceAreas = serviceAreas;
    if (languages !== undefined) vendor.languages = languages;
    if (businessRegistrationNumber !== undefined) vendor.businessRegistrationNumber = businessRegistrationNumber;
    if (taxId !== undefined) vendor.taxId = taxId;
    
    await vendor.save();
    
    res.status(200).json({
      success: true,
      message: 'Vendor profile updated successfully',
      data: { vendor }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload vendor documents
// @route   POST /api/v1/vendors/:id/documents
// @access  Private (Vendor owner, Admin)
export const uploadVendorDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendorId = req.params.id;
    const userId = req.user?._id;
    const { documentType, documentUrl } = req.body;
    
    if (!documentType || !documentUrl) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Document type and URL are required'
        }
      });
      return;
    }
    
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
    
    // Check if user owns this vendor profile
    if (vendor.userId.toString() !== userId?.toString() && !['admin', 'super_admin'].includes(req.user?.role || '')) {
      res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized to upload documents for this vendor'
        }
      });
      return;
    }
    
    // Add document
    vendor.documents.push({
      documentType,
      documentUrl,
      uploadedAt: new Date()
    });
    
    await vendor.save();
    
    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: { vendor }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vendor document
// @route   DELETE /api/v1/vendors/:id/documents/:documentId
// @access  Private (Vendor owner, Admin)
export const deleteVendorDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: vendorId, documentId } = req.params;
    const userId = req.user?._id;
    
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
    
    // Check if user owns this vendor profile
    if (vendor.userId.toString() !== userId?.toString() && !['admin', 'super_admin'].includes(req.user?.role || '')) {
      res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized to delete documents for this vendor'
        }
      });
      return;
    }
    
    // Remove document
    vendor.documents = vendor.documents.filter(
      (doc: any) => doc._id.toString() !== documentId
    );
    
    await vendor.save();
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      data: { vendor }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vendor working hours
// @route   PUT /api/v1/vendors/working-hours
// @access  Private (Vendor)
export const updateWorkingHours = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { workingHours } = req.body;
    const userId = req.user!._id;

    // Validate working hours format
    if (!Array.isArray(workingHours)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Working hours must be an array'
        }
      });
      return;
    }

    const vendor = await Vendor.findOne({ userId });
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

    vendor.workingHours = workingHours;
    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Working hours updated successfully',
      data: { workingHours: vendor.workingHours }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set vendor vacation mode
// @route   POST /api/v1/vendors/vacation
// @access  Private (Vendor)
export const setVacationMode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isOnVacation, vacationStartDate, vacationEndDate, vacationNote } = req.body;
    const userId = req.user!._id;

    const vendor = await Vendor.findOne({ userId });
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

    // Validate dates if vacation is being enabled
    if (isOnVacation) {
      if (!vacationStartDate || !vacationEndDate) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Vacation start and end dates are required'
          }
        });
        return;
      }

      if (new Date(vacationEndDate) <= new Date(vacationStartDate)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'End date must be after start date'
          }
        });
        return;
      }
    }

    vendor.isOnVacation = isOnVacation;
    vendor.vacationStartDate = isOnVacation ? new Date(vacationStartDate) : undefined;
    vendor.vacationEndDate = isOnVacation ? new Date(vacationEndDate) : undefined;
    vendor.vacationNote = isOnVacation ? vacationNote : undefined;

    await vendor.save();

    res.status(200).json({
      success: true,
      message: `Vacation mode ${isOnVacation ? 'enabled' : 'disabled'} successfully`,
      data: {
        isOnVacation: vendor.isOnVacation,
        vacationStartDate: vendor.vacationStartDate,
        vacationEndDate: vendor.vacationEndDate,
        vacationNote: vendor.vacationNote
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor's working hours
// @route   GET /api/v1/vendors/:id/working-hours
// @access  Public
export const getVendorWorkingHours = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id).select('workingHours isOnVacation vacationStartDate vacationEndDate vacationNote');
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

    res.status(200).json({
      success: true,
      data: {
        workingHours: vendor.workingHours || [],
        isOnVacation: vendor.isOnVacation,
        vacationStartDate: vendor.vacationStartDate,
        vacationEndDate: vendor.vacationEndDate,
        vacationNote: vendor.vacationNote
      }
    });
  } catch (error) {
    next(error);
  }
};
