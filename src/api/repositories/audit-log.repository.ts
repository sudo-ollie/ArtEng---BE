import { PrismaClient } from '.prisma/client';
import { AuditLevel } from '../../enums/enumsRepo';
import { AuditLog } from '../../types/auditlog';
import { mapPrismaModel } from '../../types/prisma-utils';
import { AuditLoggerService } from '../services/auditLogger';
import { AuditLogQueryOptions } from '../../types/AuditLogQueryOptions';
import { PaginatedAuditLogs } from '../../types/PaginatedAuditLogs';

const sanitizeString = (input: string | undefined): string => {
  if (!input) return '';
  return input.toString().trim().replace(/[<>]/g, '');
};

const sanitizeNumber = (input: string | number | undefined, defaultValue: number = 0): number => {
  if (input === undefined || input === null) return defaultValue;
  const num = typeof input === 'string' ? parseInt(input, 10) : Number(input);
  return isNaN(num) ? defaultValue : Math.max(0, num);
};

export class AuditLogRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditLogger: AuditLoggerService
  ) {}

  async getAllLogs(): Promise<AuditLog[]> {
    try {
      const logs = await this.prisma.auditLog.findMany({
        orderBy: { logDT: 'desc' }
      });
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

  // Enhanced method with pagination, filtering, and sorting
  async getLogsPaginated(options: AuditLogQueryOptions): Promise<PaginatedAuditLogs> {
    try {
      const {
        limit = 50,
        skip = 0,
        sort = 'desc',
        dateFrom,
        dateTo,
        actionTypes,
        account,
        searchTerm
      } = options;

      // Sanitize inputs
      const sanitizedLimit = sanitizeNumber(limit, 50);
      const sanitizedSkip = sanitizeNumber(skip, 0);
      const sanitizedSort = sort === 'asc' ? 'asc' : 'desc';
      const sanitizedAccount = account ? sanitizeString(account) : undefined;
      const sanitizedSearchTerm = searchTerm ? sanitizeString(searchTerm) : undefined;

      // Build where clause
      const where: any = {};

      if (sanitizedAccount) {
        where.account = { contains: sanitizedAccount, mode: 'insensitive' };
      }

      if (actionTypes && actionTypes.length > 0) {
        where.actionType = { in: actionTypes };
      }

      if (dateFrom || dateTo) {
        where.logDT = {};
        if (dateFrom) where.logDT.gte = dateFrom;
        if (dateTo) where.logDT.lte = dateTo;
      }

      if (sanitizedSearchTerm) {
        where.OR = [
          { logMessage: { contains: sanitizedSearchTerm, mode: 'insensitive' } },
          { account: { contains: sanitizedSearchTerm, mode: 'insensitive' } }
        ];
      }

      // Get total count for pagination
      const total = await this.prisma.auditLog.count({ where });

      // Get logs with pagination
      const logs = await this.prisma.auditLog.findMany({
        where,
        orderBy: { logDT: sanitizedSort },
        take: Math.min(sanitizedLimit, 100), // Cap at 100 for performance
        skip: sanitizedSkip
      });

      const totalPages = Math.ceil(total / sanitizedLimit);
      const currentPage = Math.floor(sanitizedSkip / sanitizedLimit) + 1;

      return {
        logs: logs.map((log) => mapPrismaModel<AuditLog>(log)),
        total,
        page: currentPage,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      };
    } catch (error) {
      console.error("Error Fetching Paginated Audit Logs:", error);
      await this.auditLogger.auditLog(
        `Error Fetching Paginated Audit Logs: ${error}`,
        AuditLevel.Error,
        "SYSTEM"
      );
      
      return {
        logs: [],
        total: 0,
        page: 1,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      };
    }
  }

  async getLogsByUserId(userId: string): Promise<AuditLog[]> {
    try {
      const sanitizedUserId = sanitizeString(userId);
      if (!sanitizedUserId) {
        throw new Error('Invalid user ID provided');
      }

      const logs = await this.prisma.auditLog.findMany({
        where: { account: sanitizedUserId },
        orderBy: { logDT: 'desc' }
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

  // Enhanced user logs with pagination
  async getUserLogsPaginated(userId: string, options: Omit<AuditLogQueryOptions, 'account'>): Promise<PaginatedAuditLogs> {
    const sanitizedUserId = sanitizeString(userId);
    if (!sanitizedUserId) {
      throw new Error('Invalid user ID provided');
    }

    return this.getLogsPaginated({
      ...options,
      account: sanitizedUserId
    });
  }

  // Get logs by date range
  async getLogsByDateRange(dateFrom: Date, dateTo: Date, options: Omit<AuditLogQueryOptions, 'dateFrom' | 'dateTo'> = {}): Promise<PaginatedAuditLogs> {
    return this.getLogsPaginated({
      ...options,
      dateFrom,
      dateTo
    });
  }

  // Get logs by action type
  async getLogsByActionType(actionTypes: AuditLevel[], options: Omit<AuditLogQueryOptions, 'actionTypes'> = {}): Promise<PaginatedAuditLogs> {
    return this.getLogsPaginated({
      ...options,
      actionTypes
    });
  }

  // Search logs by term
  async searchLogs(searchTerm: string, options: Omit<AuditLogQueryOptions, 'searchTerm'> = {}): Promise<PaginatedAuditLogs> {
    const sanitizedSearchTerm = sanitizeString(searchTerm);
    if (!sanitizedSearchTerm) {
      throw new Error('Invalid search term provided');
    }

    return this.getLogsPaginated({
      ...options,
      searchTerm: sanitizedSearchTerm
    });
  }

  // Get recent logs (last N logs)
  async getRecentLogs(count: number = 10): Promise<AuditLog[]> {
    try {
      const sanitizedCount = sanitizeNumber(count, 10);
      
      const logs = await this.prisma.auditLog.findMany({
        orderBy: { logDT: 'desc' },
        take: Math.min(sanitizedCount, 100) // Cap at 100
      });
      
      return logs.map((log) => mapPrismaModel<AuditLog>(log));
    } catch (error) {
      console.error("Error Fetching Recent Audit Logs:", error);
      await this.auditLogger.auditLog(
        `Error Fetching Recent Audit Logs: ${error}`,
        AuditLevel.Error,
        "SYSTEM"
      );
      return [];
    }
  }

  // Get log statistics
  async getLogStatistics(dateFrom?: Date, dateTo?: Date): Promise<{
    totalLogs: number;
    logsByActionType: { actionType: AuditLevel; count: number }[];
    topUsers: { account: string; count: number }[];
    dailyStats?: { date: string; count: number }[];
  }> {
    try {
      const where: any = {};
      
      if (dateFrom || dateTo) {
        where.logDT = {};
        if (dateFrom) where.logDT.gte = dateFrom;
        if (dateTo) where.logDT.lte = dateTo;
      }

      // Total logs
      const totalLogs = await this.prisma.auditLog.count({ where });

      // Logs by action type
      const logsByActionType = await this.prisma.auditLog.groupBy({
        by: ['actionType'],
        where,
        _count: { actionType: true }
      });

      // Top users
      const topUsers = await this.prisma.auditLog.groupBy({
        by: ['account'],
        where,
        _count: { account: true },
        orderBy: { _count: { account: 'desc' } },
        take: 10
      });

      return {
        totalLogs,
        logsByActionType: logsByActionType.map(item => ({
          actionType: item.actionType as AuditLevel,
          count: item._count.actionType
        })),
        topUsers: topUsers.map(item => ({
          account: item.account,
          count: item._count.account
        }))
      };
    } catch (error) {
      console.error("Error Fetching Log Statistics:", error);
      await this.auditLogger.auditLog(
        `Error Fetching Log Statistics: ${error}`,
        AuditLevel.Error,
        "SYSTEM"
      );
      
      return {
        totalLogs: 0,
        logsByActionType: [],
        topUsers: []
      };
    }
  }

  async createLog(
    data: Omit<AuditLog, "id">,
    userId: string
  ): Promise<{ success: boolean; message: string; log?: AuditLog }> {
    try {
      const sanitizedUserId = sanitizeString(userId);
      if (!sanitizedUserId) {
        throw new Error('Invalid user ID provided');
      }

      const log = await this.prisma.auditLog.create({
        data: data as any,
      });

      await this.auditLogger.auditLog(
        `Created Audit Log - ${log.id}`,
        AuditLevel.Create,
        sanitizedUserId
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

  // Delete old logs (for maintenance)
  async deleteOldLogs(olderThanDays: number): Promise<{ success: boolean; deletedCount: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - Math.max(1, sanitizeNumber(olderThanDays, 90)));

      const deleteResult = await this.prisma.auditLog.deleteMany({
        where: {
          logDT: {
            lt: cutoffDate
          }
        }
      });

      await this.auditLogger.auditLog(
        `Deleted ${deleteResult.count} old audit logs older than ${olderThanDays} days`,
        AuditLevel.System,
        "SYSTEM"
      );

      return {
        success: true,
        deletedCount: deleteResult.count
      };
    } catch (error) {
      console.error("Error Deleting Old Audit Logs:", error);
      await this.auditLogger.auditLog(
        `Error Deleting Old Audit Logs: ${error}`,
        AuditLevel.Error,
        "SYSTEM"
      );
      return { success: false, deletedCount: 0 };
    }
  }
}