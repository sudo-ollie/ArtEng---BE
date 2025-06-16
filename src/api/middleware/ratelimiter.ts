import rateLimit from 'express-rate-limit';
import express from 'express';

//  General Endpoint Ratelimiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, //  15 minutes
  max: 5, //  IP = 100 per windowMs
  standardHeaders: false, //    Don't include ratelimit info in response
  legacyHeaders: false, //  Disable the `X-RateLimit-*` headers
  message: 'Too many requests, please try again after 15 minutes'
});

//  Strict Ratelimiter
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, //  1 hour
  max: 5, //    Limit each IP to 5 login requests per hour
  standardHeaders: false,
  legacyHeaders: false,
  message: 'Too many login attempts, please try again after an hour'
});

export const configureRateLimitingMiddleware = (app: express.Application): void => {
  //    Apply to all routes
  app.use(apiLimiter);
};