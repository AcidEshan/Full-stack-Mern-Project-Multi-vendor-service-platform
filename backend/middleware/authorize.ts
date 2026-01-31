import { Request, Response, NextFunction } from 'express';

// Authorization middleware - checks if user has required role(s)
const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        }
      });
      return;
    }
    
    // Check if user's role is in allowed roles (case-insensitive)
    const userRole = req.user.role?.toLowerCase();
    const allowedRolesLower = allowedRoles
      .filter(role => typeof role === 'string')
      .map(role => role.toLowerCase());
    
    if (!userRole || !allowedRolesLower.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to access this resource',
          debug: {
            userRole: req.user.role,
            allowedRoles: allowedRoles
          }
        }
      });
      return;
    }
    
    next();
  };
};

export default authorize;
