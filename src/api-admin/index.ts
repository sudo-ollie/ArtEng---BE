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
import { requireAuth, requireAdmin } from "../api/middleware/auth";

export function setupAdminApi() {
  const router = Router();

  // =====  PUBLIC ROUTES  =====
  
  // Test Endpoint
  router.get("/", (req, res) => {
    services.auditLogger.auditLog("Admin API Live", AuditLevel.System, "Health Check");
    res.json({
      name: "ArtEng Admin API",
      status: "online",
    });
  });

  // Admin Authentication Routes - these handle their own auth
  router.post('/auth/verify', authLimiter, AdminAuthController.verifyAdmin);
  router.get('/auth/session', authLimiter, AdminAuthController.checkSession);
  router.post('/auth/logout', authLimiter, AdminAuthController.logout);

  // ===== APPLY AUTH MIDDLEWARE TO ALL SUBSEQUENT ROUTES =====
  // Use type assertion to resolve Express type conflicts
  router.use(requireAuth as any);
  
  router.use((req, res, next) => {
    requireAdmin(req as any, res, next).catch(next);
  });
  
  // ===== PROTECTED ADMIN ROUTES =====
  
  // === AUDIT LOG ENDPOINTS ===
  router.get('/audit-logs', createHandler(AuditLogController.getAllLogs));
  router.get('/audit-logs/user/:userId', createHandler(AuditLogController.getLogsByUser));
  router.get('/audit-logs/paginated', createHandler(AuditLogController.getLogsPaginated));
  router.get('/audit-logs/user/:userId/paginated', createHandler(AuditLogController.getUserLogsPaginated));
  router.get('/audit-logs/search', createHandler(AuditLogController.searchLogs));
  router.get('/audit-logs/date-range', createHandler(AuditLogController.getLogsByDateRange));
  router.get('/audit-logs/action-type', createHandler(AuditLogController.getLogsByActionType));
  router.get('/audit-logs/recent', createHandler(AuditLogController.getRecentLogs));
  router.get('/audit-logs/statistics', createHandler(AuditLogController.getLogStatistics));
  router.delete('/audit-logs/cleanup', createHandler(AuditLogController.deleteOldLogs));

  // === EMAIL LIST ENDPOINTS ===
  router.get('/mailing-list', createHandler(AdminEmailListController.getAllMailingList));
  router.get('/mailing-list/stats', createHandler(AdminEmailListController.getMailingListStats));
  router.get('/mailing-list/export', createHandler(AdminEmailListController.exportMailingList));
  
  // === EVENT ENDPOINTS ===
  router.delete('/events/:id', createHandler(AdminEventController.deleteEvent));
  router.put('/events/:id/lock', createHandler(AdminEventController.lockEvent));
  
  // === CONTENTFUL ENDPOINTS ===
  // router.get('/contentful/sync', createHandler(ContentfulController.syncContent));
  // router.post('/contentful/webhook', createHandler(ContentfulController.handleWebhook));

  return router;
}