import { Router } from 'express';

export function configureSharedApi() {
  const router = Router();
  
  // You can add shared middleware here later
  // For example: logging middleware, basic security, etc.
  
  return router;
}

// Export any shared utilities, models, or types that will be used by both APIs
export * from './utils/errorTypes';