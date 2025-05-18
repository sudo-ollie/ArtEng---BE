import { PrismaClient } from '.prisma/client';
import { AuditLevel } from '../../enums/enumsRepo';
import { AuditLog } from '../../types/auditlog';
import { mapPrismaModel } from '../../types/prisma-utils';
import { AuditLoggerService } from '../services/auditLogger';

export class AuditLogRepository{
    constructor(
    private readonly prisma: PrismaClient,
    private readonly auditLogger: AuditLoggerService
  ) {}

  async getAllLogs(): Promise<AuditLog[]> {
    try {
      const logs = await this.prisma.auditLog.findMany();
      return logs.map((log) => mapPrismaModel<AuditLog>(log));
    } catch (error) {
      console.error("Error Fetching Audit Logs:", error);
      await this.auditLogger.auditLog(
        `Error Fetching Audit Logs: ${error}`,
        AuditLevel.Error,
        "SYSTEM"
      );
      return [];
    }
  }

  async getLogsByUserId(userId: string): Promise<AuditLog[]> {
    try {
      const logs = await this.prisma.auditLog.findMany({
        where: { account: userId },
      });
      return logs.map((log) => mapPrismaModel<AuditLog>(log));
    } catch (error) {
      console.error(`Error Fetching Audit Logs for User-${userId}:`, error);
      await this.auditLogger.auditLog(
        `Error Fetching Audit Logs for User-${userId}: ${error}`,
        AuditLevel.Error,
        "SYSTEM"
      );
      return [];
    }
  }

  async createLog(
    data: Omit<AuditLog, "id">,
    userId: string
  ): Promise<{ success: boolean; message: string; log?: AuditLog }> {
    try {
      const log = await this.prisma.auditLog.create({
        data: data as any,
      });

      await this.auditLogger.auditLog(
        `Created Audit Log - ${log.id}`,
        AuditLevel.Create,
        userId
      );

      return {
        success: true,
        message: "Audit Log Created Successfully",
        log: mapPrismaModel<AuditLog>(log),
      };
    } catch (error) {
      console.error("Error Creating Audit Log:", error);
      await this.auditLogger.auditLog(
        `Error Creating Audit Log: ${error}`,
        AuditLevel.Error,
        "SYSTEM"
      );
      return { success: false, message: "Failed To Create Audit Log" };
    }
  }
}
