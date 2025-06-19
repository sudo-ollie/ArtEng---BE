import { Router } from "express";
import { AuditLevel } from "../enums/enumsRepo";
import { services } from "../api/services/container";
import { AuditLogController } from "./controllers/auditlog.controller";
import { AdminEmailListController } from "../api-admin/controllers/emailList.controller";
import { AdminEventController } from "../api-admin/controllers/events.controller";
import { ContentfulController } from "./controllers/contentful.controller";
import { AdminAuthController } from "./controllers/admin-auth.controller";
import { createHandler } from "../api/utils/routerTypes";
import { authLimiter } from "../api/middleware/ratelimiter";
import { requireAuth, requireAdmin } from "../api/middleware/auth";

export function setupAdminApi() {
  const router = Router();

  // Test Endpoint (no auth required)
  router.get("/", (req, res) => {
    services.auditLogger.auditLog(
      "AuditLog Test",
      AuditLevel.System,
      "ArtEng-Dev"
    );
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
      hasAuth: !!req.headers.authorization,
    });
    next();
  });

  // Admin Authentication Routes (these handle their own auth internally)
  router.post("/auth/verify", authLimiter, AdminAuthController.verifyAdmin);
  router.get("/auth/session", AdminAuthController.checkSession);
  router.post("/auth/logout", authLimiter, AdminAuthController.logout);

  // PROTECTED ROUTES - All routes below require authentication and admin role

  // Audit log Endpoints
  router.get(
    "/audit-logs",
    requireAuth,
    requireAdmin,
    createHandler(AuditLogController.getAllLogs)
  );
  router.get(
    "/audit-logs/user/:userId",
    requireAuth,
    requireAdmin,
    createHandler(AuditLogController.getLogsByUser)
  );

  // Email list Endpoints
  router.get(
    "/mailing-list",
    requireAuth,
    requireAdmin,
    createHandler(AdminEmailListController.getAllMailingList)
  );
  router.get(
    "/mailing-list/stats",
    requireAuth,
    requireAdmin,
    createHandler(AdminEmailListController.getMailingListStats)
  );
  router.get(
    "/mailing-list/export",
    requireAuth,
    requireAdmin,
    createHandler(AdminEmailListController.exportMailingList)
  );

  // Event Endpoints
  router.get(
    "/events",
    requireAuth,
    requireAdmin,
    createHandler(AdminEventController.getAllEvents)
  );
    router.get(
    "/events/stats",
    requireAuth,
    requireAdmin,
    createHandler(AdminEventController.getEventStats)
  );
  router.get(
    "/events/:id",
    requireAuth,
    requireAdmin,
    createHandler(AdminEventController.getEventById)
  );
  router.delete(
    "/events/:id",
    requireAuth,
    requireAdmin,
    createHandler(AdminEventController.deleteEvent)
  );
  router.put(
    "/events/:id/lock",
    requireAuth,
    requireAdmin,
    createHandler(AdminEventController.lockEvent)
  );
  router.put(
    "/events/:id/private",
    requireAuth,
    requireAdmin,
    createHandler(AdminEventController.privateEvent)
  );
  router.post(
    "/events/create",
    requireAuth,
    requireAdmin,
    createHandler(AdminEventController.createEvent)
  );

  // Contentful Endpoints
  router.get(
    "/articles",
    requireAuth,
    requireAdmin,
    createHandler(ContentfulController.getAllArticles)
  );
  router.get(
    "/articles/drafts",
    requireAuth,
    requireAdmin,
    createHandler(ContentfulController.getAllArticlesIncludingDrafts)
  );
  router.get(
    "/articles/:slug",
    requireAuth,
    requireAdmin,
    createHandler(ContentfulController.getArticleBySlug)
  );
  router.post(
    "/articles",
    requireAuth,
    requireAdmin,
    createHandler(ContentfulController.createArticle)
  );
  router.put(
    "/articles/:id",
    requireAuth,
    requireAdmin,
    createHandler(ContentfulController.updateArticle)
  );
  router.post(
    "/articles/:id/publish",
    requireAuth,
    requireAdmin,
    createHandler(ContentfulController.publishArticle)
  );
  router.post(
    "/articles/:id/unpublish",
    requireAuth,
    requireAdmin,
    createHandler(ContentfulController.unpublishArticle)
  );
  router.post(
    "/contentful/upload-image",
    requireAuth,
    requireAdmin,
    ContentfulController.uploadImage
  );

  // Admin Dashboard Data
  router.get(
    "/dashboard-data",
    requireAuth,
    requireAdmin,
    AdminAuthController.getDashboardData
  );

  return router;
}
