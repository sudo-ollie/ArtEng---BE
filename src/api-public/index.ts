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
  
  //    Mount Endpoints Here
  
  return router;
}