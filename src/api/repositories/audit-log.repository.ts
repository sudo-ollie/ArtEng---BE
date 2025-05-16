import { AuditLog } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { prisma } from '../db/client';

export class AuditLogRepository implements BaseRepository<AuditLog> {

  //    Get All Logs
  async findAll(filter?: Partial<AuditLog>): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: filter
    });
  }

  //    Get Audit Log By Id
  async findById(id: string): Promise<AuditLog | null> {
    return prisma.auditLog.findUnique({
      where: { id }
    });
  }

  //    Create Audit Log
  async create(data: Omit<AuditLog, 'id'>): Promise<AuditLog> {
    return prisma.auditLog.create({
      data
    });
  }

  //    Edit Audit Log
  async update(id: string, data: Partial<Omit<AuditLog, 'id'>>): Promise<AuditLog | null> {
    return prisma.auditLog.update({
      where: { id },
      data
    });
  }

  //    Delete Audit Log
  async delete(id: string): Promise<boolean> {
    await prisma.auditLog.delete({
      where: { id }
    });
    return true;
  }
}