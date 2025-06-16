import helmet from 'helmet';
import express from 'express';

export const configureSecurityMiddleware = (app: express.Application): void => {
  app.use(helmet());
};