import { Router } from 'express';
import { EmailListController } from "./api/controllers/emailList.controller";
import { EventController } from './api-public/controllers/event.controller';
import { createHandler } from './api/utils/routerTypes';
import { sanitizeInput } from './api/middleware/validation';
import { apiLimiter } from './api/middleware/ratelimiter';

export function setupPublicApi() {
  const router = Router();

  router.get('/', (req, res) => {
    res.json({
      name: 'ArtEng Public API',
      version: '1.0.0',
      status: 'online'
    });
  });

  router.use(sanitizeInput);

  // Development debugging middleware
  if (process.env.NODE_ENV === 'development') {
    router.use((req, res, next) => {
      console.log("API-PUBLIC DEBUGGING:", {
        originalUrl: req.originalUrl,
        baseUrl: req.baseUrl,
        path: req.path,
        url: req.url,
        method: req.method,
        query: req.query,
      });
      next();
    });
  }

  // Mailing List Endpoints
  router.post('/mailing-list/join', 
    apiLimiter,
    EmailListController.validateJoinMailingList,
    createHandler(EmailListController.joinMailingList)
  );
  
  router.post('/mailing-list/leave', 
    apiLimiter,
    EmailListController.validateLeaveMailingList,
    createHandler(EmailListController.leaveMailingList)
  );
  
  // Public Event Endpoints
  router.get('/events', 
    apiLimiter,
    createHandler(EventController.getAllEvents)
  );
  
  router.get('/events/:id', 
    apiLimiter,
    createHandler(EventController.getEventById)
  );
  
  return router;
}