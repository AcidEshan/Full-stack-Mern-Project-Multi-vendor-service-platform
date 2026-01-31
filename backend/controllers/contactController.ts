import { Request, Response } from 'express';
import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send contact form message
export const sendContactMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, message } = req.body;

    // Validation
    if (!name || !email || !phone || !message) {
      res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
      return;
    }

    // Bangladeshi phone number validation (11 digits starting with 01)
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      res.status(400).json({
        success: false,
        message: 'Invalid Bangladeshi phone number. Must be 11 digits starting with 01'
      });
      return;
    }

    // Name validation (at least 2 characters, only letters and spaces)
    if (name.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(name)) {
      res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters and contain only letters'
      });
      return;
    }

    // Message validation (at least 10 characters)
    if (message.trim().length < 10) {
      res.status(400).json({
        success: false,
        message: 'Message must be at least 10 characters long'
      });
      return;
    }

    // Send email to admin
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: 'eshanlucifer@gmail.com',
      replyTo: email,
      subject: `Contact Form Submission from ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #1B4B36; color: white; padding: 20px; text-align: center; }
            .content { background-color: white; padding: 30px; margin-top: 20px; border-radius: 8px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #1B4B36; }
            .value { margin-top: 5px; padding: 10px; background-color: #f5f5f5; border-left: 3px solid #1B4B36; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Contact Form Submission</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${name}</div>
              </div>
              
              <div class="field">
                <div class="label">Email:</div>
                <div class="value">${email}</div>
              </div>
              
              <div class="field">
                <div class="label">Phone:</div>
                <div class="value">${phone}</div>
              </div>
              
              <div class="field">
                <div class="label">Message:</div>
                <div class="value">${message.replace(/\n/g, '<br>')}</div>
              </div>
              
              <div class="footer">
                <p>This message was sent via the contact form on ${new Date().toLocaleString()}</p>
                <p>You can reply directly to this email to contact the sender.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);

    // Send confirmation email to user
    const confirmationMailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Thank you for contacting us',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1B4B36; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Contacting Us!</h1>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              <p>We have received your message and will get back to you as soon as possible.</p>
              <p>Here's a copy of what you sent:</p>
              <blockquote style="border-left: 3px solid #1B4B36; padding-left: 15px; color: #666;">
                ${message.replace(/\n/g, '<br>')}
              </blockquote>
              <p>If you have any urgent concerns, please feel free to call us.</p>
              <p>Best regards,<br>The Eshan Service Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Eshan Service. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(confirmationMailOptions);

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!'
    });
  } catch (error) {
    console.error('Error sending contact message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
};
