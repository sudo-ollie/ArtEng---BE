import { Router } from "express";
import { AuditLevel } from "../enums/enumsRepo";
import { services } from "../api/services/container";
import { AuditLogController } from "./controllers/auditlog.controller";
import { AdminEmailListController } from "../api-admin/controllers/emailList.controller";
import { AdminEventController } from "../api-admin/controllers/events.controller";
import { createHandler } from '../api/utils/routerTypes';

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

  // Audit log endpoints
  router.get('/audit-logs', createHandler(AuditLogController.getAllLogs));
  router.get('/audit-logs/user/:userId', createHandler(AuditLogController.getLogsByUser));
  
  // Email list endpoints
  router.get('/mailing-list', createHandler(AdminEmailListController.getAllMailingList));
  router.get('/mailing-list/export', createHandler(AdminEmailListController.exportMailingList));
  
  // Event endpoints
  router.delete('/events/:id', createHandler(AdminEventController.deleteEvent));
  router.put('/events/:id/lock', createHandler(AdminEventController.lockEvent));
  router.put('/events/:id/private', createHandler(AdminEventController.privateEvent));
  router.get('/events/stats', createHandler(AdminEventController.getEventStats));

  return router;
}