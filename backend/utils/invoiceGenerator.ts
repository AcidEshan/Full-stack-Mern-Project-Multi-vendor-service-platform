import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  orderId: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  vendor: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  service: {
    name: string;
    description?: string;
    price: number;
    duration?: number;
  };
  scheduledDate: Date;
  scheduledTime: string;
  discount: number;
  couponDiscount?: number;
  tax: number;
  platformFee: number;
  totalAmount: number;
  paymentMethod: string;
  transactionId: string;
  paymentDate: Date;
  platformCommission: number;
  vendorAmount: number;
  serviceStatus: string;
}

/**
 * Generate invoice PDF as a buffer
 */
export const generateInvoicePDF = async (data: InvoiceData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      // Collect PDF data into buffers
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text('Somadhan Ache Service Marketplace', { align: 'center' });
      doc.moveDown(1);

      // Invoice Info Box
      const startY = doc.y;
      doc.fontSize(10).font('Helvetica-Bold').text('Invoice Number:', 50, startY);
      doc.font('Helvetica').text(data.invoiceNumber, 150, startY);

      doc.font('Helvetica-Bold').text('Invoice Date:', 50, startY + 15);
      doc.font('Helvetica').text(formatDate(data.invoiceDate), 150, startY + 15);

      doc.font('Helvetica-Bold').text('Order Number:', 50, startY + 30);
      doc.font('Helvetica').text(data.orderNumber, 150, startY + 30);

      doc.font('Helvetica-Bold').text('Payment Date:', 50, startY + 45);
      doc.font('Helvetica').text(formatDate(data.paymentDate), 150, startY + 45);

      doc.font('Helvetica-Bold').text('Transaction ID:', 50, startY + 60);
      doc.font('Helvetica').text(data.transactionId, 150, startY + 60);

      // Line separator
      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // Bill To and Bill From in two columns
      const columnY = doc.y;

      // Bill To (Customer)
      doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, columnY);
      doc.fontSize(10).font('Helvetica');
      doc.text(data.customer.name, 50, columnY + 20);
      doc.text(data.customer.email, 50, columnY + 35);
      doc.text(data.customer.phone, 50, columnY + 50);
      doc.text(data.customer.address, 50, columnY + 65, { width: 200 });

      // Service Provider (Vendor)
      doc.fontSize(12).font('Helvetica-Bold').text('Service Provider:', 320, columnY);
      doc.fontSize(10).font('Helvetica');
      doc.text(data.vendor.name, 320, columnY + 20);
      doc.text(data.vendor.email, 320, columnY + 35);
      doc.text(data.vendor.phone, 320, columnY + 50);
      if (data.vendor.address) {
        doc.text(data.vendor.address, 320, columnY + 65, { width: 200 });
      }

      doc.y = columnY + 120;
      doc.moveDown(1);

      // Line separator
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // Service Details
      doc.fontSize(12).font('Helvetica-Bold').text('Service Details', 50);
      doc.moveDown(0.5);

      // Table header
      const tableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', 50, tableTop);
      doc.text('Date', 300, tableTop);
      doc.text('Time', 380, tableTop);
      doc.text('Amount', 470, tableTop, { width: 75, align: 'right' });

      // Line under header
      doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

      // Service row
      doc.font('Helvetica');
      const serviceY = tableTop + 25;
      doc.text(data.service.name, 50, serviceY, { width: 240 });
      if (data.service.description) {
        doc.fontSize(8).fillColor('#666').text(data.service.description, 50, serviceY + 12, { width: 240 });
        doc.fillColor('#000').fontSize(10);
      }
      doc.text(formatDate(data.scheduledDate), 300, serviceY);
      doc.text(data.scheduledTime, 380, serviceY);
      doc.text(formatCurrency(data.service.price), 470, serviceY, { width: 75, align: 'right' });

      if (data.service.duration) {
        doc.fontSize(8).fillColor('#666').text(`Duration: ${data.service.duration} mins`, 380, serviceY + 12);
        doc.fillColor('#000').fontSize(10);
      }

      // Move to totals section
      doc.y = serviceY + 40;
      doc.moveDown(1);

      // Totals section (right aligned)
      const totalsX = 370;
      let totalsY = doc.y;

      doc.font('Helvetica').text('Subtotal:', totalsX, totalsY);
      doc.text(formatCurrency(data.service.price), 470, totalsY, { width: 75, align: 'right' });

      if (data.discount > 0) {
        totalsY += 20;
        doc.text('Service Discount:', totalsX, totalsY);
        doc.fillColor('#28a745').text(`- %${data.discount.toFixed(2)}`, 470, totalsY, { width: 75, align: 'right' });
        doc.fillColor('#000');
      }

      if (data.couponDiscount && data.couponDiscount > 0) {
        totalsY += 20;
        doc.text('Coupon Discount:', totalsX, totalsY);
        doc.fillColor('#28a745').text(`-${formatCurrency(data.couponDiscount)}`, 470, totalsY, { width: 75, align: 'right' });
        doc.fillColor('#000');
      }

      if (data.tax > 0) {
        totalsY += 20;
        doc.text('Tax:', totalsX, totalsY);
        doc.text(formatCurrency(data.tax), 470, totalsY, { width: 75, align: 'right' });
      }

      if (data.platformFee > 0) {
        totalsY += 20;
        doc.text('Platform Fee:', totalsX, totalsY);
        doc.text(formatCurrency(data.platformFee), 470, totalsY, { width: 75, align: 'right' });
      }

      totalsY += 20;
      doc.moveTo(370, totalsY - 5).lineTo(545, totalsY - 5).stroke();

      totalsY += 5;
      doc.fontSize(12).font('Helvetica-Bold').text('Total Amount:', totalsX, totalsY);
      doc.text(formatCurrency(data.totalAmount), 470, totalsY, { width: 75, align: 'right' });

      doc.font('Helvetica').fontSize(10);
      totalsY += 25;
      doc.text('Payment Method:', totalsX, totalsY);
      doc.text(data.paymentMethod.toUpperCase(), 470, totalsY, { width: 75, align: 'right' });

      totalsY += 20;
      doc.fillColor('#28a745').font('Helvetica-Bold').text('Payment Status:', totalsX, totalsY);
      doc.text('PAID', 470, totalsY, { width: 75, align: 'right' });
      doc.fillColor('#000').font('Helvetica');

      totalsY += 20;
      doc.font('Helvetica-Bold').text('Service Status:', totalsX, totalsY);
      doc.font('Helvetica').text(data.serviceStatus.toUpperCase(), 470, totalsY, { width: 75, align: 'right' });

      // Footer
      doc.fontSize(8).fillColor('#666');
      const footerY = 750;
      doc.text('Thank you for your business!', 50, footerY, { align: 'center', width: 495 });
      doc.text('This is a computer generated invoice and does not require a signature.', 50, footerY + 12, { align: 'center', width: 495 });
      doc.text('For support, contact: support@somadhanache.com', 50, footerY + 24, { align: 'center', width: 495 });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate receipt PDF (simpler version)
 */
export const generateReceiptPDF = async (data: InvoiceData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(28).font('Helvetica-Bold').text('RECEIPT', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(12).font('Helvetica').text('Somadhan Ache Service Marketplace', { align: 'center' });
      doc.moveDown(2);

      // Receipt box with border
      const boxTop = doc.y;
      const boxHeight = 350;
      doc.rect(75, boxTop, 445, boxHeight).stroke();

      // Content inside box
      let contentY = boxTop + 20;
      const leftMargin = 95;

      doc.fontSize(11).font('Helvetica-Bold').text('Transaction Details', leftMargin, contentY);
      contentY += 25;

      doc.fontSize(10).font('Helvetica');
      
      // Two column layout for receipt details
      const labelX = leftMargin;
      const valueX = leftMargin + 150;

      const addRow = (label: string, value: string) => {
        doc.font('Helvetica-Bold').text(label, labelX, contentY);
        doc.font('Helvetica').text(value, valueX, contentY);
        contentY += 18;
      };

      addRow('Transaction ID:', data.transactionId);
      addRow('Receipt Number:', data.invoiceNumber);
      addRow('Date & Time:', formatDateTime(data.paymentDate));
      addRow('Order Number:', data.orderNumber);

      contentY += 10;
      doc.moveTo(labelX, contentY).lineTo(500, contentY).stroke();
      contentY += 15;

      addRow('Customer:', data.customer.name);
      addRow('Service:', data.service.name);
      addRow('Scheduled Date:', formatDate(data.scheduledDate));
      addRow('Scheduled Time:', data.scheduledTime);

      contentY += 10;
      doc.moveTo(labelX, contentY).lineTo(500, contentY).stroke();
      contentY += 15;

      addRow('Service Price:', formatCurrency(data.service.price));
      
      if (data.discount > 0 || data.couponDiscount) {
        const totalDiscount = (data.discount || 0) + (data.couponDiscount || 0);
        doc.font('Helvetica-Bold').text('Discount:', labelX, contentY);
        doc.font('Helvetica').fillColor('#28a745').text(`- %${totalDiscount.toFixed(2)}`, valueX, contentY);
        doc.fillColor('#000');
        contentY += 18;
      }

      if (data.tax > 0) {
        addRow('Tax:', formatCurrency(data.tax));
      }

      if (data.platformFee > 0) {
        addRow('Platform Fee:', formatCurrency(data.platformFee));
      }

      contentY += 5;
      doc.font('Helvetica-Bold').fontSize(12).text('Total Paid:', labelX, contentY);
      doc.fontSize(14).fillColor('#28a745').text(formatCurrency(data.totalAmount), valueX, contentY);
      doc.fillColor('#000').fontSize(10);
      contentY += 22;

      doc.font('Helvetica').text('Payment Method:', labelX, contentY);
      doc.text(data.paymentMethod.toUpperCase(), valueX, contentY);
      contentY += 18;

      doc.font('Helvetica-Bold').fillColor('#28a745').text('Payment Status:', labelX, contentY);
      doc.text('PAID ✓', valueX, contentY);
      doc.fillColor('#000').font('Helvetica');
      contentY += 18;

      doc.font('Helvetica-Bold').text('Service Status:', labelX, contentY);
      doc.font('Helvetica').text(data.serviceStatus.toUpperCase(), valueX, contentY);

      // Footer message
      doc.fontSize(9).fillColor('#666');
      doc.text('Thank you for choosing Somadhan Ache!', 50, boxTop + boxHeight + 30, { align: 'center', width: 495 });
      doc.text('Keep this receipt for your records.', 50, boxTop + boxHeight + 42, { align: 'center', width: 495 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Helper function to format currency
 */
const formatCurrency = (amount: number): string => {
  return `BDT ${amount.toFixed(2)}`;
};

/**
 * Helper function to format date
 */
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Helper function to format date and time
 */
const formatDateTime = (date: Date): string => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Generate invoice number
 */
export const generateInvoiceNumber = (orderId: string): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const orderShort = orderId.slice(-6).toUpperCase();
  return `INV-${year}${month}-${orderShort}`;
};
