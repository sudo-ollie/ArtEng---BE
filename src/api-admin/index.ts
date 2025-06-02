import { Router } from "express";
import { AuditLevel } from "../enums/enumsRepo";
import { services } from "../api/services/container";
import { AuditLogController } from "./controllers/auditlog.controller";
import { AdminEmailListController } from "../api-admin/controllers/emailList.controller";
import { AdminEventController } from "../api-admin/controllers/events.controller";
import { ContentfulController } from "./controllers/contentful.controller";
import { AdminAuthController } from "./controllers/admin-auth.controller";
import { createHandler } from '../api/utils/routerTypes';
import { authLimiter } from "../api/middleware/ratelimiter";

export function setupAdminApi() {
  const router = Router();

  // Test Endpoint
  router.get("/", (req, res) => {
    services.auditLogger.auditLog("AuditLog Test", AuditLevel.System, "ArtEng-Dev");
    res.json({
      name: "ArtEng Admin API",
      version: "1.0.0",
      status: "online",
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

  // Admin Authentication Routes
  router.post('/auth/verify', authLimiter, AdminAuthController.verifyAdmin);
  router.get('/auth/session', AdminAuthController.checkSession);
  router.post('/auth/logout', authLimiter, AdminAuthController.logout);

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