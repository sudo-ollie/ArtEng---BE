import { prisma } from '../db/client';
import { AuditLoggerService } from './auditLogger';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { EventRepository } from '../repositories/event.repository';

// Define our services type map
type ServiceTypes = {
  auditLogger: AuditLoggerService;
  auditLogRepository: AuditLogRepository;
  eventRepository: EventRepository;
};

class ServiceContainer {
  private services = new Map<keyof ServiceTypes, any>();
  
  constructor() {
    // Register all services
    this.register('auditLogger', new AuditLoggerService());
    this.register('auditLogRepository', new AuditLogRepository());
    this.register('eventRepository', new EventRepository());
  }

  register<K extends keyof ServiceTypes>(name: K, instance: ServiceTypes[K]): void {
    this.services.set(name, instance);
  }

  get<K extends keyof ServiceTypes>(name: K): ServiceTypes[K] {
    if (!this.services.has(name)) {
      throw new Error(`Service ${String(name)} not registered`);
    }
    return this.services.get(name) as ServiceTypes[K];
  }
}

// Export a singleton instance
export const container = new ServiceContainer();