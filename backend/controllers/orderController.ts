import { Request, Response, NextFunction } from 'express';
import { Order, OrderStatus, PaymentStatus } from '../models/Order';
import Service from '../models/Service';
import Vendor from '../models/Vendor';
import mongoose from 'mongoose';

// ==================== USER BOOKING OPERATIONS ====================

/**
 * Create a new booking/order
 * POST /api/v1/orders
 * @access Private (User, Vendor, Admin)
 */
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    
    // Log the incoming request body for debugging
    console.log('[CREATE ORDER] Request body:', JSON.stringify(req.body, null, 2));
    console.log('[CREATE ORDER] User ID:', userId);
    
    const {
      serviceId,
      scheduledDate,
      scheduledTime,
      address,
      notes,
      specialRequirements
    } = req.body;

    // Validate required fields from frontend
    if (!serviceId || !scheduledDate || !scheduledTime || !address) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: serviceId, scheduledDate, scheduledTime, and address are required'
      });
      return;
    }

    // Auto-fill customer details from logged-in user
    const user = req.user!;
    const customerName = `${user.firstName} ${user.lastName}`;
    const customerPhone = user.phone;
    const customerEmail = user.email;

    // Parse address - handle both string and object formats
    let addressObj: any;
    if (typeof address === 'string') {
      // If address is a string, create a minimal address object
      addressObj = {
        street: address,
        city: 'N/A',
        state: 'N/A',
        zipCode: 'N/A',
        country: 'Bangladesh'
      };
    } else if (typeof address === 'object' && address !== null) {
      // If address is already an object, ensure all required fields exist
      addressObj = {
        street: address.street || address.fullAddress || 'N/A',
        city: address.city || 'N/A',
        state: address.state || 'N/A',
        zipCode: address.zipCode || 'N/A',
        country: address.country || 'Bangladesh',
        coordinates: address.coordinates
      };
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid address format'
      });
      return;
    }

    // Get service details
    const service = await Service.findById(serviceId).populate('vendorId categoryId');
    if (!service) {
      res.status(404).json({
        success: false,
        message: 'Service not found'
      });
      return;
    }

    // Check if service is active and available
    if (!service.isActive || !service.isAvailable) {
      res.status(400).json({
        success: false,
        message: 'Service is not available for booking'
      });
      return;
    }

    // Check if vendor is approved and get vendor user details
    const vendor = await Vendor.findById(service.vendorId).populate('userId', 'firstName lastName email phone');
    if (!vendor || vendor.approvalStatus !== 'approved') {
      res.status(400).json({
        success: false,
        message: 'Vendor is not available'
      });
      return;
    }

    // Check if vendor is active
    if (!vendor.isActive) {
      res.status(400).json({
        success: false,
        message: 'This vendor is currently not accepting bookings'
      });
      return;
    }

    // Get vendor email and phone from populated user
    const vendorUser = vendor.userId as any;
    const vendorEmail = vendorUser?.email;
    const vendorPhone = vendorUser?.phone || 'N/A';

    // Validate scheduled date (must be in future)
    const scheduledDateTime = new Date(scheduledDate);
    if (scheduledDateTime < new Date()) {
      res.status(400).json({
        success: false,
        message: 'Scheduled date must be in the future'
      });
      return;
    }

    // Calculate pricing
    const servicePrice = service.price;
    const discountAmount = (service.discount / 100) * servicePrice;
    const subtotal = servicePrice - discountAmount;
    const tax = subtotal * 0.0; // 0% tax, adjust as needed
    const platformFee = subtotal * 0.05; // 5% platform fee
    const totalAmount = subtotal + tax + platformFee;

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order
    const order = await Order.create({
      orderNumber,
      user: userId,
      vendor: service.vendorId,
      service: serviceId,
      scheduledDate: scheduledDateTime,
      scheduledTime,
      duration: service.duration || 60,
      servicePrice,
      discount: service.discount || 0,
      discountAmount,
      subtotal,
      tax,
      platformFee,
      totalAmount,
      customerName,
      customerPhone,
      customerEmail,
      address: addressObj,
      notes,
      specialRequirements,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING
    });

    // Populate order details
    await order.populate([
      { path: 'user', select: 'firstName lastName email phone' },
      { path: 'vendor', select: 'companyName email phone' },
      { path: 'service', select: 'name description price images' }
    ]);

    // Send email notifications
    try {
      const { emailTemplates } = await import('../utils/emailTemplates');
      const { sendOrderEmail } = await import('../utils/emailService');

      // Email to customer
      const customerEmailContent = emailTemplates.orderConfirmation({
        customerName,
        orderId: order._id.toString(),
        serviceName: (order.service as any).name,
        scheduledDate: new Date(scheduledDate).toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        }),
        scheduledTime,
        servicePrice: service.price,
        discount: service.discount || 0,
        totalAmount: order.totalAmount,
        vendorName: vendor.companyName,
        vendorPhone: vendorPhone,
        address: typeof address === 'string' ? address : address.fullAddress || JSON.stringify(address)
      });
      await sendOrderEmail(customerEmail, customerEmailContent.subject, customerEmailContent.html, customerEmailContent.text);

      // Email to vendor
      const vendorEmailContent = emailTemplates.vendorNewOrder({
        vendorName: vendor.companyName,
        orderId: order._id.toString(),
        serviceName: (order.service as any).name,
        customerName,
        customerPhone,
        scheduledDate: new Date(scheduledDate).toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        }),
        scheduledTime,
        address: typeof address === 'string' ? address : address.fullAddress || JSON.stringify(address)
      });
      
      if (vendorEmail) {
        await sendOrderEmail(vendorEmail, vendorEmailContent.subject, vendorEmailContent.html, vendorEmailContent.text);
      }
    } catch (emailError) {
      console.error('Failed to send order notification emails:', emailError);
      // Don't fail the order if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's orders
 * GET /api/v1/orders/my-orders
 * @access Private (User)
 */
export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build filter
    const filter: any = { user: userId };
    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sort: { [key: string]: 1 | -1 } = { [sortBy as string]: sortOrder === 'desc' ? -1 : 1 };

    // Get orders
    const orders = await Order.find(filter)
      .populate('vendor', 'companyName email phone logo')
      .populate('service', 'name description price images category')
      .populate('service.category', 'name')
      .sort(sort as any)
      .skip(skip)
      .limit(Number(limit));

    // Get total count
    const total = await Order.countDocuments(filter);

    // Prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json({
      success: true,
      data: orders,
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
 * Get order by ID
 * GET /api/v1/orders/:orderId
 * @access Private (User - owns order, Vendor - owns service, Admin)
 */
export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    // Get order
    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email phone')
      .populate('vendor', 'companyName email phone logo coverImage')
      .populate({
        path: 'service',
        select: 'name description price discount images category features',
        populate: { path: 'category', select: 'name' }
      });

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Authorization check
    const isOwner = order.user._id.toString() === userId?.toString();
    const isVendor = order.vendor._id.toString() === userId?.toString();
    const isAdmin = ['admin', 'super_admin'].includes(userRole || '');

    if (!isOwner && !isVendor && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel order
 * PATCH /api/v1/orders/:orderId/cancel
 * @access Private (User - owns order)
 */
export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;
    const { cancellationReason } = req.body;

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check ownership
    if (order.user.toString() !== userId?.toString()) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (!order.canBeCancelled()) {
      res.status(400).json({
        success: false,
        message: `Order cannot be cancelled. Current status: ${order.status}`
      });
    }

    // Update order
    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancelledBy = 'user';
    order.cancellationReason = cancellationReason || 'Cancelled by user';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// ==================== VENDOR ORDER MANAGEMENT ====================

/**
 * Get vendor's orders
 * GET /api/v1/orders/vendor/orders
 * @access Private (Vendor)
 */
export const getVendorOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { status, startDate, endDate, page = 1, limit = '10', sortBy = 'scheduledDate', sortOrder = 'asc' } = req.query;

    // Convert/validate numeric params
    let limitNum = Number(limit);
    const pageNum = Number(page) || 1;
    if (isNaN(limitNum) || limitNum < 0) limitNum = 10;

    // Find vendor profile by userId
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
      res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
      return;
    }

    // Build filter using vendor's _id (not userId)
    const filter: any = { vendor: vendor._id };
    if (status) {
      filter.status = status;
    }
    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate as string);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate as string);
    }

    // Calculate pagination
    const skip = limitNum > 0 ? (pageNum - 1) * limitNum : 0;
    const sort: { [key: string]: 1 | -1 } = { [sortBy as string]: sortOrder === 'desc' ? -1 : 1 };

    // Build order query and conditionally apply limit (limit=0 => no limit)
    let query = Order.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('service', 'name description price images')
      .sort(sort as any)
      .skip(skip);

    if (limitNum > 0) {
      query = query.limit(limitNum);
    }

    const orders = await query;

    // Get total count
    const total = await Order.countDocuments(filter);

    // Get statistics
    const statistics = await Order.getStatistics(vendor._id.toString());

    res.json({
      success: true,
      data: orders,
      statistics,
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
 * Accept order
 * PATCH /api/v1/orders/vendor/:orderId/accept
 * @access Private (Vendor)
 */
export const acceptOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;
    const { vendorNotes } = req.body;

    // Find vendor profile by userId
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
      res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
      return;
    }

    // Check if vendor is active
    if (!vendor.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your vendor account is deactivated. You cannot accept orders.'
      });
      return;
    }

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
      return;
    }

    // Check ownership
    if (order.vendor.toString() !== vendor._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to accept this order'
      });
    }

    // Check if order can be processed
    if (!order.canBeProcessed()) {
      res.status(400).json({
        success: false,
        message: `Order cannot be accepted. Current status: ${order.status}`
      });
    }

    // Update order
    order.status = OrderStatus.ACCEPTED;
    order.acceptedAt = new Date();
    if (vendorNotes) {
      order.vendorNotes = vendorNotes;
    }
    await order.save();

    // Populate order details
    await order.populate([
      { path: 'user', select: 'firstName lastName email phone' },
      { path: 'service', select: 'name description price' },
      { path: 'vendor', select: 'companyName email' }
    ]);

    // Send email notification
    try {
      const { emailTemplates } = await import('../utils/emailTemplates');
      const { sendOrderEmail } = await import('../utils/emailService');

      const user = order.user as any;
      const service = order.service as any;
      const vendor = order.vendor as any;

      const customerEmail = emailTemplates.orderAccepted({
        customerName: user.firstName + ' ' + user.lastName,
        orderId: order._id.toString(),
        serviceName: service.name,
        scheduledDate: order.scheduledDate.toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        }),
        scheduledTime: order.scheduledTime,
        vendorName: vendor.companyName
      });
      await sendOrderEmail(user.email, customerEmail.subject, customerEmail.html, customerEmail.text);
    } catch (emailError) {
      console.error('Failed to send order accepted email:', emailError);
    }

    res.json({
      success: true,
      message: 'Order accepted successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject order
 * PATCH /api/v1/orders/vendor/:orderId/reject
 * @access Private (Vendor)
 */
export const rejectOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;
    const { rejectionReason } = req.body;

    // Find vendor profile by userId
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
      res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
      return;
    }

    // Check if vendor is active
    if (!vendor.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your vendor account is deactivated. You cannot reject orders.'
      });
      return;
    }

    if (!rejectionReason) {
      res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check ownership
    if (order.vendor.toString() !== vendor._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to reject this order'
      });
      return;
    }

    // Check if order can be processed
    if (!order.canBeProcessed()) {
      res.status(400).json({
        success: false,
        message: `Order cannot be rejected. Current status: ${order.status}`
      });
    }

    // Update order
    order.status = OrderStatus.REJECTED;
    order.rejectedAt = new Date();
    order.rejectionReason = rejectionReason;
    await order.save();

    // Populate for email
    await order.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'service', select: 'name' }
    ]);

    // Send email notification
    try {
      const { emailTemplates } = await import('../utils/emailTemplates');
      const { sendOrderEmail } = await import('../utils/emailService');

      const user = order.user as any;
      const service = order.service as any;

      const customerEmail = emailTemplates.orderRejected({
        customerName: user.firstName + ' ' + user.lastName,
        orderId: order._id.toString(),
        serviceName: service.name,
        reason: rejectionReason
      });
      await sendOrderEmail(user.email, customerEmail.subject, customerEmail.html, customerEmail.text);
    } catch (emailError) {
      console.error('Failed to send order rejected email:', emailError);
    }

    res.json({
      success: true,
      message: 'Order rejected successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start order (mark as in progress)
 * PATCH /api/v1/orders/vendor/:orderId/start
 * @access Private (Vendor)
 */
export const startOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;

    // Find vendor profile by userId
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
      res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
      return;
    }

    // Check if vendor is active
    if (!vendor.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your vendor account is deactivated. You cannot start orders.'
      });
      return;
    }

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
      return;
    }

    // Check ownership
    if (order.vendor.toString() !== vendor._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to start this order'
      });
    }

    // Check if order can be started
    if (!order.canBeStarted()) {
      res.status(400).json({
        success: false,
        message: `Order cannot be started. Current status: ${order.status}`
      });
    }

    // Update order
    order.status = OrderStatus.IN_PROGRESS;
    order.startedAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: 'Order started successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete order
 * PATCH /api/v1/orders/vendor/:orderId/complete
 * @access Private (Vendor)
 */
export const completeOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;
    const { vendorNotes } = req.body;

    // Find vendor profile by userId
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
      res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
      return;
    }

    // Check if vendor is active
    if (!vendor.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your vendor account is deactivated. You cannot complete orders.'
      });
      return;
    }

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check ownership
    if (order.vendor.toString() !== vendor._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to complete this order'
      });
      return;
    }

    // Check if order can be completed
    if (!order.canBeCompleted()) {
      res.status(400).json({
        success: false,
        message: `Order cannot be completed. Current status: ${order.status}`
      });
    }

    // Update order
    order.status = OrderStatus.COMPLETED;
    order.completedAt = new Date();
    if (vendorNotes) {
      order.vendorNotes = vendorNotes;
    }
    await order.save();

    // Populate for email
    await order.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'service', select: 'name' }
    ]);

    // Send email notification
    try {
      const { emailTemplates } = await import('../utils/emailTemplates');
      const { sendOrderEmail } = await import('../utils/emailService');

      const user = order.user as any;
      const service = order.service as any;

      const customerEmail = emailTemplates.orderCompleted({
        customerName: user.firstName + ' ' + user.lastName,
        orderId: order._id.toString(),
        serviceName: service.name,
        totalAmount: order.totalAmount
      });
      await sendOrderEmail(user.email, customerEmail.subject, customerEmail.html, customerEmail.text);
    } catch (emailError) {
      console.error('Failed to send order completed email:', emailError);
    }

    res.json({
      success: true,
      message: 'Order completed successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Vendor cancel order
 * PATCH /api/v1/orders/vendor/:orderId/cancel
 * @access Private (Vendor)
 */
export const vendorCancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;
    const { cancellationReason } = req.body;

    if (!cancellationReason) {
      res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
      return;
    }

    // Find vendor profile by userId
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
      res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
      return;
    }

    // Check if vendor is active
    if (!vendor.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your vendor account is deactivated. You cannot cancel orders.'
      });
      return;
    }

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
      return;
    }

    // Check ownership
    if (order.vendor.toString() !== vendor._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
      return;
    }

    // Check if order can be cancelled
    if (!order.canBeCancelled()) {
      res.status(400).json({
        success: false,
        message: `Order cannot be cancelled. Current status: ${order.status}`
      });
    }

    // Update order
    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancelledBy = 'vendor';
    order.cancellationReason = cancellationReason;
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ADMIN OVERSIGHT ====================

/**
 * Get all orders (Admin)
 * GET /api/v1/orders/admin/all
 * @access Private (Admin, Super Admin)
 */
export const adminGetAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      status,
      vendorId,
      userId,
      serviceId,
      startDate,
      endDate,
      paymentStatus,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter: any = {};
    if (status) filter.status = status;
    if (vendorId) filter.vendor = vendorId;
    if (userId) filter.user = userId;
    if (serviceId) filter.service = serviceId;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate as string);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate as string);
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sort: { [key: string]: 1 | -1 } = { [sortBy as string]: sortOrder === 'desc' ? -1 : 1 };

    // Get orders
    const orders = await Order.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('vendor', 'companyName email phone')
      .populate('service', 'name price category')
      .sort(sort as any)
      .skip(skip)
      .limit(Number(limit));

    // Get total count
    const total = await Order.countDocuments(filter);

    // Get overall statistics
    const statistics = await Order.getStatistics();

    res.json({
      success: true,
      data: orders,
      statistics,
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
 * Admin cancel order
 * PATCH /api/v1/orders/admin/:orderId/cancel
 * @access Private (Admin, Super Admin)
 */
export const adminCancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const { cancellationReason } = req.body;

    if (!cancellationReason) {
      res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Admin can cancel orders in any state except already cancelled or completed
    if ([OrderStatus.CANCELLED, OrderStatus.COMPLETED].includes(order.status)) {
      res.status(400).json({
        success: false,
        message: `Order cannot be cancelled. Current status: ${order.status}`
      });
    }

    // Update order
    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancelledBy = 'admin';
    order.cancellationReason = cancellationReason;
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order statistics
 * GET /api/v1/orders/admin/statistics
 * @access Private (Admin, Super Admin)
 */
export const getOrderStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vendorId, userId, startDate, endDate } = req.query;

    // Build match filter
    const match: any = {};
    if (vendorId) match.vendor = new mongoose.Types.ObjectId(vendorId as string);
    if (userId) match.user = new mongoose.Types.ObjectId(userId as string);
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate as string);
      if (endDate) match.createdAt.$lte = new Date(endDate as string);
    }

    // Get statistics by status
    const statusStats = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPlatformFee: { $sum: '$platformFee' }
        }
      }
    ]);

    // Get overall statistics
    const overallStats = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalPlatformFee: { $sum: '$platformFee' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    // Get daily statistics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await Order.aggregate([
      { $match: { ...match, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        statusStatistics: statusStats,
        overallStatistics: overallStats[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          totalPlatformFee: 0,
          averageOrderValue: 0
        },
        dailyStatistics: dailyStats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reschedule order
 * PATCH /api/v1/orders/:orderId/reschedule
 * @access Private (User - owns order, Vendor - owns service)
 */
export const rescheduleOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;
    const { scheduledDate, scheduledTime, reason } = req.body;

    if (!scheduledDate || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'New scheduled date and time are required'
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

    // Authorization check
    const isUser = order.user.toString() === userId?.toString();
    const isVendor = order.vendor.toString() === userId?.toString() && userRole === 'vendor';

    if (!isUser && !isVendor) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reschedule this order'
      });
    }

    // Check if order can be rescheduled
    if (![OrderStatus.PENDING, OrderStatus.ACCEPTED].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be rescheduled. Current status: ${order.status}`
      });
    }

    // Validate new date is in future
    const newDate = new Date(scheduledDate);
    if (newDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'New scheduled date must be in the future'
      });
    }

    // Store old schedule
    order.rescheduledFrom = {
      date: order.scheduledDate,
      time: order.scheduledTime
    };

    // Update schedule
    order.scheduledDate = newDate;
    order.scheduledTime = scheduledTime;
    order.rescheduledAt = new Date();
    order.rescheduledBy = isUser ? 'user' : 'vendor';

    if (reason) {
      order.notes = (order.notes ? order.notes + '\n' : '') + `Rescheduled: ${reason}`;
    }

    await order.save();

    // Populate for email
    await order.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'service', select: 'name' }
    ]);

    // Send email notification
    try {
      const { emailTemplates } = await import('../utils/emailTemplates');
      const { sendOrderEmail } = await import('../utils/emailService');

      const user = order.user as any;
      const service = order.service as any;

      const email = emailTemplates.orderRescheduled({
        customerName: user.firstName + ' ' + user.lastName,
        orderId: order._id.toString(),
        serviceName: service.name,
        oldDate: order.rescheduledFrom.date.toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        }),
        oldTime: order.rescheduledFrom.time,
        newDate: newDate.toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        }),
        newTime: scheduledTime,
        reason
      });
      await sendOrderEmail(user.email, email.subject, email.html, email.text);
    } catch (emailError) {
      console.error('Failed to send order rescheduled email:', emailError);
    }

    res.json({
      success: true,
      message: 'Order rescheduled successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Apply coupon to order
 * PATCH /api/v1/orders/:orderId/apply-coupon
 * @access Private (User - owns order)
 */
export const applyCouponToOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;
    const { couponCode } = req.body;

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }

    // Get order
    const order = await Order.findById(orderId).populate('service');
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

    // Check if order is still pending
    if (order.status !== OrderStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: 'Can only apply coupon to pending orders'
      });
    }

    // Check if coupon already applied
    if (order.couponApplied) {
      return res.status(400).json({
        success: false,
        message: 'A coupon is already applied to this order'
      });
    }

    // Import Coupon model dynamically
    const Coupon = (await import('../models/Coupon')).default;

    // Find and validate coupon
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    if (!coupon.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is not valid or has expired'
      });
    }

    const canUse = await coupon.canBeUsedBy(userId?.toString() || '');
    if (!canUse) {
      return res.status(400).json({
        success: false,
        message: 'You cannot use this coupon'
      });
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(order.subtotal);

    if (discountAmount === 0) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ${coupon.minOrderAmount}`
      });
    }

    // Apply coupon
    order.couponApplied = {
      code: coupon.code,
      couponId: coupon._id,
      discountAmount
    };

    // Recalculate total
    order.totalAmount = order.subtotal + order.tax + order.platformFee - discountAmount;

    await order.save();

    // Increment coupon usage
    coupon.usageCount += 1;
    await coupon.save();

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        order,
        discount: discountAmount,
        newTotal: order.totalAmount
      }
    });
  } catch (error) {
    next(error);
  }
};

