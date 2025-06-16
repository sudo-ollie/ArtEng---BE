import { Request, Response, NextFunction } from 'express';
import { services } from '../services/container';
import { AuditLevel } from '../../enums/enumsRepo';

// Define a type that extends Request to include Clerk auth properties
interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    sessionId?: string;
    // Add other properties as needed
  };
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log when the request completes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMessage = `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`;
    
    //  Console not DB Logging In Dev
    if (process.env.NODE_ENV !== 'production') {
      console.log(logMessage);
    }
    
    // Log to audit log for specific endpoints or status codes
    if (req.originalUrl.includes('/admin/') || res.statusCode >= 400) {
      // Cast the request to AuthenticatedRequest to access auth property
      const authReq = req as AuthenticatedRequest;
      // services.auditLogger.auditLog(
      //   logMessage,
      //   res.statusCode >= 400 ? AuditLevel.Error : AuditLevel.System,
      //   authReq.auth?.userId || 'anonymous'
      // );
    }
  });
  
  next();
};