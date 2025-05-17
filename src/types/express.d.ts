import { Express } from 'express-serve-static-core';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId?: string;
        // Add other properties as needed
      };
    }
  }
}