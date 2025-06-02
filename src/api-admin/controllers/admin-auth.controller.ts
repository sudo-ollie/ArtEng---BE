// controllers/adminAuthController.ts
import { Request, Response } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { getAuth } from '@clerk/express';
import { ErrorCode } from '../../api/utils/errorTypes';

export class AdminAuthController {
  /**
   * Verify admin access after Clerk frontend authentication
   */
  static async verifyAdmin(req: Request, res: Response): Promise<void> {
    try {
      const auth = getAuth(req);
      
      if (!auth.userId) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: ErrorCode.UNAUTHORIZED
          }
        });
        return;
      }

      const user = await clerkClient.users.getUser(auth.userId);
      const userRole = user.publicMetadata?.role as string | undefined;
      
      // Log admin access attempt
      console.log(`Admin access attempt: ${user.emailAddresses[0]?.emailAddress} (${auth.userId}) - Role: ${userRole}`);
      
      if (userRole !== 'admin') {
        // Log unauthorized attempt
        console.warn(`SECURITY: Unauthorized admin access attempt by ${user.emailAddresses[0]?.emailAddress}`);
        
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

      // Success - return admin user data
      console.log(`Admin access granted: ${user.emailAddresses[0]?.emailAddress}`);
      
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          role: userRole,
          lastSignInAt: user.lastSignInAt
        },
        sessionInfo: {
          userId: auth.userId,
          sessionId: auth.sessionId
        }
      });
      
    } catch (error) {
      console.error('Error verifying admin access:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to verify admin access',
          code: ErrorCode.INTERNAL_ERROR
        }
      });
    }
  }

  /**
   * Check admin session validity
   */
  static async checkSession(req: Request, res: Response): Promise<void> {
    try {
      const auth = getAuth(req);
      
      if (!auth.userId) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: ErrorCode.UNAUTHORIZED
          }
        });
        return;
      }

      const user = await clerkClient.users.getUser(auth.userId);
      const userRole = user.publicMetadata?.role as string | undefined;
      
      if (userRole !== 'admin') {
        res.status(403).json({
          success: false,
          error: {
            message: 'Admin access required',
            code: ErrorCode.FORBIDDEN
          }
        });
        return;
      }
      
      res.json({
        success: true,
        valid: true,
        user: {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          role: user.publicMetadata?.role
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Session check error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Session check failed',
          code: ErrorCode.INTERNAL_ERROR
        }
      });
    }
  }

  /**
   * Handle admin logout with server-side cleanup
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const auth = getAuth(req);
      
      if (!auth.userId) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: ErrorCode.UNAUTHORIZED
          }
        });
        return;
      }

      const user = await clerkClient.users.getUser(auth.userId);
      console.log(`Admin logout: ${user.emailAddresses[0]?.emailAddress} (${auth.userId})`);
      
      res.json({ 
        success: true, 
        message: 'Admin session terminated successfully' 
      });
    } catch (error) {
      console.error('Admin logout error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Logout failed',
          code: ErrorCode.INTERNAL_ERROR
        }
      });
    }
  }

  /**
   * Fetch admin dashboard data
   */
  static async getDashboardData(req: Request, res: Response): Promise<void> {
    try {
      const auth = getAuth(req);
      
      if (!auth.userId) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: ErrorCode.UNAUTHORIZED
          }
        });
        return;
      }

      const user = await clerkClient.users.getUser(auth.userId);
      const userRole = user.publicMetadata?.role as string | undefined;
      
      if (userRole !== 'admin') {
        res.status(403).json({
          success: false,
          error: {
            message: 'Admin access required',
            code: ErrorCode.FORBIDDEN
          }
        });
        return;
      }

      // Fetch admin dashboard data
      const users = await clerkClient.users.getUserList({ limit: 100 });
      
      res.json({
        success: true,
        stats: {
          totalUsers: users.length,
          activeUsers: users.filter(u => u.lastSignInAt).length,
          adminUsers: users.filter(u => u.publicMetadata?.role === 'admin').length
        },
        recentUsers: users.slice(0, 10).map(user => ({
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          name: `${user.firstName} ${user.lastName}`.trim(),
          role: user.publicMetadata?.role || 'user',
          lastSignIn: user.lastSignInAt,
          createdAt: user.createdAt
        }))
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch dashboard data',
          code: ErrorCode.INTERNAL_ERROR
        }
      });
    }
  }
}