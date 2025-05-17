import { clerkClient, ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from '../../api/utils/errorTypes';

//  Extend Request With Clerk
export interface AuthRequest extends Request {
  auth: {
    userId: string;
    sessionId: string;
    getToken: () => Promise<string>;
    //  Add Clerk Values Here
  }
}

//  Require Auth (User)
export const requireAuth = ClerkExpressRequireAuth({

  onError: (error: any) => {
    console.error('Authentication error:', error);
    //  TODO : Custom Error Message
    return;
  }
});

//  Uniform Error Message
export const handleAuthError = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  
  if (!authReq.auth) {
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
    //  Admin Check
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
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR
      }
    });
  }
};