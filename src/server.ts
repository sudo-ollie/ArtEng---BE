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
  const port = parseInt(process.env.PORT || "3000", 10); 

  // Ensure required environment variables are set
  if (!process.env.CLERK_SECRET_KEY) {
    console.error('ERROR: CLERK_SECRET_KEY environment variable is required');
    process.exit(1);
  }

  console.log('=== DEBUG: Environment Check ===');
  console.log('CLERK_SECRET_KEY set:', !!process.env.CLERK_SECRET_KEY);
  console.log('CLERK_PUBLISHABLE_KEY set:', !!process.env.CLERK_PUBLISHABLE_KEY);
  console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);

  // Basic middleware
  app.use(express.json());

  // CORS Configuration - MUST be before Clerk middleware
  const corsOptions = {
    origin: [
      'http://localhost:3000', // Your frontend URL
      'http://localhost:3001',
      "https://arteng-staging.netlify.app"
    ],
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

  // Add request logging BEFORE Clerk middleware for debugging
  app.use((req, res, next) => {
    console.log('=== Incoming Request ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Authorization Header:', req.headers.authorization ? 'Present' : 'Missing');
    next();
  });

  // CRITICAL: Clerk middleware MUST be before routes that use getAuth()
  app.use(clerkMiddleware({
    // Optional: Add configuration if needed
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  }));

  console.log('✅ Clerk middleware registered');

  // Add more specific request logging
  app.use(requestLogger);

  // Configure other middleware AFTER Clerk
  configureSecurityMiddleware(app);
  configureRateLimitingMiddleware(app);

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({ 
      status: "ok",
      timestamp: new Date().toISOString(),
      clerk: !!process.env.CLERK_SECRET_KEY
    });
  });

  // Mount API routes
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
        error: "Internal Server Error",
        message: err.message 
      });
    }
  );

  // Start the server
  return new Promise<void>((resolve) => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`⚡️[ArtEng-BE]: Server running on port ${port}`);
      console.log(`⚡️[ArtEng-BE]: Public API available at http://localhost:${port}/api/v1`);
      console.log(`⚡️[ArtEng-BE]: Admin API available at http://localhost:${port}/admin/api/v1`);
      resolve();
    });
  });
}