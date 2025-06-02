import { clerkClient, ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from '../../api/utils/errorTypes';

// Ensure secret key is available
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
    //  Add Clerk Values Here
  }
}

//  Require Auth (User) - Using Clerk's middleware
export const requireAuth = ClerkExpressRequireAuth({
  onError: (error: any) => {
    console.error('Authentication error:', error);
    
    // Log more details about the error for debugging
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
    
    return; // Let handleAuthError middleware handle the response
  }
});

//  Uniform Error Message
export const handleAuthError = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  
  // Check if authentication failed
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

//  Require Auth (Admin) - Using the default clerkClient
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  const { userId } = authReq.auth;
  
  try {
    // Use the default clerkClient (it automatically uses CLERK_SECRET_KEY from env)
    const user = await clerkClient.users.getUser(userId);
    
    //  Admin Check
    const userRole = user.publicMetadata?.role as string | undefined;
    
    // Log admin access attempt for security monitoring
    console.log(`Admin access attempt: ${user.emailAddresses[0]?.emailAddress} (${userId}) - Role: ${userRole}`);
    
    if (userRole !== 'admin') {
      // Log unauthorized admin access attempt
      console.warn(`SECURITY: Unauthorized admin access attempt by ${user.emailAddresses[0]?.emailAddress} (${userId})`);
      
      return res.status(403).json({
        error: {
          message: 'Admin access required',
          code: ErrorCode.FORBIDDEN
        }
      });
    }
    
    // Log successful admin access
    console.log(`Admin access granted: ${user.emailAddresses[0]?.emailAddress} (${userId})`);
    
    next();
  } catch (error) {
    console.error('Error checking admin role:', error);
    
    // Provide more specific error handling
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

// Middleware for rate limiting admin operations (optional)
export const adminOperationLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Add rate limiting specific to admin operations
  // This is where you might implement stricter limits for admin endpoints
  next();
};