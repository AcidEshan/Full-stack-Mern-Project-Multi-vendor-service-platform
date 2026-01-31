export const emailTemplates = {
  // Order Confirmation Email
  orderConfirmation: (data: {
    customerName: string;
    orderId: string;
    serviceName: string;
    scheduledDate: string;
    scheduledTime: string;
    servicePrice: number;
    discount: number;
    totalAmount: number;
    vendorName: string;
    vendorPhone: string;
    address: string;
  }) => ({
    subject: `Order Confirmation - #${data.orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; }
          .order-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; color: #4CAF50; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Order Confirmed!</h1>
          </div>
          <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>Your order has been successfully placed and is awaiting vendor confirmation.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <div class="detail-row">
                <span>Order ID:</span>
                <strong>#${data.orderId}</strong>
              </div>
              <div class="detail-row">
                <span>Service:</span>
                <strong>${data.serviceName}</strong>
              </div>
              <div class="detail-row">
                <span>Scheduled Date:</span>
                <strong>${data.scheduledDate}</strong>
              </div>
              <div class="detail-row">
                <span>Scheduled Time:</span>
                <strong>${data.scheduledTime}</strong>
              </div>
              <div class="detail-row">
                <span>Location:</span>
                <strong>${data.address}</strong>
              </div>
            </div>

            <div class="order-details">
              <h3>Payment Summary</h3>
              <div class="detail-row">
                <span>Service Price:</span>
                <span>৳${data.servicePrice}</span>
              </div>
              ${data.discount > 0 ? `
              <div class="detail-row">
                <span>Discount:</span>
                <span style="color: #4CAF50;">-৳${data.discount}</span>
              </div>
              ` : ''}
              <div class="detail-row total">
                <span>Total Amount:</span>
                <span>৳${data.totalAmount}</span>
              </div>
            </div>

            <div class="order-details">
              <h3>Vendor Information</h3>
              <p><strong>${data.vendorName}</strong></p>
              <p>Phone: ${data.vendorPhone}</p>
            </div>

            <p>You will receive a notification once the vendor accepts your booking.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/orders/${data.orderId}" class="button">View Order Details</a>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Practicum. All rights reserved.</p>
            <p>If you have any questions, contact us at support@practicum.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Order Confirmation - #${data.orderId}

Dear ${data.customerName},

Your order has been successfully placed!

Order Details:
- Order ID: #${data.orderId}
- Service: ${data.serviceName}
- Scheduled Date: ${data.scheduledDate}
- Scheduled Time: ${data.scheduledTime}
- Location: ${data.address}

Payment Summary:
- Service Price: ৳${data.servicePrice}
${data.discount > 0 ? `- Discount: -৳${data.discount}` : ''}
- Total Amount: ৳${data.totalAmount}

Vendor: ${data.vendorName}
Phone: ${data.vendorPhone}

You will receive a notification once the vendor accepts your booking.

View order: ${process.env.FRONTEND_URL}/orders/${data.orderId}
    `
  }),

  // Order Accepted Email
  orderAccepted: (data: {
    customerName: string;
    orderId: string;
    serviceName: string;
    scheduledDate: string;
    scheduledTime: string;
    vendorName: string;
  }) => ({
    subject: `Order Accepted - #${data.orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; }
          .button { background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Your Order Has Been Accepted!</h1>
          </div>
          <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>Great news! <strong>${data.vendorName}</strong> has accepted your booking.</p>
            
            <div style="background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px;">
              <p><strong>Service:</strong> ${data.serviceName}</p>
              <p><strong>Date:</strong> ${data.scheduledDate}</p>
              <p><strong>Time:</strong> ${data.scheduledTime}</p>
            </div>

            <p>The vendor will arrive at your location on the scheduled date and time.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/orders/${data.orderId}" class="button">View Order</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Order Accepted - #${data.orderId}\n\nDear ${data.customerName},\n\n${data.vendorName} has accepted your booking for ${data.serviceName} on ${data.scheduledDate} at ${data.scheduledTime}.`
  }),

  // Order Rejected Email
  orderRejected: (data: {
    customerName: string;
    orderId: string;
    serviceName: string;
    reason?: string;
  }) => ({
    subject: `Order Rejected - #${data.orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Rejected</h1>
          </div>
          <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>Unfortunately, your order #${data.orderId} for ${data.serviceName} has been rejected by the vendor.</p>
            ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
            <p>You can browse other services and place a new order.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Order Rejected - #${data.orderId}\n\nDear ${data.customerName},\n\nYour order for ${data.serviceName} has been rejected.${data.reason ? `\nReason: ${data.reason}` : ''}`
  }),

  // Order Completed Email
  orderCompleted: (data: {
    customerName: string;
    orderId: string;
    serviceName: string;
    totalAmount: number;
  }) => ({
    subject: `Service Completed - #${data.orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; }
          .button { background-color: #FF9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ Service Completed!</h1>
          </div>
          <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>Your service <strong>${data.serviceName}</strong> has been successfully completed!</p>
            <p><strong>Total Amount Paid:</strong> ৳${data.totalAmount}</p>
            
            <p>We hope you enjoyed the service. Please take a moment to rate and review your experience.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/orders/${data.orderId}/review" class="button">Leave a Review</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Service Completed - #${data.orderId}\n\nDear ${data.customerName},\n\nYour service ${data.serviceName} has been completed. Please leave a review!`
  }),

  // Payment Confirmation Email
  paymentConfirmation: (data: {
    customerName: string;
    orderId: string;
    transactionId: string;
    amount: number;
    paymentMethod: string;
  }) => ({
    subject: `Payment Confirmation - #${data.orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Payment Received</h1>
          </div>
          <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>We have received your payment for order #${data.orderId}.</p>
            
            <div style="background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px;">
              <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
              <p><strong>Amount:</strong> ৳${data.amount}</p>
              <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
            </div>

            <p>Your receipt has been generated and is available in your order details.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Payment Confirmation\n\nDear ${data.customerName},\n\nPayment received for order #${data.orderId}.\nTransaction ID: ${data.transactionId}\nAmount: ৳${data.amount}`
  }),

  // Order Rescheduled Email
  orderRescheduled: (data: {
    customerName: string;
    orderId: string;
    serviceName: string;
    oldDate: string;
    oldTime: string;
    newDate: string;
    newTime: string;
    reason?: string;
  }) => ({
    subject: `Order Rescheduled - #${data.orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Order Rescheduled</h1>
          </div>
          <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>Your order #${data.orderId} for ${data.serviceName} has been rescheduled.</p>
            
            <div style="background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px;">
              <p><strong>Previous Schedule:</strong></p>
              <p>${data.oldDate} at ${data.oldTime}</p>
              
              <p style="margin-top: 15px;"><strong>New Schedule:</strong></p>
              <p style="color: #4CAF50; font-weight: bold;">${data.newDate} at ${data.newTime}</p>
              
              ${data.reason ? `<p style="margin-top: 15px;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Order Rescheduled - #${data.orderId}\n\nYour order has been rescheduled.\nOld: ${data.oldDate} at ${data.oldTime}\nNew: ${data.newDate} at ${data.newTime}`
  }),

  // Vendor New Order Alert
  vendorNewOrder: (data: {
    vendorName: string;
    orderId: string;
    serviceName: string;
    customerName: string;
    customerPhone: string;
    scheduledDate: string;
    scheduledTime: string;
    address: string;
  }) => ({
    subject: `New Order Received - #${data.orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; }
          .button { background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 5px; }
          .reject { background-color: #f44336; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New Booking Request!</h1>
          </div>
          <div class="content">
            <p>Dear ${data.vendorName},</p>
            <p>You have received a new booking request.</p>
            
            <div style="background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px;">
              <p><strong>Order ID:</strong> #${data.orderId}</p>
              <p><strong>Service:</strong> ${data.serviceName}</p>
              <p><strong>Customer:</strong> ${data.customerName}</p>
              <p><strong>Phone:</strong> ${data.customerPhone}</p>
              <p><strong>Date:</strong> ${data.scheduledDate}</p>
              <p><strong>Time:</strong> ${data.scheduledTime}</p>
              <p><strong>Location:</strong> ${data.address}</p>
            </div>

            <p>Please review and respond to this booking request.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/vendor/orders/${data.orderId}/accept" class="button">Accept</a>
              <a href="${process.env.FRONTEND_URL}/vendor/orders/${data.orderId}/reject" class="button reject">Reject</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `New Order - #${data.orderId}\n\nCustomer: ${data.customerName}\nService: ${data.serviceName}\nDate: ${data.scheduledDate} at ${data.scheduledTime}`
  }),
};
