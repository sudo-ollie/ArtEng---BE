import { PrismaClient } from '@prisma/client';
import { AuditLog } from "../../types/typesRepo"
import { AuditLevel } from "../../enums/enumsRepo"
import { StructuredLogger } from './logger';

export interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
  geolocation?: string;
  timestamp: Date;
}

export class AuditLoggerService {
  private isEnabled: boolean;
  
  constructor(private readonly prisma: PrismaClient) {
    if (!process.env.DATABASE_URL) {
      console.warn('WARNING: DATABASE_URL environment variable is not defined. Audit logging will be disabled.');
      this.isEnabled = false;
    } else {
      StructuredLogger.logInfo("Audit Logger Initialized");
      this.isEnabled = true;
    }
  }
  
  async auditLog(
    logMessage: string, 
    actionType: AuditLevel, 
    account: string,
    context?: AuditContext
  ): Promise<AuditLog | null> {
    if (!this.isEnabled) {
      StructuredLogger.logInfo(`Audit log skipped (logging disabled): ${account} - ${logMessage}`);
      return null;
    }
    
    try {
      let enhancedMessage = logMessage;
      if (context) {
        const contextString = JSON.stringify(context);
        enhancedMessage = `${logMessage} [Context: ${contextString}]`;
      }

      const auditLog = await this.prisma.auditLog.create({
        data: {
          logDT: context?.timestamp || new Date(),
          logMessage: enhancedMessage,
          actionType,
          account
        }
      });
      
      StructuredLogger.logInfo('Audit Event', {
        auditId: auditLog.id,
        message: logMessage,
        actionType: AuditLevel[actionType],
        account,
        context
      });
      
      return auditLog;
    } catch (error) {
      StructuredLogger.logError(
        new Error(`Error logging audit event: ${error}`),
        { message: logMessage, account, actionType }
      );
      return null;
    }
  }

  async auditAuthEvent(
    event: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'TOKEN_REFRESH',
    userId: string,
    context: AuditContext
  ): Promise<AuditLog | null> {
    return this.auditLog(
      `Authentication event: ${event}`,
      event.includes('FAILED') ? AuditLevel.Error : AuditLevel.System,
      userId,
      context
    );
  }

  async auditDataAccess(
    resource: string,
    action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE',
    userId: string,
    resourceId?: string,
    context?: AuditContext
  ): Promise<AuditLog | null> {
    return this.auditLog(
      `Data access: ${action} on ${resource}${resourceId ? ` (ID: ${resourceId})` : ''}`,
      action === 'DELETE' ? AuditLevel.Error : AuditLevel.System,
      userId,
      context
    );
  }

  async auditPermissionElevation(
    userId: string,
    fromRole: string,
    toRole: string,
    context: AuditContext
  ): Promise<AuditLog | null> {
    return this.auditLog(
      `Permission elevation: ${fromRole} -> ${toRole}`,
      AuditLevel.Error,
      userId,
      context
    );
  }

  async auditConfigChange(
    setting: string,
    oldValue: string,
    newValue: string,
    userId: string,
    context?: AuditContext
  ): Promise<AuditLog | null> {
    return this.auditLog(
      `Configuration change: ${setting} changed from "${oldValue}" to "${newValue}"`,
      AuditLevel.System,
      userId,
      context
    );
  }

  //  Old Method - Note To Transfer
  async logSystemEvent(message: string): Promise<AuditLog | null> {
    return this.auditLog(message, AuditLevel.System, 'SYSTEM');
  }
  
  async getLogsForAccount(account: string): Promise<AuditLog[]> {
    if (!this.isEnabled) {
      console.warn('Audit log retrieval skipped: logging is disabled');
      return [];
    }
    
    try {
      const logs = await this.prisma.auditLog.findMany({
        where: {
          account
        },
        orderBy: {
          logDT: 'desc'
        }
      });
      
      return logs;
    } catch (error) {
      console.error('Error retrieving audit logs:', error);
      return [];
    }
  }
}