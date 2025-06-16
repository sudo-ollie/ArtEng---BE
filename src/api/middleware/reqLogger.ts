import { Request, Response, NextFunction } from 'express';
import { StructuredLogger } from '../services/logger';
import { v4 as uuidv4 } from 'uuid';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  const startTime = Date.now();
  
  (req as any).requestId = requestId;
  StructuredLogger.logRequest(req);
  const originalEnd = res.end.bind(res);
  
  res.end = ((chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void) => {
    const responseTime = Date.now() - startTime;
    
    StructuredLogger.logRequest(req, responseTime, res.statusCode);
    
    // Log slow requests
    if (responseTime > 1000) {
      StructuredLogger.logInfo('Slow Request Detected', {
        requestId,
        method: req.method,
        url: req.url,
        responseTime,
        statusCode: res.statusCode
      });
    }
    
    if (typeof encoding === 'function') {
      return originalEnd(chunk, encoding);
    } else {
      return originalEnd(chunk, encoding as BufferEncoding, cb);
    }
  }) as any;
  
  next();
};