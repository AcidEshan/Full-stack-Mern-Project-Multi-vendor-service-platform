import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import { verifyAccessToken, AccessTokenPayload } from '../utils/tokenUtils';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      token?: string;
    }
  }
}

// Authentication middleware - verifies JWT token
const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_REQUIRED',
          message: 'Authentication token is required'
        }
      });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    let decoded: AccessTokenPayload;
    try {
      decoded = verifyAccessToken(token);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Authentication token has expired'
          }
        });
        return;
      }
      
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token'
        }
      });
      return;
    }
    
    // Check token type
    if (decoded.type !== 'access') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type'
        }
      });
      return;
    }
    
    // Get user from database
    const user = await User.findById(decoded.sub).select('-password -refreshTokens');
    
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
    
    // Check if user is blocked
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
    
    // Check if user account is active
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Your account is inactive'
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
          message: 'Your vendor account is pending approval'
        }
      });
      return;
    }
    
    // Attach user to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      }
    });
  }
};

export default authenticate;
