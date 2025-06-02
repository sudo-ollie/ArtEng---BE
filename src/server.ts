import express from "express";
import cors from 'cors';
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

  // CORS Configuration - Add this before security middleware
  const corsOptions = {
    origin: [
      'http://localhost:3001', // Your frontend URL
      'http://localhost:3000', // Current server
      // Add any other origins you need for development/production
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    credentials: true, // If you need to send cookies/auth headers
  };

  app.use(cors(corsOptions));

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