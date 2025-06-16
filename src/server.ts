import express from "express";
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { setupPublicApi } from "./api-public";
import { setupAdminApi } from "./api-admin";
import { configureSecurityMiddleware} from "./api/middleware/security";
import { configureRateLimitingMiddleware } from "./api/middleware/ratelimiter";
import { requestLogger } from "./api/middleware/reqLogger";
import { errorHandler } from "./api/middleware/errorHandler";
import { sanitizeInput } from "./api/middleware/validation";

export async function startServer() {
  const app = express();
  const port = parseInt(process.env.PORT || "3000", 10); 

  if (!process.env.CLERK_SECRET_KEY) {
    console.error('ERROR: CLERK_SECRET_KEY environment variable is required');
    process.exit(1);
  }

  app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
      (req as any).rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://arteng-staging.netlify.app'
  ];

  const corsOptions = {
    origin: (origin: string | undefined, callback: Function) => {
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Request-ID'
    ],
    credentials: true,
    maxAge: 86400
  };

  app.use(cors(corsOptions));
  configureSecurityMiddleware(app);
  app.use(sanitizeInput);

  //  Clerk middleware
  app.use(clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  }));


  app.use(requestLogger);
  configureRateLimitingMiddleware(app);

  //  Secure health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({ 
      status: "ok",
      timestamp: new Date().toISOString()
    });
  });

  //  Mount API routes
  app.use("/api/v1", setupPublicApi());
  app.use("/admin/api/v1", setupAdminApi());

  //  404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: {
        message: 'Endpoint not found',
        code: 'NOT_FOUND'
      }
    });
  });

  app.use(errorHandler);

  //  Start the server
  return new Promise<void>((resolve) => {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`⚡️[ArtEng-BE]: Server running on port ${port}`);
      console.log(`⚡️[ArtEng-BE]: Public API available at http://localhost:${port}/api/v1`);
      console.log(`⚡️[ArtEng-BE]: Admin API available at http://localhost:${port}/admin/api/v1`);
      resolve();
    });

    //  Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
      });
    });
  });
}