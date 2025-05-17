import { Router } from "express";
import { AuditLevel } from "../enums/enumsRepo";
import { auditLogger } from "../api/services";

export function setupAdminApi() {
  const router = Router();

  //    Test Endpoint
  router.get("/", (req, res) => {
    auditLogger.auditLog("AuditLog Test", AuditLevel.System, "ArtEng-Dev");
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

  return router;
}
