import { Request, Response, NextFunction } from 'express';
import { ApiError, ErrorCode } from '../utils/errorTypes';
import { services } from '../services/container';
import { AuditLevel } from '../../enums/enumsRepo';

interface ErrorResponse {
  error: {
    message: string;
    code: string;
    timestamp: string;
    requestId?: string;
  };
}

interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    sessionId: string;
    getToken: () => Promise<string>;
  };
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string || 
                   Math.random().toString(36).substring(7);

  const authReq = req as AuthenticatedRequest;
  const userId = authReq.auth?.userId || 'ANONYMOUS';

  console.error('Error occurred:', {
    requestId,
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId
  });

  // Audit log the error
  services.auditLogger.auditLog(
    `Error occurred: ${err.message} on ${req.method} ${req.url}`,
    AuditLevel.Error,
    userId
  );

  let statusCode = 500;
  let message = 'Internal server error';
  let code: ErrorCode = ErrorCode.INTERNAL_ERROR;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;

    code = (err.code && Object.values(ErrorCode).includes(err.code as ErrorCode)) 
           ? err.code as ErrorCode 
           : ErrorCode.INTERNAL_ERROR;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Invalid input data';
    code = ErrorCode.VALIDATION_ERROR;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Authentication required';
    code = ErrorCode.UNAUTHORIZED;
  } else if (err.status === 401) {
    statusCode = 401;
    message = 'Authentication required';
    code = ErrorCode.UNAUTHORIZED;
  } else if (err.status === 403) {
    statusCode = 403;
    message = 'Access forbidden';
    code = ErrorCode.FORBIDDEN;
  }

  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'An unexpected error occurred';
  }

  const errorResponse: ErrorResponse = {
    error: {
      message,
      code,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV !== 'production' && { requestId })
    }
  };

  res.status(statusCode).json(errorResponse);
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};