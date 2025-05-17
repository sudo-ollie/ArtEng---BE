import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { Event } from '../../types/event';

export class EventRepository implements BaseRepository<Event> {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findAll(filter?: Partial<Event>): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: filter as any
    });
  }

  async findById(id: string): Promise<Event | null> {
    return this.prisma.event.findUnique({
      where: { id }
    });
  }

  async create(data: Omit<Event, 'id'>): Promise<Event> {
    return this.prisma.event.create({
      data: data as any
    });
  }

  async update(id: string, data: Partial<Omit<Event, 'id'>>): Promise<Event | null> {
    return this.prisma.event.update({
      where: { id },
      data: data as any
    });
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.event.delete({
      where: { id }
    });
    return true;
  }
}