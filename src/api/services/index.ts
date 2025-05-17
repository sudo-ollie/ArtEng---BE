import { AuditLoggerService } from './auditLogger';

// Create and export services
export const auditLogger = new AuditLoggerService();

// Create and export service types
export type { AuditLoggerService } from './auditLogger';


class ServiceContainer {
  private services = new Map<string, any>();
  
  constructor() {
    // Register all services
    this.register('auditLog', auditLogger);

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