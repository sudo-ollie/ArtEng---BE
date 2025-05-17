import { PrismaClient } from '@prisma/client';
import { AuditLoggerService } from './auditLogger';
import { EventRepository } from '../repositories/event.repository';

class ServiceContainer {
  private services = new Map<string, any>();
  
  constructor() {
    // Register all services
    this.register('auditLogger', AuditLoggerService);
    this.register('eventRepository', EventRepository);
  }

  register<T>(name: string, instance: T): void {
    this.services.set(name, instance);
  }

  get<T>(name: string): T {
    if (!this.services.has(name)) {
      throw new Error(`Service ${name} not registered`);
    }
    return this.services.get(name) as T;
  }
}

export const container = new ServiceContainer();