import { Request, Response, NextFunction } from 'express';
import Category from '../models/Category';

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
export const getAllCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isActive, search } = req.query;
    
    const filter: any = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const categories = await Category.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .sort({ displayOrder: 1, name: 1 });
    
    res.status(200).json({
      success: true,
      data: {
        categories,
        count: categories.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category by ID
// @route   GET /api/v1/categories/:id
// @access  Public
export const getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');
    
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
    
    res.status(200).json({
      success: true,
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new category
// @route   POST /api/v1/admin/categories
// @access  Private (Admin, Super Admin)
export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, icon, image, displayOrder } = req.body;
    
    // Validate required fields
    if (!name) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category name is required'
        }
      });
      return;
    }
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingCategory) {
      res.status(409).json({
        success: false,
        error: {
          code: 'CATEGORY_EXISTS',
          message: 'Category with this name already exists'
        }
      });
      return;
    }
    
    // Create category
    const category = new Category({
      name: name.trim(),
      description: description?.trim(),
      icon,
      image,
      displayOrder: displayOrder || 0,
      createdBy: req.user!._id
    });
    
    await category.save();
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/v1/admin/categories/:id
// @access  Private (Admin, Super Admin)
export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, icon, image, displayOrder, isActive } = req.body;
    
    const category = await Category.findById(req.params.id);
    
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
    
    // Check if name is being changed and if it conflicts
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: category._id }
      });
      
      if (existingCategory) {
        res.status(409).json({
          success: false,
          error: {
            code: 'CATEGORY_EXISTS',
            message: 'Category with this name already exists'
          }
        });
        return;
      }
      category.name = name.trim();
    }
    
    // Update fields
    if (description !== undefined) category.description = description?.trim();
    if (icon !== undefined) category.icon = icon;
    if (image !== undefined) category.image = image;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (isActive !== undefined) category.isActive = isActive;
    
    await category.save();
    
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/v1/admin/categories/:id
// @access  Private (Admin, Super Admin)
export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id);
    
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
    
    // TODO: Check if category has services before deletion
    // For now, we'll allow deletion
    
    await category.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle category active status
// @route   PATCH /api/v1/admin/categories/:id/toggle-active
// @access  Private (Admin, Super Admin)
export const toggleCategoryStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id);
    
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
    
    category.isActive = !category.isActive;
    await category.save();
    
    res.status(200).json({
      success: true,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};
