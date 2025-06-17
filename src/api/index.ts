import { Router } from 'express';
import { createHandler } from './utils/routerTypes';

export function setupBaseApi() {
  const router = Router();

  // Core API info
  router.get('/', (req, res) => {
    res.json({
      name: 'ArtEng API',
      version: '1.0.0',
      status: 'online',
      endpoints: {
        public: '/api/v1',
        admin: '/admin/api/v1'
      },
      documentation: '/api/docs'
    });
  });

  // Health check endpoint
  router.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // API status endpoint
  router.get('/status', (req, res) => {
    res.json({
      api: 'online',
      database: 'connected',
      version: '1.0.0',
      build: process.env.BUILD_NUMBER || 'local',
      timestamp: new Date().toISOString()
    });
  });

  return router;
}