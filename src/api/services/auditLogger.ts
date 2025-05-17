import { PrismaClient } from '@prisma/client';
import { AuditLog } from "../../types/typesRepo"
import { AuditLevel } from "../../enums/enumsRepo"

export class AuditLoggerService {
  private prisma: PrismaClient;
  private isEnabled: boolean;
  
  constructor(prismaClient?: PrismaClient) {
    if (!process.env.DATABASE_URL) {
      console.warn('WARNING: DATABASE_URL environment variable is not defined. Audit logging will be disabled.');
      this.isEnabled = false;
    } else {
        console.log("Logger Active")
      this.isEnabled = true;
    }
    
    this.prisma = prismaClient || new PrismaClient();
  }
  
  /**
   * Log an audit event
   * @param logMessage Description of the action
   * @param actionType Type of action (use AuditLevel enum)
   * @param account User or system account that performed the action
   * @returns Promise with the created audit log entry or null if logging is disabled
   */

  async auditLog(
    logMessage: string, 
    actionType: AuditLevel, 
    account: string
  ): Promise<AuditLog | null> {
    //  Return null if logging isn't working to avoid blocking program
    if (!this.isEnabled) {
      console.warn(`Audit log skipped (logging disabled): ${account} - ${logMessage}`);
      return null;
    }
    
    try {
        console.log("Inside Logger")
      const auditLog = await this.prisma.auditLog.create({
        data: {
          logDT: new Date(),
          logMessage,
          actionType,
          account
        }
      });
      
      return auditLog;
    } catch (error) {
      //    Log the error but don't throw it to avoid disrupting the application
      console.error('Error logging audit event:', error);
      return null;
    }
  }
  
  //    System Log Mini Method
  async logSystemEvent(message: string): Promise<AuditLog | null> {
    return this.auditLog(message, AuditLevel.System, 'SYSTEM');
  }
  
  //    Account Specific Log Retrival 
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
  
  //    Final Clean Up
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}