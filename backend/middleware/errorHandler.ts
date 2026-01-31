import { Request, Response, NextFunction } from 'express';

// Error interface
interface CustomError extends Error {
  statusCode?: number;
  code?: string | number;
  errors?: Record<string, any>;
  keyPattern?: Record<string, any>;
}

// Global error handler middleware
export const errorHandler = (err: CustomError, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors: Record<string, string> = {};
    if (err.errors) {
      Object.keys(err.errors).forEach(key => {
        errors[key] = err.errors![key].message;
      });
    }
    
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      }
    });
    return;
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000 && err.keyPattern) {
    const field = Object.keys(err.keyPattern)[0];
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ERROR',
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      }
    });
    return;
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid ID format'
      }
    });
    return;
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      }
    });
    return;
  }
  
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired'
      }
    });
    return;
  }
  
  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: typeof err.code === 'string' ? err.code : 'SERVER_ERROR',
      message: message
    },
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler
export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found'
    }
  });
};
