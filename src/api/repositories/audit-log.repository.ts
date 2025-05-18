import { prisma } from '../db/client';
import { AuditLevel } from '../../enums/enumsRepo';
import { AuditLog } from '../../types/auditlog';
import { PrismaClient } from '.prisma/client';
import { mapPrismaModel } from '../../types/prisma-utils';
import { services } from '../services/container';

export class AuditLogService {
  
  constructor(private readonly prisma: PrismaClient) {
  }
  
  async getAllLogs(): Promise<AuditLog[]> {
    try {
      const logs = await prisma.auditLog.findMany();
      return logs.map((log) => mapPrismaModel<AuditLog>(log));
    } catch (error) {
      console.error('Error Fetching Audit Logs:', error);
      await services.auditLogger.auditLog(
        `Error Fetching Audit Logs: ${error}`,
        AuditLevel.Error,
        'SYSTEM'
      );
      return [];
    }
  }
  
  async getLogById(id: string): Promise<AuditLog | null> {
    try {
      const log = await prisma.auditLog.findUnique({
        where: { id }
      });
      return log ? mapPrismaModel<AuditLog>(log) : null;
    } catch (error) {
      console.error(`Error Fetching Audit Log-${id}:`, error);
      await services.auditLogger.auditLog(
        `Error Fetching Audit Log-${id}: ${error}`,
        AuditLevel.Error,
        'SYSTEM'
      );
      return null;
    }
  }
  
  async createLog(data: Omit<AuditLog, 'id'>, userId: string): Promise<{ success: boolean; message: string; log?: AuditLog }> {
    try {
      const log = await prisma.auditLog.create({
        data: data as any
      });
      
      await services.auditLogger.auditLog(
        `Created Audit Log - ${log.id}`,
        AuditLevel.Create,
        userId
      );
      
      return { 
        success: true, 
        message: 'Audit Log Created Successfully',
        log: mapPrismaModel<AuditLog>(log)
      };
    } catch (error) {
      console.error('Error Creating Audit Log:', error);
      await services.auditLogger.auditLog(
        `Error Creating Audit Log: ${error}`,
        AuditLevel.Error,
        'SYSTEM'
      );
      return { success: false, message: 'Failed To Create Audit Log' };
    }
  }
}