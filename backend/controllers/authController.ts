import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Vendor from '../models/Vendor';
import { 
  validateRegistration, 
  validateEmail, 
  validatePassword,
  RegistrationData 
} from '../utils/validators';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  generateVerificationToken,
  generatePasswordResetToken
} from '../utils/tokenUtils';
import {
  sendVerificationEmail,
  sendVendorRegistrationEmail,
  sendPasswordResetEmail,
  sendAdminCreationEmail,
  sendVerificationCode
} from '../utils/emailService';

// @desc    Register new user or vendor
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone, role, companyName, companyDescription } = req.body;
    
    // Validate input
    const validation = validateRegistration(req.body as RegistrationData);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validation.errors
        }
      });
      return;
    }
    
    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    
    // If user exists and is fully registered (has real data, not temp)
    if (user && user.firstName !== 'temp' && user.isEmailVerified) {
      res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'Email already exists'
        }
      });
      return;
    }
    
    // Check if phone already exists with another email
    const phoneExists = await User.findOne({ 
      phone, 
      email: { $ne: email.toLowerCase() } 
    });
    
    if (phoneExists) {
      res.status(409).json({
        success: false,
        error: {
          code: 'PHONE_EXISTS',
          message: 'Phone number already exists'
        }
      });
      return;
    }
    
    // If user exists (from OTP verification) and email is verified, update the user
    if (user && user.isEmailVerified) {
      // Update the existing verified user with full registration data
      user.password = password;
      user.firstName = firstName.trim();
      user.lastName = lastName.trim();
      user.phone = phone;
      user.role = role || 'user';
      user.isActive = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      user.emailVerificationCode = undefined;
      user.emailVerificationCodeExpires = undefined;
      
      await user.save();
    } else {
      // Create new user or update temp user
      if (user) {
        // Update temp user
        user.password = password;
        user.firstName = firstName.trim();
        user.lastName = lastName.trim();
        user.phone = phone;
        user.role = role || 'user';
        user.isActive = true;
        user.emailVerificationToken = generateVerificationToken();
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();
      } else {
        // Create brand new user
        user = new User({
          email: email.toLowerCase(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone,
          role: role || 'user'
        });
        
        // Generate email verification token
        user.emailVerificationToken = generateVerificationToken();
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        await user.save();
      }
    }
    
    // If vendor, create vendor profile
    if (role === 'vendor') {
      const vendor = new Vendor({
        userId: user._id,
        companyName: companyName.trim(),
        description: companyDescription || '',
        approvalStatus: 'pending'
      });
      
      await vendor.save();
      
      // Send vendor registration email only if not yet verified
      if (!user.isEmailVerified && user.emailVerificationToken) {
        try {
          await sendVendorRegistrationEmail(user.email, companyName, user.firstName, user.emailVerificationToken);
        } catch (error) {
          console.error('Error sending vendor registration email:', error);
        }
      }
    } else {
      // Send regular verification email only if not yet verified
      if (!user.isEmailVerified && user.emailVerificationToken) {
        try {
          await sendVerificationEmail(user.email, user.firstName, user.emailVerificationToken);
        } catch (error) {
          console.error('Error sending verification email:', error);
        }
      }
    }
    
    res.status(201).json({
      success: true,
      message: `Registration successful. ${role === 'vendor' ? 'Your account is pending approval.' : ''} ${!user.isEmailVerified ? 'Please check your email to verify your account.' : ''}`,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          ...(role === 'vendor' && { isApproved: user.isApproved })
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      });
      return;
    }
    
    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshTokens');
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
      return;
    }
    
    // Check if account is locked
    if (user.isLocked()) {
      const remainingTime = Math.ceil((user.lockUntil!.getTime() - Date.now()) / 1000 / 60);
      res.status(429).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `Account locked due to multiple failed login attempts. Try again in ${remainingTime} minutes.`
        }
      });
      return;
    }
    
    // Check if account is blocked
    if (user.isBlocked) {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_BLOCKED',
          message: 'Your account has been blocked. Please contact support.'
        }
      });
      return;
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.incLoginAttempts();
      
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
      return;
    }
    
    // Check vendor approval
    if (user.role === 'vendor' && !user.isApproved) {
      res.status(403).json({
        success: false,
        error: {
          code: 'VENDOR_NOT_APPROVED',
          message: 'Your vendor account is pending admin approval'
        }
      });
      return;
    }
    
    // Check if vendor is deactivated
    if (user.role === 'vendor') {
      const Vendor = (await import('../models/Vendor')).default;
      const vendor = await Vendor.findOne({ userId: user._id });
      if (vendor && !vendor.isActive) {
        res.status(403).json({
          success: false,
          error: {
            code: 'VENDOR_DEACTIVATED',
            message: 'Your vendor account has been deactivated. Please contact support.'
          }
        });
        return;
      }
    }
    
    // Reset failed login attempts
    await user.resetLoginAttempts();
    
    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.email, user.role);
    const refreshToken = generateRefreshToken(user._id.toString());
    
    // Save refresh token
    const deviceInfo = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || (req.connection && (req.connection as any).remoteAddress);
    await user.addRefreshToken(refreshToken, deviceInfo, ipAddress);
    
    // Update last login
    user.lastLogin = new Date();
    user.lastLoginIP = ipAddress;
    await user.save();
    
    // Remove sensitive fields from response
    const userResponse = user.toJSON();
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: userResponse
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required'
        }
      });
      return;
    }
    
    // Find user and remove refresh token
    const user = await User.findById(req.user!._id);
    await user!.removeRefreshToken(refreshToken);
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout from all devices
// @route   POST /api/v1/auth/logout-all
// @access  Private
export const logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id);
    await user!.removeAllRefreshTokens();
    
    res.status(200).json({
      success: true,
      message: 'Logged out from all devices'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required'
        }
      });
      return;
    }
    
    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      });
      return;
    }
    
    // Find user and check if token exists
    const user = await User.findById(decoded.sub).select('+refreshTokens');
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }
    
    // Check if token exists in user's refresh tokens
    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
    
    if (!tokenExists) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token not found'
        }
      });
      return;
    }
    
    // Check if user is blocked
    if (user.isBlocked) {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_BLOCKED',
          message: 'Your account has been blocked'
        }
      });
      return;
    }
    
    // Generate new access token
    const newAccessToken = generateAccessToken(user._id.toString(), user.email, user.role);
    
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   POST /api/v1/auth/verify-email
// @access  Public
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Verification token is required'
        }
      });
      return;
    }
    
    // Find user with this token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token'
        }
      });
      return;
    }
    
    // Update user
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/v1/auth/resend-verification
// @access  Public
export const resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required'
        }
      });
      return;
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't reveal if user exists
      res.status(200).json({
        success: true,
        message: 'If the email exists, a verification link has been sent'
      });
      return;
    }
    
    if (user.isEmailVerified) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'Email is already verified'
        }
      });
      return;
    }
    
    // Generate new verification token
    user.emailVerificationToken = generateVerificationToken();
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();
    
    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.firstName, user.emailVerificationToken);
    } catch (error) {
      console.error('Error sending verification email:', error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Verification email sent'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request password reset
// @route   POST /api/v1/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required'
        }
      });
      return;
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return success (security best practice)
    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
      return;
    }
    
    // Generate reset token
    user.passwordResetToken = generatePasswordResetToken();
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();
    
    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.firstName, user.passwordResetToken);
    } catch (error) {
      console.error('Error sending password reset email:', error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password with token
// @route   POST /api/v1/auth/reset-password
// @access  Public
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    
    if (!token || !newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required'
        }
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Passwords do not match'
        }
      });
      return;
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      res.status(422).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password does not meet requirements',
          details: passwordValidation.errors
        }
      });
      return;
    }
    
    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+password');
    
    if (!user) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token'
        }
      });
      return;
    }
    
    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Logout from all devices
    user.refreshTokens = [];
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password (authenticated user)
// @route   POST /api/v1/auth/change-password
// @access  Private
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required'
        }
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'New passwords do not match'
        }
      });
      return;
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      res.status(422).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password does not meet requirements',
          details: passwordValidation.errors
        }
      });
      return;
    }
    
    // Get user with password
    const user = await User.findById(req.user!._id).select('+password');
    
    // Verify current password
    const isCurrentPasswordValid = await user!.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Current password is incorrect'
        }
      });
      return;
    }
    
    // Update password
    user!.password = newPassword;
    
    // Logout from all other devices
    user!.refreshTokens = [];
    
    await user!.save();
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id);
    
    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Admin (Super Admin Only)
// @route   POST /api/v1/auth/create-admin
// @access  Private (Super Admin)
export const createAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    // Validate input
    if (!email || !password || !firstName || !lastName || !phone) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required (email, password, firstName, lastName, phone)'
        }
      });
      return;
    }
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: emailValidation.message
        }
      });
      return;
    }
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      res.status(422).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password does not meet requirements',
          details: passwordValidation.errors
        }
      });
      return;
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }]
    });
    
    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Phone number';
      res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: `${field} already exists`
        }
      });
      return;
    }
    
    // Create admin user
    const admin = new User({
      email: email.toLowerCase(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone,
      role: 'admin',
      isEmailVerified: true, // Admins are auto-verified
      isApproved: true
    });
    
    await admin.save();
    
    // Send admin creation email (optional)
    try {
      await sendAdminCreationEmail(admin.email, admin.firstName, password);
    } catch (error) {
      console.error('Error sending admin creation email:', error);
    }
    
    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        admin: {
          id: admin._id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          phone: admin.phone
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send email verification code (6-digit)
// @route   POST /api/v1/auth/send-verification-code
// @access  Public
export const sendEmailVerificationCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !validateEmail(email)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid email is required'
        }
      });
      return;
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser.isEmailVerified) {
      res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email is already registered'
        }
      });
      return;
    }

    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // If user exists but not verified, update the code
    // Otherwise, create a temporary user record
    if (existingUser) {
      existingUser.emailVerificationCode = verificationCode;
      existingUser.emailVerificationCodeExpires = new Date(Date.now() + 60 * 1000);
      await existingUser.save();
    } else {
      // Create temporary user record for code storage
      const tempUser = new User({
        email: email.toLowerCase(),
        emailVerificationCode: verificationCode,
        emailVerificationCodeExpires: new Date(Date.now() + 60 * 1000),
        password: 'temporary_password_will_be_set_later',
        firstName: 'temp',
        lastName: 'temp',
        phone: '0000000000',
        role: 'vendor',
        isActive: false,
        isEmailVerified: false
      });
      await tempUser.save();
    }
    
    // Send verification code via email
    await sendVerificationCode(email, verificationCode);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email. Valid for 60 seconds.',
      data: {
        email: email.toLowerCase(),
        expiresIn: 60 // seconds
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email code
// @route   POST /api/v1/auth/verify-email-code
// @access  Public
export const verifyEmailCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, code } = req.body;

    // Validate input
    if (!email || !code) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and verification code are required'
        }
      });
      return;
    }

    // Find user with verification code
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      emailVerificationCode: code
    });

    if (!user) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Invalid verification code'
        }
      });
      return;
    }

    // Check if code has expired
    if (!user.emailVerificationCodeExpires || user.emailVerificationCodeExpires < new Date()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CODE_EXPIRED',
          message: 'Verification code has expired. Please request a new one.'
        }
      });
      return;
    }

    // Code is valid - mark email as verified and clear the code
    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationCodeExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        email: user.email,
        isEmailVerified: true
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend email verification code
// @route   POST /api/v1/auth/resend-verification-code
// @access  Public
export const resendEmailVerificationCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !validateEmail(email)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid email is required'
        }
      });
      return;
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Email not found'
        }
      });
      return;
    }

    // Check if already verified
    if (user.isEmailVerified) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'Email is already verified'
        }
      });
      return;
    }

    // Generate new 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update user with new code
    user.emailVerificationCode = verificationCode;
    user.emailVerificationCodeExpires = new Date(Date.now() + 60 * 1000); // 60 seconds
    await user.save();

    // Send verification code via email
    await sendVerificationCode(email, verificationCode);

    res.status(200).json({
      success: true,
      message: 'New verification code sent to your email. Valid for 60 seconds.',
      data: {
        email: email.toLowerCase(),
        expiresIn: 60 // seconds
      }
    });
  } catch (error) {
    next(error);
  }
};
