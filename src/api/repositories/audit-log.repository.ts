import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { AuditLog } from '../../types/auditlog';

const prisma = new PrismaClient();

export class AuditLogRepository implements BaseRepository<AuditLog> {
  //    Get All Logs
  async findAll(filter?: Partial<AuditLog>): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: filter as any
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
      data: data as any
    });
  }

  //    Edit Audit Log
  async update(id: string, data: Partial<Omit<AuditLog, 'id'>>): Promise<AuditLog | null> {
    return prisma.auditLog.update({
      where: { id },
      data: data as any
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