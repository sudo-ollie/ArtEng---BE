import { clerkClient, ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from '../../api/utils/errorTypes';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY environment variable is required');
}

//  Extend Request With Clerk
export interface AuthRequest extends Request {
  auth: {
    userId: string;
    sessionId: string;
    getToken: () => Promise<string>;
  }
}

//  Require Auth (User) - Using Clerk's middleware
export const requireAuth = ClerkExpressRequireAuth({
  onError: (error: any) => {
    console.error('Authentication error:', error);
    
    if (error.status === 401) {
      console.error('Unauthorized: Invalid or missing token');
    } else if (error.status === 403) {
      console.error('Forbidden: Token valid but insufficient permissions');
    } else {
      console.error('Auth error details:', {
        message: error.message,
        status: error.status,
        code: error.code
      });
    }
    
    return;
  }
});

//  Uniform Error Message
export const handleAuthError = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  
  if (!authReq.auth || !authReq.auth.userId) {
    return res.status(401).json({
      error: {
        message: 'Authentication required',
        code: ErrorCode.UNAUTHORIZED
      }
    });
  }
  
  next();
};

//  Require Auth (Admin)
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  const { userId } = authReq.auth;
  
  try {
    const user = await clerkClient.users.getUser(userId);
    const userRole = user.publicMetadata?.role as string | undefined;

    if (userRole !== 'admin') {

      return res.status(403).json({
        error: {
          message: 'Admin access required',
          code: ErrorCode.FORBIDDEN
        }
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking admin role:', error);
    
    if (error instanceof Error) {
      console.error('Admin check error details:', {
        message: error.message,
        stack: error.stack,
        userId
      });
    }
    
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR
      }
    });
  }
};

export const adminOperationLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Add rate limiting specific to admin operations
  // This is where you might implement stricter limits for admin endpoints
  next();
};