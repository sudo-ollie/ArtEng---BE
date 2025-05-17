import helmet from 'helmet';
import express from 'express';

export const configureSecurityMiddleware = (app: express.Application): void => {
  //    Set security headers
  app.use(helmet());
};