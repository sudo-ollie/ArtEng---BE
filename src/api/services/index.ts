import { PrismaClient } from '@prisma/client';
import { AuditLoggerService } from './auditLogger';
import { EventRepository } from '../repositories/event.repository';

// Initialize Prisma client
const prisma = new PrismaClient();

// Create and export services with the shared Prisma instance
export const auditLogger = new AuditLoggerService(prisma);
export const eventRepository = new EventRepository(prisma);

// Create and export service types
export type { AuditLoggerService } from './auditLogger';