// services/container.ts
import { PrismaClient } from '@prisma/client';
import { AuditLoggerService } from './auditLogger';
import { EventService } from '../repositories/event.repository';
import { EmailListService } from './emailList';
import { AuditLogService } from '../repositories/audit-log.repository';

class ServiceContainer {
  private prisma: PrismaClient;
  public auditLogger: AuditLoggerService;
  public eventService: EventService;
  public mailingList: EmailListService;
  public auditLogService: AuditLogService;
  
  constructor() {
    //  Prisma
    this.prisma = new PrismaClient();
    
    //  Services
    this.auditLogger = new AuditLoggerService(this.prisma);
    this.eventService = new EventService(this.prisma);
    this.mailingList = new EmailListService(this.prisma);
    this.auditLogService = new AuditLogService(this.prisma);
  }
}

export const services = new ServiceContainer();