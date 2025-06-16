import { PrismaClient } from '@prisma/client';
import { AuditLoggerService } from './auditLogger';
import { EventRepository } from '../repositories/event.service';
import { EmailListService } from './emailList';
import { AuditLogRepository } from '../repositories/audit-log.repository';

class ServiceContainer {
  private prisma: PrismaClient;
  public auditLogger: AuditLoggerService;
  public eventService: EventRepository;
  public mailingList: EmailListService;
  public auditLogService: AuditLogRepository;
  
  constructor() {
    // Prisma Config
    this.prisma = new PrismaClient({
      log: [
        { level: 'warn', emit: 'stdout' },
        { level: 'error', emit: 'stdout' },
      ],
      errorFormat: 'pretty',
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
    
    // Services
    this.auditLogger = new AuditLoggerService(this.prisma);
    this.auditLogService = new AuditLogRepository(this.prisma, this.auditLogger);
    this.eventService = new EventRepository(this.prisma, this.auditLogger);
    this.mailingList = new EmailListService(this.prisma, this.auditLogger);
  }

  async disconnect() {
    try {
      await this.prisma.$disconnect();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  }

  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

export const services = new ServiceContainer();

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await services.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await services.disconnect();
  process.exit(0);
});