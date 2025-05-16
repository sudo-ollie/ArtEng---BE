import { Router } from 'express';


export function setupAdminApi() {
  const router = Router();
  
  //    Test Endpoint
  router.get('/', (req, res) => {
    res.json({
      name: 'ArtEng Admin API',
      version: '1.0.0',
      status: 'online'
    });
  });
  
  //    Mount Endpoints Here
  
  return router;
}