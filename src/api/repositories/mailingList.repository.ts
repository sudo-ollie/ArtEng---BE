import { PrismaClient } from '@prisma/client';
import { prisma } from '../db/client';
import { BaseRepository } from './base.repository';
import { MailingList } from "../../types/typesRepo"


export class MailingListRepository implements BaseRepository<MailingList> {

  //    Get All Entries
  async findAll(filter?: Partial<MailingList>): Promise<MailingList[]> {
    return prisma.mailingList.findMany({
      where: filter as any
    });
  }

  //    Get Entry By Id
  async findById(id: string): Promise<MailingList | null> {
    return prisma.mailingList.findUnique({
      where: { id }
    });
  }

  //    Create Entry
  async create(data: Omit<MailingList, 'id'>): Promise<MailingList> {
    return prisma.mailingList.create({
      data: data as any
    });
  }

  //    Edit Entry
  async update(id: string, data: Partial<Omit<MailingList, 'id'>>): Promise<MailingList | null> {
    return prisma.mailingList.update({
      where: { id },
      data: data as any
    });
  }

  //    Delete Entry
  async delete(id: string): Promise<boolean> {
    await prisma.mailingList.delete({
      where: { id }
    });
    return true;
  }
  
  //    Find By Email
  async findByEmail(email: string): Promise<MailingList | null> {
    return prisma.mailingList.findFirst({
      where: { email }
    });
  }
  
  //    Get Paginated
  async findPaginated(page: number = 1, limit: number = 10): Promise<{ items: MailingList[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const [total, items] = await Promise.all([
      prisma.mailingList.count(),
      prisma.mailingList.findMany({
        skip,
        take: limit,
        orderBy: { registerTime: 'desc' }
      })
    ]);
    
    return { items, total };
  }
}