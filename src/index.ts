import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { startServer } from './server';
import { AuditLoggerService } from './api/services/auditLogger';
import { prisma } from './api/db/client';


//  Load environment variables - prioritize .env.local if it exists
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}
dotenv.config();

const auditLog = new AuditLoggerService(prisma);

//  Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});