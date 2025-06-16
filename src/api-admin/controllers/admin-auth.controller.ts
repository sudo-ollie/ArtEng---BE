import { Request, Response } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { getAuth } from '@clerk/express';
import { ErrorCode } from '../../api/utils/errorTypes';
import { services } from '../../api/services/container';

export class AdminAuthController {

  static async verifyAdmin(req: Request, res: Response): Promise<void> {
    try {
      // Debug: Log the incoming request headers
      console.log('=== DEBUG: Request Headers ===');
      console.log('Authorization:', req.headers.authorization);
      console.log('Content-Type:', req.headers['content-type']);
      console.log('Origin:', req.headers.origin);
      
      const auth = getAuth(req);
      console.log('=== DEBUG: Auth Object ===');
      console.log(JSON.stringify(auth, null, 2));
      
      // Try to manually extract token for debugging
      const authHeader = req.headers.authorization;
      if (authHeader) {
        console.log('=== DEBUG: Token Info ===');
        console.log('Header format:', authHeader.substring(0, 20) + '...');
        console.log('Starts with Bearer:', authHeader.startsWith('Bearer '));
        
        if (authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          console.log('Token length:', token.length);
          console.log('Token start:', token.substring(0, 20) + '...');
          
          // Try to manually verify the token
          try {
            const payload = await clerkClient.verifyToken(token);
          } catch (tokenError) {
            
            console.error(tokenError);
          }
        }
      } else {
        console.log('=== DEBUG: No Authorization Header ===');
      }
      
      if (!auth.userId) {
        console.log('=== DEBUG: No userId in auth object ===');
        
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
          error: {
            message: 'Admin access required',
            code: ErrorCode.FORBIDDEN
          }
        });
        return;
      }
      
      res.json({
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
        error: {
          message: 'Logout failed',
          code: ErrorCode.INTERNAL_ERROR
        }
      });
    }
  }
//
  /**
   * Fetch admin dashboard data
   */
  static async getDashboardData(req: Request, res: Response): Promise<void> {
    try {
      const auth = getAuth(req);
      
      if (!auth.userId) {
        res.status(401).json({
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
          error: {
            message: 'Admin access required',
            code: ErrorCode.FORBIDDEN
          }
        });
        return;
      }

      // Fetch admin dashboard data
      const users = await clerkClient.users.getUserList({ limit: 10 });
      
      res.json({
        stats: {
          totalUsers: users.length,
          activeUsers: users.filter(u => u.lastSignInAt).length,
          adminUsers: users.filter(u => u.publicMetadata?.role === 'admin').length
        },
        recentUsers: users.map(user => ({
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
        error: {
          message: 'Failed to fetch dashboard data',
          code: ErrorCode.INTERNAL_ERROR
        }
      });
    }
  }
}