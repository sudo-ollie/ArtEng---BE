import { clerkClient, ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';
import { ErrorCode, ApiError } from '../utils/errorTypes';
import { services } from '../services/container';
import { AuditLevel } from '../../enums/enumsRepo';
import { adminLimiter } from './ratelimiter';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY environment variable is required');
}

export interface AuthRequest extends Request {
  auth: {
    userId: string;
    sessionId: string;
    getToken: () => Promise<string>;
  }
}

export const requireAuth = ClerkExpressRequireAuth({
  onError: (error: any) => {
    // Safely call audit logger (it might not be initialized yet)
    try {
      services.auditLogger.auditLog(
        `Authentication failed: ${error.message}`,
        AuditLevel.Error,
        'ANONYMOUS'
      );
    } catch (auditError) {
      console.warn('Failed to log audit event:', auditError);
    }
    
    throw new ApiError(401, 'Authentication required', ErrorCode.UNAUTHORIZED);
  }
});

export const handleAuthError = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  
  if (!authReq.auth || !authReq.auth.userId) {
    throw new ApiError(401, 'Authentication required', ErrorCode.UNAUTHORIZED);
  }
  
  next();
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  const { userId } = authReq.auth;
  
  try {
    const user = await clerkClient.users.getUser(userId);
    const userRole = user.publicMetadata?.role as string | undefined;

    if (userRole !== 'admin') {
      // Safely call audit logger
      try {
        await services.auditLogger.auditLog(
          `Unauthorized admin access attempt by user: ${userId}`,
          AuditLevel.Error,
          userId
        );
      } catch (auditError) {
        console.warn('Failed to log audit event:', auditError);
      }
      
      throw new ApiError(403, 'Admin access required', ErrorCode.FORBIDDEN);
    }

    if (!user.emailAddresses?.length || !user.emailAddresses[0].emailAddress) {
      throw new ApiError(403, 'Invalid admin account', ErrorCode.FORBIDDEN);
    }

    // Safely call audit logger
    try {
      await services.auditLogger.auditLog(
        `Admin access granted to: ${user.emailAddresses[0].emailAddress}`,
        AuditLevel.System,
        userId
      );
    } catch (auditError) {
      console.warn('Failed to log audit event:', auditError);
    }
    
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    console.error('Error checking admin role:', error);
    
    // Safely call audit logger
    try {
      await services.auditLogger.auditLog(
        `Admin check error for user: ${userId}`,
        AuditLevel.Error,
        userId
      );
    } catch (auditError) {
      console.warn('Failed to log audit event:', auditError);
    }
    
    throw new ApiError(500, 'Internal server error', ErrorCode.INTERNAL_ERROR);
  }
};

// Operation Limiter
export const adminOperationLimiter = (req: Request, res: Response, next: NextFunction) => {
  adminLimiter(req, res, next);
};