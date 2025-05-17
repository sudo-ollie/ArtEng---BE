import { prisma } from '../db/client';
import { BaseRepository } from './base.repository';
import { AuditLog } from '../../types/auditlog';
import { mapPrismaModel } from '../../types/prisma-utils';

export class AuditLogRepository implements BaseRepository<AuditLog> {
  //    Get All Logs
  async findAll(filter?: Partial<AuditLog>): Promise<AuditLog[]> {
    const logs = await prisma.auditLog.findMany({
      where: filter as any
    });
    return logs.map((log: AuditLog) => mapPrismaModel<AuditLog>(log));
  }

  //    Get Audit Log By Id
  async findById(id: string): Promise<AuditLog | null> {
    const log = await prisma.auditLog.findUnique({
      where: { id }
    });
    return log ? mapPrismaModel<AuditLog>(log as AuditLog) : null;
  }

  //    Create Audit Log
  async create(data: Omit<AuditLog, 'id'>): Promise<AuditLog> {
    const log = await prisma.auditLog.create({
      data: data as any
    });
    return mapPrismaModel<AuditLog>(log as AuditLog);
  }

  //    Edit Audit Log
  async update(id: string, data: Partial<Omit<AuditLog, 'id'>>): Promise<AuditLog | null> {
    const log = await prisma.auditLog.update({
      where: { id },
      data: data as any
    });
    return mapPrismaModel<AuditLog>(log as AuditLog);
  }

  //    Delete Audit Log
  async delete(id: string): Promise<boolean> {
    await prisma.auditLog.delete({
      where: { id }
    });
    return true;
  }
}