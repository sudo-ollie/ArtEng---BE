import { container } from './container';
import { AuditLoggerService } from './auditLogger';

//  Export specific services as convenience methods
export const auditLogger: AuditLoggerService = container.get('auditLogger');

//  Re-export container
export { container };

//  Re-export service types
export type { AuditLoggerService } from './auditLogger';