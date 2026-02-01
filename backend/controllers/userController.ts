import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Vendor from '../models/Vendor';

// @desc    Update own profile (user or vendor)
// @route   PUT /api/v1/users/me
// @access  Private (User, Vendor)
export const updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { firstName, lastName, phone, profileImage } = req.body;
    const userId = req.user!._id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }
    
    // Update fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (profileImage !== undefined) user.profileImage = profileImage;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete profile picture
// @route   DELETE /api/v1/users/me/profile-picture
// @access  Private (User, Vendor)
export const deleteProfilePicture = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }
    
    // Remove profile image
    user.profileImage = null;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile picture removed successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (Admin, Super Admin)
export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role, isBlocked, isActive } = req.query;
    
    const filter: any = {};
    if (role) filter.role = role;
    if (isBlocked !== undefined) filter.isBlocked = isBlocked === 'true';
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const users = await User.find(filter).sort({ createdAt: -1 } as any);
    
    res.status(200).json({
      success: true,
      data: {
        users,
        count: users.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/v1/users/:id
// @access  Private (Admin, Super Admin)
export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private (Admin, Super Admin)
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { firstName, lastName, phone, email } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }
    
    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (email) user.email = email.toLowerCase();
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private (Admin, Super Admin)
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }
    
    // If vendor, also delete vendor profile
    if (user.role === 'vendor') {
      await Vendor.findOneAndDelete({ userId: user._id });
    }
    
    await user.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Block/Unblock user
// @route   PATCH /api/v1/users/:id/block
// @access  Private (Admin, Super Admin)
export const toggleBlockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isBlocked } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }
    
    user.isBlocked = isBlocked;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add address to user
// @route   POST /api/v1/users/addresses
// @access  Private (User)
export const addAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { label, street, city, state, zipCode, country, isDefault } = req.body;
    const userId = req.user!._id;

    // Validate required fields
    if (!label || !street || !city || !state || !zipCode || !country) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All address fields are required'
        }
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    // If this is set as default, unset all other defaults
    if (isDefault) {
      user.addresses?.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // If this is the first address, make it default
    const makeDefault = isDefault || (user.addresses?.length === 0);

    user.addresses = user.addresses || [];
    user.addresses.push({
      label,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault: makeDefault
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: { addresses: user.addresses }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update address
// @route   PUT /api/v1/users/addresses/:addressId
// @access  Private (User)
export const updateAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { addressId } = req.params;
    const { label, street, city, state, zipCode, country, isDefault } = req.body;
    const userId = req.user!._id;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    const address = user.addresses?.find(addr => addr._id?.toString() === addressId);
    if (!address) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ADDRESS_NOT_FOUND',
          message: 'Address not found'
        }
      });
      return;
    }

    // If setting as default, unset all other defaults
    if (isDefault) {
      user.addresses?.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Update address fields
    if (label) address.label = label;
    if (street) address.street = street;
    if (city) address.city = city;
    if (state) address.state = state;
    if (zipCode) address.zipCode = zipCode;
    if (country) address.country = country;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: { addresses: user.addresses }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete address
// @route   DELETE /api/v1/users/addresses/:addressId
// @access  Private (User)
export const deleteAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { addressId } = req.params;
    const userId = req.user!._id;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    const addressIndex = user.addresses?.findIndex(addr => addr._id?.toString() === addressId);
    if (addressIndex === undefined || addressIndex === -1) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ADDRESS_NOT_FOUND',
          message: 'Address not found'
        }
      });
      return;
    }

    const wasDefault = user.addresses![addressIndex].isDefault;
    user.addresses!.splice(addressIndex, 1);

    // If deleted address was default and there are other addresses, make the first one default
    if (wasDefault && user.addresses!.length > 0) {
      user.addresses![0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      data: { addresses: user.addresses }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's addresses
// @route   GET /api/v1/users/addresses
// @access  Private (User)
export const getAddresses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;

    const user = await User.findById(userId).select('addresses');
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { addresses: user.addresses || [] }
    });
  } catch (error) {
    next(error);
  }
};
