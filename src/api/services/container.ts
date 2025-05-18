// services/container.ts
import { PrismaClient } from '@prisma/client';
import { AuditLoggerService } from './auditLogger';
import { EventRepository } from '../repositories/event.service';
import { EmailListService } from './emailList';
import { AuditLogRepository } from '../repositories/aufdit-log.repository';

class ServiceContainer {
  private prisma: PrismaClient;
  public auditLogger: AuditLoggerService;
  public eventService: EventRepository;
  public mailingList: EmailListService;
  public auditLogService: AuditLogRepository;
  
  constructor() {
    //  Prisma
    this.prisma = new PrismaClient();
    
    //  Services
    this.auditLogger = new AuditLoggerService(this.prisma);
    this.auditLogService = new AuditLogRepository(this.prisma, this.auditLogger);
    this.eventService = new EventRepository(this.prisma, this.auditLogger);
    this.mailingList = new EmailListService(this.prisma, this.auditLogger);
  }
}

export const services = new ServiceContainer();