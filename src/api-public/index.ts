import { Router } from 'express';

export function setupPublicApi() {
  const router = Router();

  //    Test Endpoint
  router.get('/', (req, res) => {
    res.json({
      name: 'ArtEng Public API',
      version: '1.0.0',
      status: 'online'
    });
  });

  //    Dev Debugging
  router.use((req, res, next) => {
    console.log("API-PUBLIC DEBUGGING:", {
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      path: req.path,
      url: req.url,
    });
    next();
  });

  //    Mount Endpoints Here
  
  return router;
}