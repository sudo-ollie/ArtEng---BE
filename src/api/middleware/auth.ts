import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { ErrorCode } from '../../api/utils/errorTypes';
import { services } from '../services/container';
import { AuditLevel } from '../../enums/enumsRepo';

// Extend Request with Clerk auth
export interface AuthRequest extends Request {
  auth: {
    userId: string;
    sessionId?: string;
    [key: string]: any;
  };
}

/**
 * Middleware to require authentication
 * Uses the newer @clerk/express getAuth() pattern
 */

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const auth = getAuth(req);
    
    console.log('=== AUTH DEBUG ===');
    console.log('Auth object:', auth);
    console.log('UserId:', auth.userId);
    console.log('SessionId:', auth.sessionId);
    
    if (!auth.userId) {
      console.log('Authentication failed: No userId found');
      
      services.auditLogger.auditLog(
        `Authentication failed - No userId - ${req.method} ${req.originalUrl}`,
        AuditLevel.Error,
        'ANONYMOUS'
      );
      
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: ErrorCode.UNAUTHORIZED
        }
      });
      return;
    }
    
    (req as AuthRequest).auth = auth;
    
    console.log(`Authentication successful for user: ${auth.userId}`);
    next();
    
  } catch (error) {
    console.error('Authentication middleware error:', error);
    
    services.auditLogger.auditLog(
      `Authentication middleware error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      AuditLevel.Error,
      'SYSTEM'
    );
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Authentication error',
        code: ErrorCode.INTERNAL_ERROR
      }
    });
    return;
  }
};

/**
 * Middleware to require admin role
 * Must be used AFTER requireAuth
 */

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { userId } = authReq.auth;
    
    if (!userId) {
      console.error('requireAdmin called without authentication');
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: ErrorCode.UNAUTHORIZED
        }
      });
      return;
    }
    
    const user = await clerkClient.users.getUser(userId);
    const userRole = user.publicMetadata?.role as string | undefined;
    
    if (userRole !== 'admin') {
      console.warn(`SECURITY: Unauthorized admin access attempt by ${user.emailAddresses[0]?.emailAddress}`);
      
      services.auditLogger.auditLog(
        `Unauthorized admin access attempt by ${user.emailAddresses[0]?.emailAddress} (${userId}) - Role: ${userRole || 'none'}`,
        AuditLevel.Error,
        userId
      );
      
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required',
          code: ErrorCode.FORBIDDEN
        },
        user: {
          email: user.emailAddresses[0]?.emailAddress,
          role: userRole || 'user'
        }
      });
      return;
    }
    
    (authReq as any).user = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      role: userRole
    };
    
    next();
    
  } catch (error) {
    console.error('Admin authorization error:', error);
    
    const authReq = req as AuthRequest;
    services.auditLogger.auditLog(
      `Admin authorization error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      AuditLevel.Error,
      authReq.auth?.userId || 'SYSTEM'
    );
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Authorization error',
        code: ErrorCode.INTERNAL_ERROR
      }
    });
    return;
  }
};

/**
 * Combined middleware for admin routes
 * Combines authentication and admin role check
 */
export const requireAuthAdmin = [requireAuth, requireAdmin];