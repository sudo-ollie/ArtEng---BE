import express, { Express, Request, Response, NextFunction } from 'express';
import 'dotenv/config'
import adminRouter from './admin-api';
import publicRouter from './public-api';
import { errorHandler, notFoundMiddleware } from './shared/middleware/errorhandler';
import { clerkMiddleware } from '@clerk/express'
import { NotFoundError } from './shared/constants/errors';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

export const app = express();
const port = process.env.PORT || 3001;

//  #region [Middleware]
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware())

// Debugging Feature
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});
//  #endregion

//  For Dev Debugging
app.use((req, res, next) => {
  console.log('Pre-router middleware:', {
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    path: req.path,
    url: req.url
  });
  next();
});

//  #region [Swagger Config]
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express API with Swagger',
      version: '1.0.0',
      description: 'A sample Express API with Swagger documentation',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      }
    ]
  },
  apis: [
    './src/admin-api/**/*.ts',
    './src/public-api/**/*.ts',
    './apps/api/src/index.ts'  
  ]
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
//  #endregion


//  For Dev Debugging
app.use((req, res, next) => {
  console.log('Post-router middleware:', {
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    path: req.path,
    url: req.url
  });
  next();
});

//  #region [Global Methods]
// Global health check - place before other routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});
//  #endregion

//  #region [API Routers]
/**
 * @openapi
 * /api/admin:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Admin API endpoint
 *     description: Base endpoint for admin API
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Server error
 */
app.use('/api/admin', adminRouter);  // Changed to match Swagger docs

/**
 * @openapi
 * /api:
 *   get:
 *     tags:
 *       - Public
 *     summary: Public API endpoint
 *     description: Base endpoint for public API
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Server error
 */
app.use('/api', publicRouter);

// Swagger UI - place after routes but before error handlers
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
//  #endregion

//  Error Handling
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  console.log(`Route not found: ${req.method} ${req.url}`);
  next(new NotFoundError(`Cannot ${req.method} ${req.url}`));
});

app.use(notFoundMiddleware);
app.use(errorHandler);

//  #region [Server Methods]
let serverInstance: any = null;

export const server = {
  start: () => {
    serverInstance = app.listen(port, () => {
      console.log(`⚡️[server]: API Server running at http://localhost:${port}`);
      console.log(`⚡️[server]: Admin API Server running at http://localhost:${port}/api/admin`);
      console.log(`⚡️[server]: Public API Server running at http://localhost:${port}/api`);
      console.log(`⚡️[server]: API Documentation available at http://localhost:${port}/api-docs`);
    });
    return serverInstance;
  },
  stop: async () => {
    if (serverInstance) {
      await new Promise<void>((resolve) => {
        serverInstance.close(() => {
          console.log('Server closed');
          resolve();
        });
      });
      serverInstance = null;
    }
  }
};

const cleanup = async () => {
  await server.stop();
  process.exit(0);
};
//  #endregion

// #region [CleanUp]
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('SIGUSR2', cleanup); // For nodemon restart
// #endregion

if (require.main === module) {
  server.start();
}