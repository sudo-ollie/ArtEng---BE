export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: ErrorCode = ErrorCode.INTERNAL_ERROR
  ) {
    super(message);
    this.name = 'ApiError';
    
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT = 'INVALID_INPUT'
}

export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError;
}

export const createError = {
  unauthorized: (message: string = 'Authentication required') => 
    new ApiError(401, message, ErrorCode.UNAUTHORIZED),
    
  forbidden: (message: string = 'Access forbidden') => 
    new ApiError(403, message, ErrorCode.FORBIDDEN),
    
  notFound: (message: string = 'Resource not found') => 
    new ApiError(404, message, ErrorCode.NOT_FOUND),
    
  validation: (message: string = 'Invalid input data') => 
    new ApiError(400, message, ErrorCode.VALIDATION_ERROR),
    
  internal: (message: string = 'Internal server error') => 
    new ApiError(500, message, ErrorCode.INTERNAL_ERROR)
};