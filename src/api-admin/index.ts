import { Router } from "express";
import { AuditLevel } from "../enums/enumsRepo";
import { services } from "../api/services/container";
import { AuditLogController } from "./controllers/auditlog.controller";
import { AdminEmailListController } from "../api-admin/controllers/emailList.controller";
import { AdminEventController } from "../api-admin/controllers/events.controller";

export function setupAdminApi() {
  const router = Router();

  //    Test Endpoint
  router.get("/", (req, res) => {
    services.auditLogger.auditLog("AuditLog Test", AuditLevel.System, "ArtEng-Dev");
    res.json({
      name: "ArtEng Admin API",
      version: "1.0.0",
      status: "online",
    });
  });

  //    Dev Debugging
  router.use((req, res, next) => {
    console.log("API-ADMIN DEBUGGING:", {
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      path: req.path,
      url: req.url,
    });
    next();
  });

  //    Mount Endpoints Here
  
  //    Audit log endpoints
  router.get('/audit-logs', AuditLogController.getAllLogs);
  router.get('/audit-logs/user/:userId', AuditLogController.getLogsByUser);
  
  //    Email list endpoints
  router.get('/mailing-list', AdminEmailListController.getAllMailingList);
  router.get('/mailing-list/export', AdminEmailListController.exportMailingList);
  
  //    Event endpoints
  router.delete('/events/:id', AdminEventController.deleteEvent);
  router.put('/events/:id/lock', AdminEventController.lockEvent);
  router.put('/events/:id/private', AdminEventController.privateEvent);
  router.get('/events/stats', AdminEventController.getEventStats);

  return router;
}