import { Router, Request, Response, NextFunction } from "express";
import { AuditLevel } from "../enums/enumsRepo";
import { services } from "../api/services/container";
import { AuditLogController } from "./controllers/auditlog.controller";
import { AdminEmailListController } from "../api-admin/controllers/emailList.controller";
import { AdminEventController } from "../api-admin/controllers/events.controller";
import { ContentfulController } from "./controllers/contentful.controller";
import { AdminAuthController } from "./controllers/admin-auth.controller";
import { createHandler } from '../api/utils/routerTypes';
import { authLimiter } from "../api/middleware/ratelimiter";
import { clerkClient } from '@clerk/clerk-sdk-node';
import { getAuth } from '@clerk/express';

// Extended Request interface for Clerk auth
interface AuthenticatedRequest extends Request {
  auth: {
    userId: string;
    sessionId?: string;
  };
}

export function setupAdminApi() {
  const router = Router();

  // Test Endpoint (no auth required)
  router.get("/", (req, res) => {
    services.auditLogger.auditLog("AuditLog Test", AuditLevel.System, "ArtEng-Dev");
    res.json({
      name: "ArtEng Admin API",
      version: "1.0.0",
      status: "online",
      timestamp: new Date().toISOString(),
    });
  });

  // Dev Debugging
  router.use((req, res, next) => {
    console.log("API-ADMIN DEBUGGING:", {
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      path: req.path,
      url: req.url,
    });
    next();
  });

  // Admin Authentication Routes (no auth middleware needed as they handle auth internally)
  router.post('/auth/verify', authLimiter, AdminAuthController.verifyAdmin);
  router.get('/auth/session', AdminAuthController.checkSession);
  router.post('/auth/logout', authLimiter, AdminAuthController.logout);

  // Admin role verification middleware for protected routes
  const requireAdminAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      
      if (!auth?.userId) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required' }
        });
        return;
      }

      const user = await clerkClient.users.getUser(auth.userId);
      const userRole = user.publicMetadata?.role as string | undefined;
      
      if (userRole !== 'admin') {
        res.status(403).json({
          success: false,
          error: { message: 'Admin access required' }
        });
        return;
      }
      
      // Add auth info to request for use in handlers
      (req as AuthenticatedRequest).auth = {
        userId: auth.userId,
        sessionId: auth.sessionId
      };
      
      next();
    } catch (error) {
      console.error('Admin verification error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error' }
      });
    }
  };

  // Apply admin auth middleware to all routes below this point
  router.use(requireAdminAuth);

  // Protected Admin Routes (require both Clerk auth + admin role)
  
  // Audit log Endpoints
  router.get('/audit-logs', createHandler(AuditLogController.getAllLogs));
  router.get('/audit-logs/user/:userId', createHandler(AuditLogController.getLogsByUser));
  
  // Email list Endpoints
  router.get('/mailing-list', createHandler(AdminEmailListController.getAllMailingList));
  router.get('/mailing-list/export', createHandler(AdminEmailListController.exportMailingList));
  
  // Event Endpoints
  router.delete('/events/:id', createHandler(AdminEventController.deleteEvent));
  router.put('/events/:id/lock', createHandler(AdminEventController.lockEvent));
  router.put('/events/:id/private', createHandler(AdminEventController.privateEvent));
  router.get('/events/stats', createHandler(AdminEventController.getEventStats));
  router.post('/events/create', createHandler(AdminEventController.createEvent));

  // Contentful Endpoints
  router.get('/articles', createHandler(ContentfulController.getAllArticles));
  router.get('/articles/drafts', createHandler(ContentfulController.getAllArticlesIncludingDrafts));
  router.get('/articles/:slug', createHandler(ContentfulController.getArticleBySlug));
  router.post('/articles', createHandler(ContentfulController.createArticle));
  router.put('/articles/:id', createHandler(ContentfulController.updateArticle));
  router.post('/articles/:id/publish', createHandler(ContentfulController.publishArticle));
  router.post('/articles/:id/unpublish', createHandler(ContentfulController.unpublishArticle));

  // Admin Dashboard Data - Protected endpoint
  router.get('/dashboard-data', AdminAuthController.getDashboardData);

  return router;
}