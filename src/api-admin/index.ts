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

  // === AUDIT LOG ENDPOINTS ===
  
  // Original endpoints (for backward compatibility)
  router.get('/audit-logs', createHandler(AuditLogController.getAllLogs));
  router.get('/audit-logs/user/:userId', createHandler(AuditLogController.getLogsByUser));
  
  // Enhanced paginated endpoints with filtering and sorting
  router.get('/audit-logs/paginated', createHandler(AuditLogController.getLogsPaginated));
  router.get('/audit-logs/user/:userId/paginated', createHandler(AuditLogController.getUserLogsPaginated));
  
  // Search and filter endpoints
  router.get('/audit-logs/search', createHandler(AuditLogController.searchLogs));
  router.get('/audit-logs/date-range', createHandler(AuditLogController.getLogsByDateRange));
  router.get('/audit-logs/action-type', createHandler(AuditLogController.getLogsByActionType));
  
  // Quick access endpoints
  router.get('/audit-logs/recent', createHandler(AuditLogController.getRecentLogs));
  router.get('/audit-logs/statistics', createHandler(AuditLogController.getLogStatistics));
  
  // Maintenance endpoint
  router.delete('/audit-logs/cleanup', createHandler(AuditLogController.deleteOldLogs));

  // === EMAIL LIST ENDPOINTS ===
  router.get('/mailing-list', createHandler(AdminEmailListController.getAllMailingList));
  router.get('/mailing-list/stats', createHandler(AdminEmailListController.getMailingListStats));
  router.get('/mailing-list/export', createHandler(AdminEmailListController.exportMailingList));
  
  // === EVENT ENDPOINTS ===
  router.delete('/events/:id', createHandler(AdminEventController.deleteEvent));
  router.put('/events/:id/lock', createHandler(AdminEventController.lockEvent));
  // router.put('/events/:id/unlock', createHandler(AdminEventController.unlockEvent));
  
  // === CONTENTFUL ENDPOINTS ===
  // router.get('/contentful/sync', createHandler(ContentfulController.syncContent));
  // router.post('/contentful/webhook', createHandler(ContentfulController.handleWebhook));

  return router;
}