import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order';
import { Transaction } from '../models/Transaction';
import { generateInvoicePDF, generateReceiptPDF, generateInvoiceNumber } from '../utils/invoiceGenerator';
import { sendOrderEmail } from '../utils/emailService';

/**
 * Generate and download invoice for an order
 * GET /api/v1/invoices/order/:orderId
 * @access Private (User/Vendor/Admin)
 */
export const generateOrderInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    // Get order with populated fields
    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email phone')
      .populate('vendor', 'companyName email phone address')
      .populate('service', 'name description price duration');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Authorization check
    const isCustomer = order.user._id.toString() === userId?.toString();
    const isVendor = order.vendor._id.toString() === userId?.toString();
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this invoice'
      });
    }

    // Check if order is paid
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice can only be generated for paid orders'
      });
    }

    // Get transaction details
    const transaction = await Transaction.findOne({ order: orderId, status: 'completed' });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found for this order'
      });
    }

    // Prepare invoice data
    const user = order.user as any;
    const vendor = order.vendor as any;
    const service = order.service as any;

    const invoiceData = {
      invoiceNumber: generateInvoiceNumber(order._id.toString()),
      invoiceDate: new Date(),
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      customer: {
        name: order.customerName || `${user.firstName} ${user.lastName}`,
        email: order.customerEmail || user.email,
        phone: order.customerPhone || user.phone,
        address: typeof order.address === 'string' ? order.address : `${order.address.street}, ${order.address.city}, ${order.address.state} ${order.address.zipCode}, ${order.address.country}`
      },
      vendor: {
        name: vendor.companyName,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address ? `${vendor.address.street}, ${vendor.address.city}, ${vendor.address.state} ${vendor.address.zipCode}, ${vendor.address.country}` : undefined
      },
      service: {
        name: service.name,
        description: service.description,
        price: order.servicePrice,
        duration: service.duration
      },
      scheduledDate: order.scheduledDate,
      scheduledTime: order.scheduledTime,
      discount: order.discount || 0,
      couponDiscount: order.couponApplied?.discountAmount || 0,
      tax: order.tax || 0,
      platformFee: order.platformFee || 0,
      totalAmount: order.totalAmount,
      paymentMethod: transaction.paymentMethod,
      transactionId: transaction.transactionNumber,
      paymentDate: transaction.completedAt || transaction.createdAt,
      platformCommission: transaction.commissionAmount,
      vendorAmount: transaction.vendorAmount,
      serviceStatus: order.status
    };

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoiceData);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Generate and download receipt for an order
 * GET /api/v1/invoices/order/:orderId/receipt
 * @access Private (User/Vendor/Admin)
 */
export const generateOrderReceipt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    // Get order with populated fields
    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email phone')
      .populate('vendor', 'companyName email phone')
      .populate('service', 'name description price duration');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Authorization check
    const isCustomer = order.user._id.toString() === userId?.toString();
    const isVendor = order.vendor._id.toString() === userId?.toString();
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this receipt'
      });
    }

    // Check if order is paid
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Receipt can only be generated for paid orders'
      });
    }

    // Get transaction details
    const transaction = await Transaction.findOne({ order: orderId, status: 'completed' });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found for this order'
      });
    }

    // Prepare receipt data
    const user = order.user as any;
    const vendor = order.vendor as any;
    const service = order.service as any;

    const receiptData = {
      invoiceNumber: generateInvoiceNumber(order._id.toString()),
      invoiceDate: new Date(),
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      customer: {
        name: order.customerName || `${user.firstName} ${user.lastName}`,
        email: order.customerEmail || user.email,
        phone: order.customerPhone || user.phone,
        address: typeof order.address === 'string' ? order.address : `${order.address.street}, ${order.address.city}, ${order.address.state} ${order.address.zipCode}, ${order.address.country}`
      },
      vendor: {
        name: vendor.companyName,
        email: vendor.email,
        phone: vendor.phone
      },
      service: {
        name: service.name,
        description: service.description,
        price: order.servicePrice,
        duration: service.duration
      },
      scheduledDate: order.scheduledDate,
      scheduledTime: order.scheduledTime,
      discount: order.discount || 0,
      couponDiscount: order.couponApplied?.discountAmount || 0,
      tax: order.tax || 0,
      platformFee: order.platformFee || 0,
      totalAmount: order.totalAmount,
      paymentMethod: transaction.paymentMethod,
      transactionId: transaction.transactionNumber,
      paymentDate: transaction.completedAt || transaction.createdAt,
      platformCommission: transaction.commissionAmount,
      vendorAmount: transaction.vendorAmount,
      serviceStatus: order.status
    };

    // Generate PDF
    const pdfBuffer = await generateReceiptPDF(receiptData);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${receiptData.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Send invoice via email
 * POST /api/v1/invoices/order/:orderId/email
 * @access Private (User/Vendor/Admin)
 */
export const emailOrderInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    // Get order with populated fields
    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email phone')
      .populate('vendor', 'companyName email phone')
      .populate('service', 'name description price duration');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Authorization check
    const isCustomer = order.user._id.toString() === userId?.toString();
    const isVendor = order.vendor._id.toString() === userId?.toString();
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to email this invoice'
      });
    }

    // Check if order is paid
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice can only be sent for paid orders'
      });
    }

    // Get transaction details
    const transaction = await Transaction.findOne({ order: orderId, status: 'completed' });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found for this order'
      });
    }

    // Prepare invoice data
    const user = order.user as any;
    const vendor = order.vendor as any;
    const service = order.service as any;

    const invoiceData = {
      invoiceNumber: generateInvoiceNumber(order._id.toString()),
      invoiceDate: new Date(),
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      customer: {
        name: order.customerName || `${user.firstName} ${user.lastName}`,
        email: order.customerEmail || user.email,
        phone: order.customerPhone || user.phone,
        address: typeof order.address === 'string' ? order.address : `${order.address.street}, ${order.address.city}, ${order.address.state} ${order.address.zipCode}, ${order.address.country}`
      },
      vendor: {
        name: vendor.companyName,
        email: vendor.email,
        phone: vendor.phone
      },
      service: {
        name: service.name,
        description: service.description,
        price: order.servicePrice,
        duration: service.duration
      },
      scheduledDate: order.scheduledDate,
      scheduledTime: order.scheduledTime,
      discount: order.discount || 0,
      couponDiscount: order.couponApplied?.discountAmount || 0,
      tax: order.tax || 0,
      platformFee: order.platformFee || 0,
      totalAmount: order.totalAmount,
      paymentMethod: transaction.paymentMethod,
      transactionId: transaction.transactionNumber,
      paymentDate: transaction.completedAt || transaction.createdAt,
      platformCommission: transaction.commissionAmount,
      vendorAmount: transaction.vendorAmount,
      serviceStatus: order.status || 'completed'
    };

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoiceData);

    // Send email with attachment
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `Invoice for Order #${order.orderNumber}`,
      html: `
        <h2>Invoice for Your Order</h2>
        <p>Dear ${user.firstName},</p>
        <p>Thank you for your payment. Please find your invoice attached.</p>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</p>
        <p><strong>Amount Paid:</strong> ৳${order.totalAmount}</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>Practicum Team</p>
      `,
      attachments: [
        {
          filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    res.json({
      success: true,
      message: 'Invoice sent successfully to ' + user.email
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all invoices for user
 * GET /api/v1/invoices/my-invoices
 * @access Private (User)
 */
export const getMyInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Get paid orders
    const orders = await Order.find({
      user: userId,
      paymentStatus: 'paid'
    })
      .populate('service', 'name')
      .populate('vendor', 'companyName')
      .sort({ createdAt: -1 } as any)
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments({
      user: userId,
      paymentStatus: 'paid'
    });

    // Get transaction details for each order
    const invoices = await Promise.all(
      orders.map(async (order) => {
        const transaction = await Transaction.findOne({
          order: order._id,
          status: 'completed'
        });

        return {
          orderId: order._id,
          orderNumber: order.orderNumber,
          invoiceNumber: generateInvoiceNumber(order._id.toString()),
          serviceName: (order.service as any).name,
          vendorName: (order.vendor as any).companyName,
          amount: order.totalAmount,
          date: order.createdAt,
          transactionId: transaction?.transactionNumber
        };
      })
    );

    res.json({
      success: true,
      data: invoices,
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
