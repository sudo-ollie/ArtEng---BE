import winston from 'winston';
import { Request } from 'express';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta
      });
    })
  ),
  defaultMeta: {
    service: 'arteng-api',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

export class StructuredLogger {
  private static sanitizeForLogging(data: any): any {
    if (typeof data === 'string') {
      return data
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
        .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]')
        .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (key.toLowerCase().includes('password') || 
            key.toLowerCase().includes('secret') ||
            key.toLowerCase().includes('token')) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeForLogging(value);
        }
      }
      return sanitized;
    }
    
    return data;
  }

  static logRequest(req: Request, responseTime?: number, statusCode?: number) {
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).auth?.userId,
      responseTime,
      statusCode,
      timestamp: new Date().toISOString()
    };

    logger.http('HTTP Request', this.sanitizeForLogging(logData));
  }

  static logError(error: Error, context?: any) {
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      context: this.sanitizeForLogging(context)
    });
  }

  static logSecurity(event: string, details: any) {
    logger.warn('Security Event', {
      event,
      details: this.sanitizeForLogging(details),
      timestamp: new Date().toISOString()
    });
  }

  static logInfo(message: string, meta?: any) {
    logger.info(message, this.sanitizeForLogging(meta));
  }

  static logDebug(message: string, meta?: any) {
    logger.debug(message, this.sanitizeForLogging(meta));
  }
}

export default logger;