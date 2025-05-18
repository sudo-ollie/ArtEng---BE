import express from "express";
import { setupPublicApi } from "./api-public";
import { setupAdminApi } from "./api-admin";
import { configureSecurityMiddleware } from "./api/middleware/security";
import { configureRateLimitingMiddleware } from "./api/middleware/ratelimiter";
import { requestLogger } from "./api/middleware/reqLogger";

export async function startServer() {
  const app = express();
  const port = parseInt(process.env.PORT || "3000", 10);

  // Basic middleware
  app.use(express.json());
  app.use(requestLogger);

  // Configure security middleware
  configureSecurityMiddleware(app);
  configureRateLimitingMiddleware(app);

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Mount Public / Admin Endpoints On Separate Routes
  app.use("/api/v1", setupPublicApi());
  app.use("/admin/api/v1", setupAdminApi());

  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      console.error("Unhandled error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  );

  // Start the server
  return new Promise<void>((resolve) => {
    app.listen(port, () => {
      console.log(`⚡️[ArtEng-BE]: Server running on port ${port}`);
      console.log(
        `⚡️[ArtEng-BE]: Public API available at http://localhost:${port}/api/v1`
      );
      console.log(
        `⚡️[ArtEng-BE]: Admin API available at http://localhost:${port}/admin/api/v1`
      );
      resolve();
    });
  });
}
