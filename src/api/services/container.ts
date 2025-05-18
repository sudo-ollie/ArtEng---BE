// services/container.ts
import { PrismaClient } from '@prisma/client';
import { AuditLoggerService } from './auditLogger';
import { EventService } from '../repositories/event.service';
import { EmailListService } from './emailList';
import { AuditLogService } from '../repositories/aufdit-log.repository';

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
    this.auditLogService = new AuditLogService(this.prisma, this.auditLogger);
    this.eventService = new EventService(this.prisma, this.auditLogger);
    this.mailingList = new EmailListService(this.prisma, this.auditLogger);
  }
}

export const services = new ServiceContainer();