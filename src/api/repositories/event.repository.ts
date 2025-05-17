import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { Event } from '../../types/event';

const prisma = new PrismaClient();


export class EventRepository implements BaseRepository<Event> {
  // Your repository methods...
  async findAll(filter?: Partial<Event>): Promise<Event[]> {
    return prisma.event.findMany({
      where: filter as any
    });
  }

  async findById(id: string): Promise<Event | null> {
    return prisma.event.findUnique({
      where: { id }
    });
  }

  async create(data: Omit<Event, 'id'>): Promise<Event> {
    return prisma.event.create({
      data: data as any
    });
  }

  async update(id: string, data: Partial<Omit<Event, 'id'>>): Promise<Event | null> {
    return prisma.event.update({
      where: { id },
      data: data as any
    });
  }

  async delete(id: string): Promise<boolean> {
    await prisma.event.delete({
      where: { id }
    });
    return true;
  }
}