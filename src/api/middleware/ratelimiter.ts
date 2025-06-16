import rateLimit from 'express-rate-limit';
import express from 'express';

//  General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later',
    retryAfter: '15 minutes'
  },
  skip: (req) => {
    return req.path === '/health';
  }
});

//  Auth limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
});

//  Strict limiter
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many sensitive operation attempts',
    retryAfter: '1 hour'
  }
});

//  Admin operations limiter
export const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many admin operations',
    retryAfter: '5 minutes'
  }
});

export const configureRateLimitingMiddleware = (app: express.Application): void => {
  app.use(apiLimiter);
};