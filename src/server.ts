import express from "express";
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { setupPublicApi } from "./api-public";
import { setupAdminApi } from "./api-admin";
import { configureSecurityMiddleware } from "./api/middleware/security";
import { configureRateLimitingMiddleware } from "./api/middleware/ratelimiter";
import { requestLogger } from "./api/middleware/reqLogger";

export async function startServer() {
  const app = express();
  const port = parseInt(process.env.PORT || "3001", 10);

  // Basic middleware
  app.use(express.json());
  app.use(requestLogger);

  // CORS Configuration
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    process.env.FRONTEND_URL,
  ].filter((origin): origin is string => Boolean(origin));

  const corsOptions: cors.CorsOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    credentials: true,
  };

  app.use(cors(corsOptions));

  // Add Clerk middleware - this makes auth available on req.auth
  app.use(clerkMiddleware());

  // Configure security middleware
  configureSecurityMiddleware(app);
  configureRateLimitingMiddleware(app);

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({ 
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Mount Public / Admin Endpoints On Separate Routes
  app.use("/api/v1", setupPublicApi());
  app.use("/admin/api/v1", setupAdminApi());

  // Error handling middleware
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      console.error("Unhandled error:", err);
      res.status(500).json({ 
        success: false,
        error: "Internal Server Error",
        ...(process.env.NODE_ENV === 'development' && { details: err.message })
      });
    }
  );

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
      path: req.originalUrl
    });
  });

  // Start the server
  return new Promise<void>((resolve) => {
    app.listen(port, () => {
      console.log(`⚡️[ArtEng-BE]: Server running on port ${port}`);
      console.log(`⚡️[ArtEng-BE]: Public API available at http://localhost:${port}/api/v1`);
      console.log(`⚡️[ArtEng-BE]: Admin API available at http://localhost:${port}/admin/api/v1`);
      console.log(`⚡️[ArtEng-BE]: Health check at http://localhost:${port}/health`);
      resolve();
    });
  });
}