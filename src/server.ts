import express from 'express';
import { setupPublicApi } from './api-public';
import { setupAdminApi } from './api-admin';

export async function startServer() {
  const app = express();
  const port = parseInt(process.env.PORT || '3000', 10);
  
  //  Basic middleware
  app.use(express.json());
  
  //  Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });
  
  //  Mount Public / Admin Endpoints On Seperate Routes
  app.use('/api/v1', setupPublicApi());
  app.use('/admin/api/v1', setupAdminApi());
  
  //  Start the server
  return new Promise<void>((resolve) => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Public API available at http://localhost:${port}/api/v1`);
      console.log(`Admin API available at http://localhost:${port}/admin/api/v1`);
      resolve();
    });
  });
}