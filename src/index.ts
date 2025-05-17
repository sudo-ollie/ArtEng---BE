//#region Imports

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { startServer } from './server';
import { AuditLoggerService } from './api/services/auditLogger';

//#endregion

// Load environment variables - prioritize .env.local if it exists
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}
dotenv.config();

const auditLog = new AuditLoggerService()

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});