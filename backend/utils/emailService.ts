import nodemailer, { Transporter } from 'nodemailer';

// Create transporter
const createTransporter = (): Transporter => {
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

// Send Email Verification
export const sendVerificationEmail = async (email: string, firstName: string, token: string): Promise<void> => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify Your Email - Practicum',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            background-color: #007bff; 
            color: white !important; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to Practicum, ${firstName}!</h1>
          <p>Thank you for registering with Practicum. Please verify your email address to get started.</p>
          
          <!-- Button using table for better email client support -->
          <table width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
            <tr>
              <td align="center">
                <table cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="background-color: #007bff; border-radius: 5px;">
                      <a href="${verificationLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 30px; font-family: Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 5px;">Verify Email</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${verificationLink}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't create this account, please ignore this email.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Practicum. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✓ Verification email sent to ${email}`);
  } catch (error) {
    console.error('✗ Error sending verification email:', (error as Error).message);
    throw new Error('Failed to send verification email');
  }
};

// Send Vendor Registration Email
export const sendVendorRegistrationEmail = async (
  email: string, 
  companyName: string, 
  firstName: string, 
  token: string
): Promise<void> => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Vendor Registration - Pending Approval',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            background-color: #28a745; 
            color: white !important; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .info-box { 
            background-color: #f8f9fa; 
            border-left: 4px solid #ffc107; 
            padding: 15px; 
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Thank you for registering, ${companyName}!</h1>
          <p>Hello ${firstName},</p>
          <p>Your vendor account has been created and is pending admin approval.</p>
          <p>First, please verify your email address:</p>
          
          <!-- Button using table for better email client support -->
          <table width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
            <tr>
              <td align="center">
                <table cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="background-color: #28a745; border-radius: 5px;">
                      <a href="${verificationLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 30px; font-family: Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 5px;">Verify Email</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          <div class="info-box">
            <strong>What's Next?</strong>
            <p>Once your account is approved by our admin team (typically 24-48 hours), you'll receive another email and can start adding your services to the platform.</p>
          </div>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>© ${new Date().getFullYear()} Practicum. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✓ Vendor registration email sent to ${email}`);
  } catch (error) {
    console.error('✗ Error sending vendor registration email:', (error as Error).message);
  }
};

// Send Password Reset Email
export const sendPasswordResetEmail = async (email: string, firstName: string, token: string): Promise<void> => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Reset Your Password - Practicum',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            background-color: #dc3545; 
            color: white !important; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .warning { 
            background-color: #fff3cd; 
            border: 1px solid #ffc107; 
            padding: 15px; 
            margin: 20px 0;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Password Reset Request</h1>
          <p>Hello ${firstName},</p>
          <p>We received a request to reset your password for your Practicum account.</p>
          
          <!-- Button using table for better email client support -->
          <table width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
            <tr>
              <td align="center">
                <table cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="background-color: #dc3545; border-radius: 5px;">
                      <a href="${resetLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 30px; font-family: Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #dc3545;">${resetLink}</p>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <p>This link will expire in 1 hour for security reasons.</p>
          </div>
          <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
          <p>© ${new Date().getFullYear()} Practicum. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✓ Password reset email sent to ${email}`);
  } catch (error) {
    console.error('✗ Error sending password reset email:', (error as Error).message);
    throw new Error('Failed to send password reset email');
  }
};

// Send Admin Creation Email
export const sendAdminCreationEmail = async (
  email: string, 
  firstName: string, 
  temporaryPassword: string
): Promise<void> => {
  const loginLink = `${process.env.FRONTEND_URL}/login`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Admin Account Created - Practicum',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .credentials { 
            background-color: #f8f9fa; 
            padding: 20px; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .button { 
            display: inline-block; 
            background-color: #007bff; 
            color: white !important; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .warning { color: #dc3545; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to Practicum Admin Team!</h1>
          <p>Hello ${firstName},</p>
          <p>An admin account has been created for you by the Super Administrator.</p>
          <div class="credentials">
            <h3>Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
          </div>
          
          <!-- Button using table for better email client support -->
          <table width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
            <tr>
              <td align="center">
                <table cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="background-color: #007bff; border-radius: 5px;">
                      <a href="${loginLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 30px; font-family: Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 5px;">Login to Admin Dashboard</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          <p class="warning">⚠️ IMPORTANT: You will be required to change your password on first login.</p>
          <p>Keep your credentials secure and do not share them with anyone.</p>
          <p>© ${new Date().getFullYear()} Practicum. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✓ Admin creation email sent to ${email}`);
  } catch (error) {
    console.error('✗ Error sending admin creation email:', (error as Error).message);
  }
};

// Send Email Verification Code (6-digit)
export const sendVerificationCode = async (email: string, code: string): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Email Verification Code - Practicum',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .code-box { 
            background-color: #f8f9fa; 
            border: 2px dashed #007bff;
            padding: 20px; 
            text-align: center;
            border-radius: 8px; 
            margin: 30px 0;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            color: #007bff;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          }
          .warning { 
            background-color: #fff3cd; 
            border-left: 4px solid #ffc107;
            padding: 15px; 
            margin: 20px 0;
            border-radius: 5px;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Email Verification Code</h1>
          <p>Thank you for registering with Practicum as a vendor.</p>
          <p>Please use the following verification code to complete your registration:</p>
          
          <div class="code-box">
            <p style="margin: 0; font-size: 14px; color: #666;">Your Verification Code</p>
            <p class="code">${code}</p>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <p style="margin: 5px 0 0 0;">This code will expire in 60 seconds. If expired, please request a new code.</p>
          </div>
          
          <p>If you didn't request this code, please ignore this email.</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Practicum. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✓ Verification code sent to ${email}`);
  } catch (error) {
    console.error('✗ Error sending verification code:', (error as Error).message);
    throw new Error('Failed to send verification code');
  }
};

// Send Order Email (Generic function for all order emails)
export const sendOrderEmail = async (
  email: string,
  subject: string,
  html: string,
  text: string
): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    html,
    text
  };

  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✓ Order email sent to ${email}: ${subject}`);
  } catch (error) {
    console.error('✗ Error sending order email:', (error as Error).message);
    // Don't throw - email failure shouldn't stop order processing
  }
};
