import { Router } from 'express';
import { EmailListController } from "../api/controllers/emailList.controller";
import { EventController } from './controllers/event.controller';
import { createHandler } from '../api/utils/routerTypes';

export function setupPublicApi() {
  const router = Router();

  // Test Endpoint
  router.get('/', (req, res) => {
    res.json({
      name: 'ArtEng Public API',
      version: '1.0.0',
      status: 'online'
    });
  });

  // Dev Debugging
  router.use((req, res, next) => {
    console.log("API-PUBLIC DEBUGGING:", {
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      path: req.path,
      url: req.url,
    });
    next();
  });

  // Endpoints
  
  // Email list endpoints
  router.post('/mailing-list/join', createHandler(EmailListController.joinMailingList));
  router.post('/mailing-list/leave', createHandler(EmailListController.leaveMailingList));
  
  // Event endpoints - Fixed route parameter syntax
  router.get('/events', createHandler(EventController.getAllEvents));
  router.get('/events/:id', createHandler(EventController.getEventById));
  
  return router;
}